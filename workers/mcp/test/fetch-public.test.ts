// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { readPublic } from '../src/fetch-public.ts';

test('finance does not call the injected fetch', async () => {
  let called = false;
  const injectedFetch = async () => {
    called = true;
    return new Response('{}');
  };

  const res1 = await readPublic('finance', undefined, injectedFetch as unknown as typeof fetch);
  assert.strictEqual(called, false);
  assert.deepStrictEqual(res1, { ok: false, error: 'resource_not_public' });

  const res2 = await readPublic('finance', injectedFetch as unknown as typeof fetch);
  assert.strictEqual(called, false);
  assert.deepStrictEqual(res2, { ok: false, error: 'resource_not_public' });
});

test('invalid project id does not call injected fetch', async () => {
  let called = false;
  const injectedFetch = async () => {
    called = true;
    return new Response('{}');
  };

  const res = await readPublic('project', '../admin', injectedFetch as unknown as typeof fetch);
  assert.strictEqual(called, false);
  assert.deepStrictEqual(res, { ok: false, error: 'resource_not_public' });
});

test('readPublic fetches exact URL with accept application/json', async () => {
  let calledUrl = '';
  let calledHeaders: HeadersInit | undefined;

  const mockData = { id: 'sample', title: 'Sample' };
  const injectedFetch = async (input: string | URL | Request, init?: RequestInit) => {
    calledUrl = String(input);
    calledHeaders = init?.headers;
    return new Response(JSON.stringify(mockData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const res = await readPublic('projects', undefined, injectedFetch as unknown as typeof fetch);
  assert.deepStrictEqual(res, { ok: true, body: mockData });
  assert.strictEqual(calledUrl, 'https://cryptgregresearch.org/api/projects.json');
  assert.deepStrictEqual(calledHeaders, { Accept: 'application/json' });
});

test('project resource fetches exact project URL', async () => {
  let calledUrl = '';
  const mockProject = { id: 'eastern-paradise', title: 'Eastern Paradise' };
  const injectedFetch = async (input: string | URL | Request) => {
    calledUrl = String(input);
    return new Response(JSON.stringify(mockProject), { status: 200 });
  };

  const res = await readPublic('project', 'eastern-paradise', injectedFetch as unknown as typeof fetch);
  assert.deepStrictEqual(res, { ok: true, body: mockProject });
  assert.strictEqual(calledUrl, 'https://cryptgregresearch.org/api/projects/eastern-paradise.json');
});

test('upstream non-OK returns upstream_${status}', async () => {
  const injectedFetch404 = async () => new Response('Not Found', { status: 404 });
  const res404 = await readPublic('projects', undefined, injectedFetch404 as unknown as typeof fetch);
  assert.deepStrictEqual(res404, { ok: false, error: 'upstream_404' });

  const injectedFetch502 = async () => new Response('Bad Gateway', { status: 502 });
  const res502 = await readPublic('projects', undefined, injectedFetch502 as unknown as typeof fetch);
  assert.deepStrictEqual(res502, { ok: false, error: 'upstream_502' });
});

test('upstream content-length greater than 1000000 returns upstream_too_large and body is not read', async () => {
  let jsonCalled = false;
  let textCalled = false;
  const injectedFetch = async () => {
    const response = new Response('{}', {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': '1000001',
      },
    });
    response.json = async () => {
      jsonCalled = true;
      return {};
    };
    response.text = async () => {
      textCalled = true;
      return '{}';
    };
    return response;
  };

  const res = await readPublic('projects', undefined, injectedFetch as unknown as typeof fetch);
  assert.deepStrictEqual(res, { ok: false, error: 'upstream_too_large' });
  assert.strictEqual(jsonCalled, false);
  assert.strictEqual(textCalled, false);
});
