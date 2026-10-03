// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { handleMcp } from '../src/index.ts';
import { DEFAULT_SUPABASE_PUBLISHABLE_KEY } from '../src/oauth.ts';

const CLIENT_ID = 'expected-mcp-client-id';
const USER_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_USER_ID = '99999999-9999-4999-8999-999999999999';
const EXPENSE_ACCOUNT = '22222222-2222-4222-8222-222222222222';
const PORTFOLIO_A = '33333333-3333-4333-8333-333333333333';
const PORTFOLIO_B = '34343434-3434-4434-8434-343434343434';
const SECURITY_A = '44444444-4444-4444-8444-444444444444';
const SECURITY_B = '55555555-5555-4555-8555-555555555555';
const VAULT_A = '66666666-6666-4666-8666-666666666666';
const VAULT_B = '67676767-6767-4676-8676-676767676767';
const HOLDING_ID = '77777777-7777-4777-8777-777777777777';
const NOTE_ID = '88888888-8888-4888-8888-888888888888';

const PRIVATE_TOOLS = ['list_ledger', 'list_holdings', 'list_notes'];

function makeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.signature`;
}

function toolRequest(name: string, token?: string, args?: Record<string, unknown>): Request {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return new Request('https://mcp.cryptgregresearch.org/mcp', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: `call-${name}`,
      method: 'tools/call',
      params: {
        name,
        ...(args ? { arguments: args } : {}),
      },
    }),
  });
}

function urlOf(input: string | URL | Request): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function describeCall(input: string | URL | Request, init?: RequestInit) {
  const url = new URL(urlOf(input));
  const headers = new Headers(init?.headers);
  return {
    href: url.toString(),
    pathname: url.pathname,
    profile: headers.get('accept-profile'),
    apikey: headers.get('apikey'),
    authorization: headers.get('authorization'),
    method: init?.method ?? 'GET',
    select: url.searchParams.get('select'),
    userId: url.searchParams.get('user_id'),
    accountId: url.searchParams.get('account_id'),
    vaultId: url.searchParams.get('vault_id'),
    deletedAt: url.searchParams.get('deleted_at'),
    order: url.searchParams.get('order'),
    limit: url.searchParams.get('limit'),
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

test('whoami no longer says Finance and Bookmarks are not granted', async () => {
  const req = new Request('https://mcp.cryptgregresearch.org/mcp', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'list-tools',
      method: 'tools/list',
    }),
  });
  const res = await handleMcp(req);
  const body = await res.json();
  const whoami = body.result.tools.find((tool: { name: string }) => tool.name === 'whoami');
  assert.ok(whoami);
  assert.doesNotMatch(whoami.description, /not granted/i);
  assert.doesNotMatch(whoami.description, /Does not grant Finance/);
  assert.match(whoami.description, /list_ledger/);
  assert.match(whoami.description, /list_holdings/);
  assert.match(whoami.description, /list_notes/);
});

test('private tools without a bearer are 401 and do not call upstream', async () => {
  for (const name of PRIVATE_TOOLS) {
    let called = false;
    const mockFetch = async () => {
      called = true;
      return jsonResponse({});
    };
    const res = await handleMcp(toolRequest(name), mockFetch as unknown as typeof fetch, {
      MCP_CLIENT_ID: CLIENT_ID,
    });
    assert.strictEqual(res.status, 401, name);
    const challenge = res.headers.get('WWW-Authenticate');
    assert.ok(challenge?.includes('resource_metadata="https://mcp.cryptgregresearch.org/.well-known/oauth-protected-resource"'), name);
    assert.ok(challenge?.includes('scope="openid"'), name);
    assert.strictEqual(called, false, name);
  }
});

test('a token whose client_id does not match is 401 and does not call PostgREST', async () => {
  const token = makeJwt({ client_id: 'someone-else', sub: USER_ID });
  for (const name of PRIVATE_TOOLS) {
    const calls: string[] = [];
    const mockFetch = async (input: string | URL | Request) => {
      const url = urlOf(input);
      calls.push(url);
      if (url.endsWith('/auth/v1/user')) {
        return jsonResponse({ id: USER_ID, email: 'alice@cryptgregresearch.org' });
      }
      return jsonResponse({ message: 'should not be called' }, 500);
    };
    const res = await handleMcp(
      toolRequest(name, token),
      mockFetch as unknown as typeof fetch,
      { MCP_CLIENT_ID: CLIENT_ID },
      DEFAULT_SUPABASE_PUBLISHABLE_KEY,
    );
    assert.strictEqual(res.status, 401, name);
    assert.ok(res.headers.get('WWW-Authenticate')?.includes('resource_metadata='), name);
    assert.deepStrictEqual(
      calls,
      ['https://vlnocfdiexkqcnfbjhqt.supabase.co/auth/v1/user'],
      name,
    );
  }
});

test('a missing MCP_CLIENT_ID is 401 and does not call PostgREST', async () => {
  const token = makeJwt({ client_id: CLIENT_ID, sub: USER_ID });
  let called = false;
  const mockFetch = async () => {
    called = true;
    return jsonResponse({ id: USER_ID, email: 'alice@cryptgregresearch.org' });
  };
  const res = await handleMcp(toolRequest('list_ledger', token), mockFetch as unknown as typeof fetch, {});
  assert.strictEqual(res.status, 401);
  assert.strictEqual(called, false);
});

test('a browser session token with no client_id is 401 and does not call PostgREST', async () => {
  const token = makeJwt({ sub: USER_ID, aud: 'authenticated', role: 'authenticated' });
  const calls: string[] = [];
  const mockFetch = async (input: string | URL | Request) => {
    calls.push(urlOf(input));
    return jsonResponse({ id: USER_ID, email: 'browser@cryptgregresearch.org' });
  };
  const res = await handleMcp(
    toolRequest('list_notes', token),
    mockFetch as unknown as typeof fetch,
    { MCP_CLIENT_ID: CLIENT_ID },
  );
  assert.strictEqual(res.status, 401);
  assert.deepStrictEqual(calls, ['https://vlnocfdiexkqcnfbjhqt.supabase.co/auth/v1/user']);
});

test('matching token returns shaped ledger, holdings, and notes from PostgREST', async () => {
  const token = makeJwt({ client_id: CLIENT_ID, sub: USER_ID });
  const calls: ReturnType<typeof describeCall>[] = [];
  const logged: string[] = [];
  const original = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
  };
  for (const key of Object.keys(original) as (keyof typeof original)[]) {
    console[key] = (...args: unknown[]) => {
      logged.push(args.map((arg) => String(arg)).join(' '));
    };
  }

  const mockFetch = async (input: string | URL | Request, init?: RequestInit) => {
    const call = describeCall(input, init);
    calls.push(call);
    if (call.pathname === '/auth/v1/user') {
      return jsonResponse({
        id: USER_ID,
        email: 'alice@cryptgregresearch.org',
        refresh_token: 'do-not-return',
      });
    }

    if (call.profile === 'expense' && call.pathname === '/rest/v1/accounts') {
      return jsonResponse([{ id: EXPENSE_ACCOUNT, user_id: USER_ID }]);
    }
    if (call.profile === 'expense' && call.pathname === '/rest/v1/counted_transactions') {
      return jsonResponse([
        {
          id: 'tx-1',
          type: 'expense',
          direction: 'out',
          status: 'posted',
          source_type: 'manual',
          reference_no: 'R-1',
          record_date: '2026-10-01',
          description: 'Coffee',
          category_id: null,
          legacy_category: 'food',
          reversal_of: null,
          amount: '12.50',
          signed_amount: '-12.50',
          note: 'not a ledger column',
        },
      ]);
    }

    if (call.profile === 'portfolio' && call.pathname === '/rest/v1/accounts') {
      return jsonResponse([{ id: PORTFOLIO_A }, { id: PORTFOLIO_B }]);
    }
    if (call.profile === 'portfolio' && call.pathname === '/rest/v1/securities') {
      return jsonResponse([
        {
          id: SECURITY_A,
          isin: 'US0000000001',
          figi: 'BBG000000001',
          security_name: 'Acme',
          ticker: 'ACME',
          exchange_code: 'XNAS',
          currency: 'USD',
          account_id: PORTFOLIO_A,
        },
      ]);
    }
    if (call.profile === 'portfolio' && call.pathname === '/rest/v1/holdings') {
      return jsonResponse([
        {
          id: HOLDING_ID,
          security_id: SECURITY_A,
          quantity: '1.500000',
          average_cost: '20.00',
          updated_at: '2026-10-02T00:00:00Z',
          account_id: PORTFOLIO_A,
        },
      ]);
    }
    if (call.profile === 'portfolio' && call.pathname === '/rest/v1/prices') {
      return jsonResponse([
        { security_id: SECURITY_A, price: '9.00', currency: 'USD', as_of: '2026-10-01T00:00:00Z' },
        { security_id: SECURITY_B, price: '4.00', currency: 'EUR', as_of: '2026-08-01T00:00:00Z' },
        { security_id: SECURITY_A, price: '10.00', currency: 'USD', as_of: '2026-10-03T00:00:00Z', source: 'hidden' },
        { security_id: SECURITY_B, price: '3.00', currency: 'EUR', as_of: '2026-09-01T00:00:00Z' },
      ]);
    }

    if (call.profile === 'bookmarks' && call.pathname === '/rest/v1/vaults') {
      return jsonResponse([
        { id: VAULT_A, name: 'Research', slug: 'research', user_id: USER_ID },
        { id: VAULT_B, name: 'Inbox', slug: 'inbox', user_id: USER_ID },
      ]);
    }
    if (call.profile === 'bookmarks' && call.pathname === '/rest/v1/notes') {
      return jsonResponse([
        {
          id: NOTE_ID,
          title: 'Idea',
          slug: 'idea',
          updated_at: '2026-10-03T00:00:00Z',
          content: 'SECRET NOTE CONTENT',
          body: 'also secret',
        },
      ]);
    }

    return jsonResponse({ message: `unexpected ${call.profile} ${call.pathname}` }, 500);
  };

  try {
    const env = { MCP_CLIENT_ID: CLIENT_ID };
    const ledgerRes = await handleMcp(
      toolRequest('list_ledger', token, { user_id: OTHER_USER_ID }),
      mockFetch as unknown as typeof fetch,
      env,
      DEFAULT_SUPABASE_PUBLISHABLE_KEY,
    );
    assert.strictEqual(ledgerRes.status, 200);
    const ledgerBody = await ledgerRes.json();
    assert.strictEqual(ledgerBody.result.isError, undefined);
    const ledger = JSON.parse(ledgerBody.result.content[0].text);
    assert.deepStrictEqual(ledger.accounts, [{ id: EXPENSE_ACCOUNT }]);
    assert.deepStrictEqual(ledger.transactions, [
      {
        id: 'tx-1',
        type: 'expense',
        direction: 'out',
        status: 'posted',
        source_type: 'manual',
        reference_no: 'R-1',
        record_date: '2026-10-01',
        description: 'Coffee',
        category_id: null,
        legacy_category: 'food',
        reversal_of: null,
        amount: '12.50',
        signed_amount: '-12.50',
      },
    ]);
    assert.strictEqual(ledger.transactions[0].note, undefined);

    const holdingsRes = await handleMcp(
      toolRequest('list_holdings', token),
      mockFetch as unknown as typeof fetch,
      env,
      DEFAULT_SUPABASE_PUBLISHABLE_KEY,
    );
    const holdingsBody = await holdingsRes.json();
    assert.strictEqual(holdingsBody.result.isError, undefined);
    const holdings = JSON.parse(holdingsBody.result.content[0].text);
    assert.deepStrictEqual(holdings.accounts, [{ id: PORTFOLIO_A }, { id: PORTFOLIO_B }]);
    assert.deepStrictEqual(holdings.securities, [
      {
        id: SECURITY_A,
        isin: 'US0000000001',
        figi: 'BBG000000001',
        security_name: 'Acme',
        ticker: 'ACME',
        exchange_code: 'XNAS',
        currency: 'USD',
      },
    ]);
    assert.deepStrictEqual(holdings.holdings, [
      {
        id: HOLDING_ID,
        security_id: SECURITY_A,
        quantity: '1.500000',
        average_cost: '20.00',
        updated_at: '2026-10-02T00:00:00Z',
      },
    ]);
    assert.strictEqual(holdings.prices.length, 2);
    const prices = Object.fromEntries(holdings.prices.map((row: { security_id: string }) => [row.security_id, row]));
    assert.deepStrictEqual(prices[SECURITY_A], {
      security_id: SECURITY_A,
      price: '10.00',
      currency: 'USD',
      as_of: '2026-10-03T00:00:00Z',
    });
    assert.deepStrictEqual(prices[SECURITY_B], {
      security_id: SECURITY_B,
      price: '3.00',
      currency: 'EUR',
      as_of: '2026-09-01T00:00:00Z',
    });
    assert.strictEqual(prices[SECURITY_A].source, undefined);

    const notesRes = await handleMcp(
      toolRequest('list_notes', token),
      mockFetch as unknown as typeof fetch,
      env,
      DEFAULT_SUPABASE_PUBLISHABLE_KEY,
    );
    const notesBody = await notesRes.json();
    assert.strictEqual(notesBody.result.isError, undefined);
    const notes = JSON.parse(notesBody.result.content[0].text);
    assert.deepStrictEqual(notes.vaults, [
      { id: VAULT_A, name: 'Research', slug: 'research' },
      { id: VAULT_B, name: 'Inbox', slug: 'inbox' },
    ]);
    assert.deepStrictEqual(notes.notes, [
      {
        id: NOTE_ID,
        title: 'Idea',
        slug: 'idea',
        updated_at: '2026-10-03T00:00:00Z',
      },
    ]);
    assert.strictEqual(JSON.stringify(notes).includes('SECRET NOTE CONTENT'), false);
    assert.strictEqual(JSON.stringify(notes).includes('content'), false);
  } finally {
    Object.assign(console, original);
  }

  assert.strictEqual(logged.some((line) => line.includes(token)), false);

  const restCalls = calls.filter((call) => call.pathname.startsWith('/rest/v1/'));
  assert.ok(restCalls.length > 0);
  for (const call of restCalls) {
    assert.strictEqual(call.method, 'GET');
    assert.strictEqual(call.apikey, DEFAULT_SUPABASE_PUBLISHABLE_KEY);
    assert.strictEqual(call.authorization, `Bearer ${token}`);
    assert.ok(call.href.startsWith('https://vlnocfdiexkqcnfbjhqt.supabase.co/rest/v1/'));
    assert.strictEqual(JSON.stringify(call).includes('service_role'), false);
    assert.strictEqual(call.href.includes('expensetracker.cryptgregresearch.org'), false);
    assert.strictEqual(call.href.includes('bookmarks.cryptgregresearch.org'), false);
  }

  const expenseAccounts = restCalls.find((call) => call.profile === 'expense' && call.pathname === '/rest/v1/accounts');
  assert.ok(expenseAccounts);
  assert.strictEqual(expenseAccounts.select, 'id');
  assert.strictEqual(expenseAccounts.userId, `eq.${USER_ID}`);
  assert.notStrictEqual(expenseAccounts.userId, `eq.${OTHER_USER_ID}`);

  const ledger = restCalls.find((call) => call.pathname === '/rest/v1/counted_transactions');
  assert.ok(ledger);
  assert.strictEqual(ledger.profile, 'expense');
  assert.strictEqual(
    ledger.select,
    'id,type,direction,status,source_type,reference_no,record_date,description,category_id,legacy_category,reversal_of,amount::text,signed_amount::text',
  );
  assert.strictEqual(ledger.order, 'record_date.desc');
  assert.strictEqual(ledger.limit, '1000');
  assert.strictEqual(ledger.accountId, null);

  const portfolioAccounts = restCalls.find((call) => call.profile === 'portfolio' && call.pathname === '/rest/v1/accounts');
  assert.ok(portfolioAccounts);
  assert.strictEqual(portfolioAccounts.userId, `eq.${USER_ID}`);

  const securities = restCalls.find((call) => call.pathname === '/rest/v1/securities');
  const holdingRows = restCalls.find((call) => call.pathname === '/rest/v1/holdings');
  const prices = restCalls.find((call) => call.pathname === '/rest/v1/prices');
  const accountFilter = `in.(${PORTFOLIO_A},${PORTFOLIO_B})`;
  assert.strictEqual(securities?.profile, 'portfolio');
  assert.strictEqual(securities?.select, 'id,isin,figi,security_name,ticker,exchange_code,currency');
  assert.strictEqual(securities?.accountId, accountFilter);
  assert.strictEqual(holdingRows?.select, 'id,security_id,quantity,average_cost,updated_at');
  assert.strictEqual(holdingRows?.accountId, accountFilter);
  assert.strictEqual(prices?.select, 'security_id,price,currency,as_of');
  assert.strictEqual(prices?.accountId, accountFilter);
  assert.strictEqual(prices?.order, 'as_of.desc');
  assert.strictEqual(prices?.limit, '2000');

  const vaults = restCalls.find((call) => call.pathname === '/rest/v1/vaults');
  const noteRows = restCalls.find((call) => call.pathname === '/rest/v1/notes');
  assert.strictEqual(vaults?.profile, 'bookmarks');
  assert.strictEqual(vaults?.select, 'id,name,slug');
  assert.strictEqual(vaults?.userId, `eq.${USER_ID}`);
  assert.strictEqual(noteRows?.profile, 'bookmarks');
  assert.strictEqual(noteRows?.select, 'id,title,slug,updated_at');
  assert.strictEqual(noteRows?.select?.includes('content'), false);
  assert.strictEqual(noteRows?.vaultId, `in.(${VAULT_A},${VAULT_B})`);
  assert.strictEqual(noteRows?.deletedAt, 'is.null');
});

test('no expense account, portfolio account, or vault returns an empty list', async () => {
  const token = makeJwt({ client_id: CLIENT_ID, sub: USER_ID });
  const calls: string[] = [];
  const mockFetch = async (input: string | URL | Request, init?: RequestInit) => {
    const call = describeCall(input, init);
    calls.push(`${call.profile ?? 'auth'} ${call.pathname}`);
    if (call.pathname === '/auth/v1/user') {
      return jsonResponse({ id: USER_ID, email: 'alice@cryptgregresearch.org' });
    }
    return jsonResponse([]);
  };
  const env = { MCP_CLIENT_ID: CLIENT_ID };

  const ledgerRes = await handleMcp(toolRequest('list_ledger', token), mockFetch as unknown as typeof fetch, env);
  const ledgerBody = await ledgerRes.json();
  assert.strictEqual(ledgerBody.result.isError, undefined);
  const ledger = JSON.parse(ledgerBody.result.content[0].text);
  assert.deepStrictEqual(ledger.transactions, []);
  assert.strictEqual(ledger.notice, 'No expense account.');

  const holdingsRes = await handleMcp(toolRequest('list_holdings', token), mockFetch as unknown as typeof fetch, env);
  const holdings = JSON.parse((await holdingsRes.json()).result.content[0].text);
  assert.deepStrictEqual(holdings.securities, []);
  assert.deepStrictEqual(holdings.holdings, []);
  assert.deepStrictEqual(holdings.prices, []);
  assert.strictEqual(holdings.notice, 'No portfolio account.');

  const notesRes = await handleMcp(toolRequest('list_notes', token), mockFetch as unknown as typeof fetch, env);
  const notes = JSON.parse((await notesRes.json()).result.content[0].text);
  assert.deepStrictEqual(notes.vaults, []);
  assert.deepStrictEqual(notes.notes, []);
  assert.strictEqual(notes.notice, 'No bookmark vault.');

  assert.strictEqual(calls.some((call) => call.includes('counted_transactions')), false);
  assert.strictEqual(calls.some((call) => call.includes('/rest/v1/securities')), false);
  assert.strictEqual(calls.some((call) => call.includes('/rest/v1/holdings')), false);
  assert.strictEqual(calls.some((call) => call.includes('/rest/v1/prices')), false);
  assert.strictEqual(calls.some((call) => call.includes('/rest/v1/notes')), false);
});

test('a PostgREST 401 becomes isError and not an empty success', async () => {
  const token = makeJwt({ client_id: CLIENT_ID, sub: USER_ID });
  for (const name of PRIVATE_TOOLS) {
    const calls: string[] = [];
    const mockFetch = async (input: string | URL | Request) => {
      const url = urlOf(input);
      calls.push(url);
      if (url.endsWith('/auth/v1/user')) {
        return jsonResponse({ id: USER_ID, email: 'alice@cryptgregresearch.org' });
      }
      return jsonResponse({ code: 'PGRST301', message: 'JWT expired' }, 401);
    };
    const res = await handleMcp(
      toolRequest(name, token),
      mockFetch as unknown as typeof fetch,
      { MCP_CLIENT_ID: CLIENT_ID },
    );
    assert.strictEqual(res.status, 200, name);
    const body = await res.json();
    assert.strictEqual(body.result.isError, true, name);
    const text = body.result.content[0].text;
    assert.match(text, /PostgREST 401: JWT expired/, name);
    assert.doesNotMatch(text, /"transactions"\s*:\s*\[\]/, name);
    assert.doesNotMatch(text, /"notes"\s*:\s*\[\]/, name);
    assert.strictEqual(body.error, undefined, name);
    assert.ok(calls.some((url) => url.includes('/rest/v1/')), name);
  }
});

test('PostgREST 401 after an account exists is still isError and does not invent rows', async () => {
  const token = makeJwt({ client_id: CLIENT_ID, sub: USER_ID });
  const mockFetch = async (input: string | URL | Request, init?: RequestInit) => {
    const call = describeCall(input, init);
    if (call.pathname === '/auth/v1/user') {
      return jsonResponse({ id: USER_ID, email: 'alice@cryptgregresearch.org' });
    }
    if (call.pathname === '/rest/v1/accounts') {
      return jsonResponse([{ id: EXPENSE_ACCOUNT }]);
    }
    return jsonResponse({ message: 'JWT expired' }, 401);
  };
  const res = await handleMcp(
    toolRequest('list_ledger', token),
    mockFetch as unknown as typeof fetch,
    { MCP_CLIENT_ID: CLIENT_ID },
  );
  const body = await res.json();
  assert.strictEqual(body.result.isError, true);
  assert.match(body.result.content[0].text, /PostgREST 401: JWT expired/);
  assert.doesNotMatch(body.result.content[0].text, /Coffee/);
  assert.doesNotMatch(body.result.content[0].text, /"transactions"/);
});
