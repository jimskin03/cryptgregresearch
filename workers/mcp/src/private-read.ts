import { DEFAULT_SUPABASE_URL } from './oauth.ts';

// Read-only PostgREST for the verified user token.
// The publishable key identifies the project. The bearer is the caller's
// token, so RLS applies. There is no service role and no write method.

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface PrivateReadOptions {
  userId: string;
  token: string;
  publishableKey: string;
  fetchImpl?: typeof fetch;
  supabaseUrl?: string;
}

export type PrivateReadResult =
  | { ok: true; body: unknown }
  | { ok: false; status: number; message: string };

type Row = Record<string, unknown>;

type RowsResult =
  | { ok: true; rows: Row[] }
  | { ok: false; status: number; message: string };

const LEDGER_FIELDS = [
  'id',
  'type',
  'direction',
  'status',
  'source_type',
  'reference_no',
  'record_date',
  'description',
  'category_id',
  'legacy_category',
  'reversal_of',
  'amount',
  'signed_amount',
] as const;

const SECURITY_FIELDS = [
  'id',
  'isin',
  'figi',
  'security_name',
  'ticker',
  'exchange_code',
  'currency',
] as const;

const HOLDING_FIELDS = [
  'id',
  'security_id',
  'quantity',
  'average_cost',
  'updated_at',
] as const;

const PRICE_FIELDS = ['security_id', 'price', 'currency', 'as_of'] as const;

const VAULT_FIELDS = ['id', 'name', 'slug'] as const;

const NOTE_FIELDS = ['id', 'title', 'slug', 'updated_at'] as const;

const LEDGER_SELECT =
  'id,type,direction,status,source_type,reference_no,record_date,description,category_id,legacy_category,reversal_of,amount::text,signed_amount::text';

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

function pick(row: Row, fields: readonly string[]): Row {
  const out: Row = {};
  for (const field of fields) {
    out[field] = Object.prototype.hasOwnProperty.call(row, field) ? row[field] : null;
  }
  return out;
}

function restUrl(supabaseUrl: string, table: string, query: Record<string, string>): string {
  const url = new URL(`${supabaseUrl}/rest/v1/${table}`);
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

function postgrestMessage(raw: string): string {
  if (!raw) return 'PostgREST error';
  try {
    const parsed = JSON.parse(raw) as { message?: unknown; error?: unknown; msg?: unknown };
    if (typeof parsed.message === 'string' && parsed.message.trim()) {
      return parsed.message.slice(0, 500);
    }
    if (typeof parsed.error === 'string' && parsed.error.trim()) {
      return parsed.error.slice(0, 500);
    }
    if (typeof parsed.msg === 'string' && parsed.msg.trim()) {
      return parsed.msg.slice(0, 500);
    }
  } catch {
    // Use the raw body below.
  }
  return raw.slice(0, 500);
}

async function getRows(
  fetchImpl: typeof fetch,
  url: string,
  publishableKey: string,
  token: string,
  profile: 'expense' | 'portfolio' | 'bookmarks',
): Promise<RowsResult> {
  let response: Response;
  try {
    response = await fetchImpl(url, {
      method: 'GET',
      redirect: 'manual',
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${token}`,
        'Accept-Profile': profile,
        Accept: 'application/json',
      },
    });
  } catch {
    return { ok: false, status: 0, message: 'PostgREST request failed' };
  }

  if (response.status >= 300 && response.status < 400) {
    return { ok: false, status: response.status, message: 'PostgREST redirect refused' };
  }

  let raw = '';
  try {
    raw = await response.text();
  } catch {
    return { ok: false, status: response.status, message: 'PostgREST response could not be read' };
  }

  if (!response.ok) {
    return { ok: false, status: response.status, message: postgrestMessage(raw) };
  }

  let parsed: unknown;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    return { ok: false, status: response.status, message: 'PostgREST response was not JSON' };
  }

  if (!Array.isArray(parsed)) {
    return { ok: false, status: response.status, message: 'PostgREST response was not a list' };
  }

  const rows: Row[] = [];
  for (const row of parsed) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      return { ok: false, status: response.status, message: 'PostgREST returned an unexpected row' };
    }
    rows.push(row as Row);
  }
  return { ok: true, rows };
}

function uuidIds(rows: Row[]): { ok: true; ids: string[] } | { ok: false; status: number; message: string } {
  const ids: string[] = [];
  for (const row of rows) {
    if (!isUuid(row.id)) {
      return { ok: false, status: 200, message: 'PostgREST returned an unexpected id' };
    }
    if (!ids.includes(row.id)) ids.push(row.id);
  }
  return { ok: true, ids };
}

function asOfMillis(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string' || value === '') return Number.NEGATIVE_INFINITY;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? Number.NEGATIVE_INFINITY : ms;
}

function latestPrices(rows: Row[]): Row[] {
  const sorted = [...rows].sort((a, b) => {
    const delta = asOfMillis(b.as_of) - asOfMillis(a.as_of);
    return delta === 0 ? 0 : delta > 0 ? 1 : -1;
  });
  const seen = new Set<string>();
  const out: Row[] = [];
  for (const row of sorted) {
    const key =
      typeof row.security_id === 'string' ? row.security_id : JSON.stringify(row.security_id ?? null);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(pick(row, PRICE_FIELDS));
  }
  return out;
}

function client(options: PrivateReadOptions):
  | {
      ok: true;
      userId: string;
      token: string;
      publishableKey: string;
      fetchImpl: typeof fetch;
      supabaseUrl: string;
    }
  | { ok: false; status: number; message: string } {
  if (!isUuid(options.userId)) {
    return { ok: false, status: 400, message: 'Verified user id is not a UUID' };
  }
  if (!options.token) {
    return { ok: false, status: 401, message: 'Missing verified token' };
  }
  return {
    ok: true,
    userId: options.userId,
    token: options.token,
    publishableKey: options.publishableKey,
    fetchImpl: options.fetchImpl || fetch,
    supabaseUrl: (options.supabaseUrl || DEFAULT_SUPABASE_URL).replace(/\/$/, ''),
  };
}

export async function readLedger(options: PrivateReadOptions): Promise<PrivateReadResult> {
  const ctx = client(options);
  if (!ctx.ok) return ctx;

  const accounts = await getRows(
    ctx.fetchImpl,
    restUrl(ctx.supabaseUrl, 'accounts', {
      select: 'id',
      user_id: `eq.${ctx.userId}`,
    }),
    ctx.publishableKey,
    ctx.token,
    'expense',
  );
  if (!accounts.ok) return accounts;

  const ids = uuidIds(accounts.rows);
  if (!ids.ok) return ids;

  if (ids.ids.length === 0) {
    return {
      ok: true,
      body: {
        accounts: [],
        transactions: [],
        notice: 'No expense account.',
      },
    };
  }

  const transactions = await getRows(
    ctx.fetchImpl,
    restUrl(ctx.supabaseUrl, 'counted_transactions', {
      select: LEDGER_SELECT,
      order: 'record_date.desc',
      limit: '1000',
    }),
    ctx.publishableKey,
    ctx.token,
    'expense',
  );
  if (!transactions.ok) return transactions;

  return {
    ok: true,
    body: {
      accounts: ids.ids.map((id) => ({ id })),
      transactions: transactions.rows.map((row) => pick(row, LEDGER_FIELDS)),
    },
  };
}

export async function readHoldings(options: PrivateReadOptions): Promise<PrivateReadResult> {
  const ctx = client(options);
  if (!ctx.ok) return ctx;

  const accounts = await getRows(
    ctx.fetchImpl,
    restUrl(ctx.supabaseUrl, 'accounts', {
      select: 'id',
      user_id: `eq.${ctx.userId}`,
    }),
    ctx.publishableKey,
    ctx.token,
    'portfolio',
  );
  if (!accounts.ok) return accounts;

  const ids = uuidIds(accounts.rows);
  if (!ids.ok) return ids;

  if (ids.ids.length === 0) {
    return {
      ok: true,
      body: {
        accounts: [],
        securities: [],
        holdings: [],
        prices: [],
        notice: 'No portfolio account.',
      },
    };
  }

  const accountFilter = `in.(${ids.ids.join(',')})`;

  const securities = await getRows(
    ctx.fetchImpl,
    restUrl(ctx.supabaseUrl, 'securities', {
      select: 'id,isin,figi,security_name,ticker,exchange_code,currency',
      account_id: accountFilter,
    }),
    ctx.publishableKey,
    ctx.token,
    'portfolio',
  );
  if (!securities.ok) return securities;

  const holdings = await getRows(
    ctx.fetchImpl,
    restUrl(ctx.supabaseUrl, 'holdings', {
      select: 'id,security_id,quantity,average_cost,updated_at',
      account_id: accountFilter,
    }),
    ctx.publishableKey,
    ctx.token,
    'portfolio',
  );
  if (!holdings.ok) return holdings;

  const prices = await getRows(
    ctx.fetchImpl,
    restUrl(ctx.supabaseUrl, 'prices', {
      select: 'security_id,price,currency,as_of',
      account_id: accountFilter,
      order: 'as_of.desc',
      limit: '2000',
    }),
    ctx.publishableKey,
    ctx.token,
    'portfolio',
  );
  if (!prices.ok) return prices;

  return {
    ok: true,
    body: {
      accounts: ids.ids.map((id) => ({ id })),
      securities: securities.rows.map((row) => pick(row, SECURITY_FIELDS)),
      holdings: holdings.rows.map((row) => pick(row, HOLDING_FIELDS)),
      prices: latestPrices(prices.rows),
    },
  };
}

export async function readNotes(options: PrivateReadOptions): Promise<PrivateReadResult> {
  const ctx = client(options);
  if (!ctx.ok) return ctx;

  const vaults = await getRows(
    ctx.fetchImpl,
    restUrl(ctx.supabaseUrl, 'vaults', {
      select: 'id,name,slug',
      user_id: `eq.${ctx.userId}`,
    }),
    ctx.publishableKey,
    ctx.token,
    'bookmarks',
  );
  if (!vaults.ok) return vaults;

  const ids = uuidIds(vaults.rows);
  if (!ids.ok) return ids;

  if (ids.ids.length === 0) {
    return {
      ok: true,
      body: {
        vaults: [],
        notes: [],
        notice: 'No bookmark vault.',
      },
    };
  }

  const notes = await getRows(
    ctx.fetchImpl,
    restUrl(ctx.supabaseUrl, 'notes', {
      select: 'id,title,slug,updated_at',
      vault_id: `in.(${ids.ids.join(',')})`,
      deleted_at: 'is.null',
    }),
    ctx.publishableKey,
    ctx.token,
    'bookmarks',
  );
  if (!notes.ok) return notes;

  return {
    ok: true,
    body: {
      vaults: vaults.rows.map((row) => pick(row, VAULT_FIELDS)),
      notes: notes.rows.map((row) => pick(row, NOTE_FIELDS)),
    },
  };
}
