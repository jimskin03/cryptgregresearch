// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { handleMcp } from '../src/index.ts';

test('call handleMcp with Origin https://evil.example and a tools/call body returns 403 and fetch does not run', async () => {
  let called = false;
  const injectedFetch = async () => {
    called = true;
    return new Response('{}');
  };

  const req = new Request('https://mcp.cryptgregresearch.org/mcp', {
    method: 'POST',
    headers: {
      Origin: 'https://evil.example',
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'read_public_json',
        arguments: {
          resource: 'projects',
        },
      },
    }),
  });

  const res = await handleMcp(req, injectedFetch as unknown as typeof fetch);
  assert.strictEqual(res.status, 403);
  assert.strictEqual(called, false);
});

test('call worker.fetch with Origin https://evil.example returns 403', async () => {
  const req = new Request('https://mcp.cryptgregresearch.org/mcp', {
    method: 'POST',
    headers: {
      Origin: 'https://evil.example',
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'read_public_json',
        arguments: {
          resource: 'projects',
        },
      },
    }),
  });

  const res = await worker.fetch(req, {}, {});
  assert.strictEqual(res.status, 403);
});

test('allowed Origin cryptgregresearch.org or mcp.cryptgregresearch.org succeeds', async () => {
  const mockFetch = async () => new Response(JSON.stringify({ status: 'ok' }), { status: 200 });

  const req1 = new Request('https://mcp.cryptgregresearch.org/mcp', {
    method: 'POST',
    headers: {
      Origin: 'https://cryptgregresearch.org',
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'req-1',
      method: 'tools/call',
      params: {
        name: 'read_public_json',
        arguments: {
          resource: 'projects',
        },
      },
    }),
  });

  const res1 = await handleMcp(req1, mockFetch as unknown as typeof fetch);
  assert.strictEqual(res1.status, 200);

  const req2 = new Request('https://mcp.cryptgregresearch.org/mcp', {
    method: 'POST',
    headers: {
      Origin: 'https://mcp.cryptgregresearch.org',
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'req-2',
      method: 'tools/call',
      params: {
        name: 'read_public_json',
        arguments: {
          resource: 'projects',
        },
      },
    }),
  });

  const res2 = await handleMcp(req2, mockFetch as unknown as typeof fetch);
  assert.strictEqual(res2.status, 200);
});

test('missing Origin header is allowed', async () => {
  const req = new Request('https://mcp.cryptgregresearch.org/mcp', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'no-origin',
      method: 'initialize',
      params: {
        protocolVersion: '2025-11-25',
      },
    }),
  });

  const res = await handleMcp(req);
  assert.strictEqual(res.status, 200);
});

test('GET /mcp returns 405', async () => {
  const req = new Request('https://mcp.cryptgregresearch.org/mcp', {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  const res = await handleMcp(req);
  assert.strictEqual(res.status, 405);
});

test('POST without application/json in Accept header returns 406', async () => {
  const req = new Request('https://mcp.cryptgregresearch.org/mcp', {
    method: 'POST',
    headers: {
      Accept: 'text/html',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
    }),
  });

  const res = await handleMcp(req);
  assert.strictEqual(res.status, 406);
});

test('notifications and responses return 202 with empty body', async () => {
  const notificationReq = new Request('https://mcp.cryptgregresearch.org/mcp', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'notifications/initialized',
    }),
  });

  const notifRes = await handleMcp(notificationReq);
  assert.strictEqual(notifRes.status, 202);
  assert.strictEqual(await notifRes.text(), '');

  const responseReq = new Request('https://mcp.cryptgregresearch.org/mcp', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      result: { ok: true },
    }),
  });

  const respRes = await handleMcp(responseReq);
  assert.strictEqual(respRes.status, 202);
  assert.strictEqual(await respRes.text(), '');
});

test('initialize echoes protocolVersion when supported, otherwise defaults to 2025-11-25', async () => {
  const createInitReq = (version?: string) =>
    new Request('https://mcp.cryptgregresearch.org/mcp', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'init-1',
        method: 'initialize',
        params: version ? { protocolVersion: version } : {},
      }),
    });

  const res1 = await handleMcp(createInitReq('2025-03-26'));
  const body1 = await res1.json();
  assert.strictEqual(body1.result.protocolVersion, '2025-03-26');
  assert.deepStrictEqual(body1.result.capabilities, { tools: {} });
  assert.deepStrictEqual(body1.result.serverInfo, {
    name: 'cryptgreg-mcp',
    version: '0.1.0',
  });

  const res2 = await handleMcp(createInitReq('2026-07-28'));
  const body2 = await res2.json();
  assert.strictEqual(body2.result.protocolVersion, '2026-07-28');

  const res3 = await handleMcp(createInitReq('unknown-future-version'));
  const body3 = await res3.json();
  assert.strictEqual(body3.result.protocolVersion, '2025-11-25');
});

test('tools/list returns the public tools and whoami', async () => {
  const req = new Request('https://mcp.cryptgregresearch.org/mcp', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'list-1',
      method: 'tools/list',
    }),
  });

  const res = await handleMcp(req);
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  const toolNames = body.result.tools.map((t: any) => t.name);
  assert.deepStrictEqual(toolNames.sort(), ['list_catalog', 'read_public_json', 'whoami'].sort());
});

test('tools/call list_catalog returns publicResourceNames and policy sentence', async () => {
  const req = new Request('https://mcp.cryptgregresearch.org/mcp', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'call-catalog',
      method: 'tools/call',
      params: {
        name: 'list_catalog',
      },
    }),
  });

  const res = await handleMcp(req);
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  const text = body.result.content[0].text;
  assert.ok(text.includes('Records with is_fixture true are scaffolds, not observed results.'));
  assert.ok(text.includes('projects'));
  assert.ok(text.includes('research'));
  assert.ok(text.includes('observations'));
  assert.ok(text.includes('datasets'));
  assert.ok(text.includes('runs'));
  assert.ok(text.includes('evidence'));
  assert.ok(text.includes('treasury'));
  assert.ok(text.includes('land'));
  assert.ok(text.includes('receipts'));
  assert.ok(text.includes('agents'));
});

test('unknown method returns JSON-RPC error -32601', async () => {
  const req = new Request('https://mcp.cryptgregresearch.org/mcp', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'unknown-1',
      method: 'some_random_method',
    }),
  });

  const res = await handleMcp(req);
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.error.code, -32601);
});
