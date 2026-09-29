// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { handleMcp } from '../src/index.ts';
import {
  DEFAULT_SUPABASE_PUBLISHABLE_KEY,
  DEFAULT_SUPABASE_URL,
  verifyOAuthToken,
  getProtectedResourceMetadata,
  decodeJwtPayload,
} from '../src/oauth.ts';

function makeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.signature`;
}

test('GET /.well-known/oauth-protected-resource returns 200 for allowed hosts with exact metadata', async () => {
  const reqDev = new Request('https://cryptgreg-mcp.cryptgreg.workers.dev/.well-known/oauth-protected-resource', {
    method: 'GET',
  });
  const resDev = await handleMcp(reqDev);
  assert.strictEqual(resDev.status, 200);
  assert.strictEqual(resDev.headers.get('Content-Type'), 'application/json');
  const bodyDev = await resDev.json();
  assert.deepStrictEqual(bodyDev, {
    resource: 'https://cryptgreg-mcp.cryptgreg.workers.dev/mcp',
    authorization_servers: ['https://vlnocfdiexkqcnfbjhqt.supabase.co/auth/v1'],
    bearer_methods_supported: ['header'],
    scopes_supported: ['openid', 'email', 'profile'],
  });

  const reqOrg = new Request('https://mcp.cryptgregresearch.org/.well-known/oauth-protected-resource', {
    method: 'GET',
  });
  const resOrg = await handleMcp(reqOrg);
  assert.strictEqual(resOrg.status, 200);
  const bodyOrg = await resOrg.json();
  assert.deepStrictEqual(bodyOrg, {
    resource: 'https://mcp.cryptgregresearch.org/mcp',
    authorization_servers: ['https://vlnocfdiexkqcnfbjhqt.supabase.co/auth/v1'],
    bearer_methods_supported: ['header'],
    scopes_supported: ['openid', 'email', 'profile'],
  });
});

test('GET /.well-known/oauth-protected-resource on unknown host returns 404', async () => {
  const req = new Request('https://unknown.workers.dev/.well-known/oauth-protected-resource', {
    method: 'GET',
  });
  const res = await handleMcp(req);
  assert.strictEqual(res.status, 404);
});

test('POST /.well-known/oauth-protected-resource returns 405', async () => {
  const req = new Request('https://cryptgreg-mcp.cryptgreg.workers.dev/.well-known/oauth-protected-resource', {
    method: 'POST',
  });
  const res = await handleMcp(req);
  assert.strictEqual(res.status, 405);
  assert.strictEqual(res.headers.get('Allow'), 'GET');
});

test('list_catalog still works with no token', async () => {
  const req = new Request('https://mcp.cryptgregresearch.org/mcp', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'test-cat',
      method: 'tools/call',
      params: {
        name: 'list_catalog',
      },
    }),
  });

  const res = await handleMcp(req);
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.ok(body.result.content[0].text.includes('Records with is_fixture true are scaffolds, not observed results.'));
  assert.ok(body.result.resources.includes('projects'));
});

test('Phase 1 tools ignore Authorization and never log it', async () => {
  let loggedAuth = false;
  const originalLog = console.log;
  console.log = (...args: unknown[]) => {
    const text = args.join(' ');
    if (text.includes('Bearer secret-token') || text.includes('Authorization')) {
      loggedAuth = true;
    }
    originalLog(...args);
  };

  try {
    const req = new Request('https://mcp.cryptgregresearch.org/mcp', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer secret-token-must-not-be-logged',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'cat-with-auth',
        method: 'tools/call',
        params: {
          name: 'list_catalog',
        },
      }),
    });

    const res = await handleMcp(req);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(loggedAuth, false);
  } finally {
    console.log = originalLog;
  }
});

test('whoami without a token is 401 and the challenge contains resource_metadata', async () => {
  const req = new Request('https://mcp.cryptgregresearch.org/mcp', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'whoami-no-token',
      method: 'tools/call',
      params: {
        name: 'whoami',
      },
    }),
  });

  const res = await handleMcp(req);
  assert.strictEqual(res.status, 401);
  const challenge = res.headers.get('WWW-Authenticate');
  assert.ok(challenge, 'WWW-Authenticate header must be present');
  assert.ok(challenge.includes('resource_metadata="https://mcp.cryptgregresearch.org/.well-known/oauth-protected-resource"'));
  assert.ok(challenge.includes('scope="openid"'));
});

test('a token whose client_id does not match is rejected and /auth/v1/user is the only upstream auth call', async () => {
  const testClientId = 'expected-mcp-client-id';
  const mismatchedToken = makeJwt({
    client_id: 'mismatched-client-id',
    sub: 'user-uuid-456',
  });

  const upstreamCalls: { url: string; headers: Record<string, string> }[] = [];
  const mockFetch = async (url: string | URL | Request, init?: RequestInit) => {
    const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
    const headers = new Headers(init?.headers);
    upstreamCalls.push({
      url: urlStr,
      headers: Object.fromEntries(headers.entries()),
    });

    if (urlStr === 'https://vlnocfdiexkqcnfbjhqt.supabase.co/auth/v1/user') {
      return new Response(
        JSON.stringify({
          id: 'user-uuid-456',
          email: 'researcher@example.org',
          app_metadata: { provider: 'email' },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }
    return new Response('Not Found', { status: 404 });
  };

  const req = new Request('https://mcp.cryptgregresearch.org/mcp', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${mismatchedToken}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'whoami-mismatched',
      method: 'tools/call',
      params: {
        name: 'whoami',
      },
    }),
  });

  const res = await handleMcp(
    req,
    mockFetch as unknown as typeof fetch,
    { MCP_CLIENT_ID: testClientId },
    DEFAULT_SUPABASE_PUBLISHABLE_KEY,
  );

  assert.strictEqual(res.status, 401);
  const challenge = res.headers.get('WWW-Authenticate');
  assert.ok(challenge?.includes('resource_metadata='));

  // Ensure /auth/v1/user was called and was the ONLY upstream call
  assert.strictEqual(upstreamCalls.length, 1);
  assert.strictEqual(upstreamCalls[0].url, 'https://vlnocfdiexkqcnfbjhqt.supabase.co/auth/v1/user');
  assert.strictEqual(upstreamCalls[0].headers.apikey, DEFAULT_SUPABASE_PUBLISHABLE_KEY);
  assert.strictEqual(upstreamCalls[0].headers.authorization, `Bearer ${mismatchedToken}`);
});

test('a browser session token has no client_id and must be rejected', async () => {
  const testClientId = 'expected-mcp-client-id';
  const browserSessionToken = makeJwt({
    sub: 'user-browser-123',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'browser-user@example.org',
  });

  const mockFetch = async () =>
    new Response(
      JSON.stringify({
        id: 'user-browser-123',
        email: 'browser-user@example.org',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );

  const req = new Request('https://mcp.cryptgregresearch.org/mcp', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${browserSessionToken}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'whoami-browser-session',
      method: 'tools/call',
      params: {
        name: 'whoami',
      },
    }),
  });

  const res = await handleMcp(
    req,
    mockFetch as unknown as typeof fetch,
    { MCP_CLIENT_ID: testClientId },
  );

  assert.strictEqual(res.status, 401);
});

test('a token is rejected if /auth/v1/user failed and payload is not trusted', async () => {
  const testClientId = 'expected-mcp-client-id';
  const validPayloadToken = makeJwt({
    client_id: testClientId,
    sub: 'user-uuid-789',
  });

  const mockFetch = async () =>
    new Response(JSON.stringify({ message: 'Invalid JWT' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });

  const req = new Request('https://mcp.cryptgregresearch.org/mcp', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${validPayloadToken}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'whoami-failed-upstream',
      method: 'tools/call',
      params: {
        name: 'whoami',
      },
    }),
  });

  const res = await handleMcp(
    req,
    mockFetch as unknown as typeof fetch,
    { MCP_CLIENT_ID: testClientId },
  );

  assert.strictEqual(res.status, 401);
});

test('whoami with valid token returns user id and email only (no refresh_token, provider_token, or apikey)', async () => {
  const testClientId = 'expected-mcp-client-id';
  const validToken = makeJwt({
    client_id: testClientId,
    sub: 'user-uuid-101',
  });

  const mockFetch = async () =>
    new Response(
      JSON.stringify({
        id: 'user-uuid-101',
        email: 'alice@cryptgregresearch.org',
        refresh_token: 'should-never-be-returned',
        provider_token: 'provider-secret-should-never-be-returned',
        app_metadata: { provider: 'email' },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );

  const req = new Request('https://mcp.cryptgregresearch.org/mcp', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${validToken}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'whoami-success',
      method: 'tools/call',
      params: {
        name: 'whoami',
      },
    }),
  });

  const res = await handleMcp(
    req,
    mockFetch as unknown as typeof fetch,
    { MCP_CLIENT_ID: testClientId },
  );

  assert.strictEqual(res.status, 200);
  const body = await res.json();
  const returnedContent = JSON.parse(body.result.content[0].text);

  assert.strictEqual(returnedContent.id, 'user-uuid-101');
  assert.strictEqual(returnedContent.email, 'alice@cryptgregresearch.org');
  assert.strictEqual(Object.keys(returnedContent).sort().join(','), 'email,id');
  assert.strictEqual(returnedContent.refresh_token, undefined);
  assert.strictEqual(returnedContent.provider_token, undefined);
  assert.strictEqual(returnedContent.apikey, undefined);
});

test('verifyOAuthToken passes publishable key as function argument', async () => {
  const testClientId = 'test-client-123';
  const customKey = 'sb_publishable_custom_key_test';
  const token = makeJwt({ client_id: testClientId, sub: 'usr-999' });

  let seenKey: string | null = null;
  const mockFetch = async (_url: string | URL | Request, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    seenKey = headers.get('apikey');
    return new Response(
      JSON.stringify({ id: 'usr-999', email: 'user999@example.com' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  };

  const result = await verifyOAuthToken(
    token,
    testClientId,
    customKey,
    mockFetch as unknown as typeof fetch,
  );

  assert.strictEqual(result.ok, true);
  if (result.ok) {
    assert.strictEqual(result.user.id, 'usr-999');
    assert.strictEqual(result.user.email, 'user999@example.com');
  }
  assert.strictEqual(seenKey, customKey);
});

test('worker.fetch passes env and handles whoami call', async () => {
  const testClientId = 'worker-fetch-client-id';
  const token = makeJwt({ client_id: testClientId, sub: 'usr-fetch' });

  // In a real worker environment, global fetch would be used.
  // Test handleMcp with worker.fetch pattern.
  const req = new Request('https://mcp.cryptgregresearch.org/mcp', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'whoami-no-token-worker',
      method: 'tools/call',
      params: {
        name: 'whoami',
      },
    }),
  });

  const res = await worker.fetch(req, { MCP_CLIENT_ID: testClientId }, {});
  assert.strictEqual(res.status, 401);
});
