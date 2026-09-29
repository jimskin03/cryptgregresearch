export const DEFAULT_SUPABASE_URL = 'https://vlnocfdiexkqcnfbjhqt.supabase.co';
export const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_ys0Cl98LLqAdNEiNY1f7Mg_lddIzr6F';

export const PROTECTED_RESOURCE_HOSTS = new Set([
  'cryptgreg-mcp.cryptgreg.workers.dev',
  'mcp.cryptgregresearch.org',
]);

export function getProtectedResourceMetadata(url: URL): Response {
  if (!PROTECTED_RESOURCE_HOSTS.has(url.host)) {
    return new Response('Not Found', { status: 404 });
  }

  const body = {
    resource: `${url.origin}/mcp`,
    authorization_servers: ['https://vlnocfdiexkqcnfbjhqt.supabase.co/auth/v1'],
    bearer_methods_supported: ['header'],
    scopes_supported: ['openid', 'email', 'profile'],
  };

  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export function decodeJwtPayload(jwt: string): Record<string, unknown> | null {
  try {
    const parts = jwt.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const jsonStr = new TextDecoder().decode(bytes);
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

export interface VerifyOAuthTokenOptions {
  token: string;
  expectedClientId?: string;
  publishableKey?: string;
  fetchImpl?: typeof fetch;
  supabaseUrl?: string;
}

export type VerifyOAuthTokenResult =
  | {
      ok: true;
      user: {
        id: string;
        email: string;
      };
    }
  | {
      ok: false;
      status: number;
      error: string;
    };

export async function verifyOAuthToken(
  tokenOrOptions: string | VerifyOAuthTokenOptions,
  expectedClientIdArg?: string,
  publishableKeyArg?: string,
  fetchImplArg?: typeof fetch,
  supabaseUrlArg?: string,
): Promise<VerifyOAuthTokenResult> {
  let token: string;
  let expectedClientId: string | undefined;
  let publishableKey: string;
  let fetchImpl: typeof fetch;
  let supabaseUrl: string;

  if (typeof tokenOrOptions === 'object' && tokenOrOptions !== null) {
    token = tokenOrOptions.token;
    expectedClientId = tokenOrOptions.expectedClientId;
    publishableKey = tokenOrOptions.publishableKey || DEFAULT_SUPABASE_PUBLISHABLE_KEY;
    fetchImpl = tokenOrOptions.fetchImpl || fetch;
    supabaseUrl = tokenOrOptions.supabaseUrl || DEFAULT_SUPABASE_URL;
  } else {
    token = tokenOrOptions;
    expectedClientId = expectedClientIdArg;
    publishableKey = publishableKeyArg || DEFAULT_SUPABASE_PUBLISHABLE_KEY;
    fetchImpl = fetchImplArg || fetch;
    supabaseUrl = supabaseUrlArg || DEFAULT_SUPABASE_URL;
  }

  if (!token || !expectedClientId) {
    return { ok: false, status: 401, error: 'invalid_token' };
  }

  // Call upstream https://vlnocfdiexkqcnfbjhqt.supabase.co/auth/v1/user ONLY
  let userRes: Response;
  try {
    userRes = await fetchImpl(`${supabaseUrl}/auth/v1/user`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: publishableKey,
      },
    });
  } catch {
    return { ok: false, status: 401, error: 'invalid_token' };
  }

  if (!userRes.ok) {
    // Do not trust the payload if /auth/v1/user failed. Do not log the token.
    return { ok: false, status: 401, error: 'invalid_token' };
  }

  let userData: any;
  try {
    userData = await userRes.json();
  } catch {
    return { ok: false, status: 401, error: 'invalid_token' };
  }

  if (!userData || typeof userData !== 'object' || !userData.id) {
    return { ok: false, status: 401, error: 'invalid_token' };
  }

  // Decode the JWT payload only after the user endpoint returns 200, and read client_id from the payload.
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload !== 'object') {
    return { ok: false, status: 401, error: 'invalid_token' };
  }

  // Reject unless the user payload app_metadata.provider is irrelevant and the token's client_id equals that secret.
  // A browser session token has no client_id and must be rejected.
  if (typeof payload.client_id !== 'string' || payload.client_id !== expectedClientId) {
    return { ok: false, status: 401, error: 'invalid_token' };
  }

  // whoami returns user id and email only. No refresh token, provider token, or API key.
  return {
    ok: true,
    user: {
      id: String(userData.id),
      email: typeof userData.email === 'string' ? userData.email : '',
    },
  };
}
