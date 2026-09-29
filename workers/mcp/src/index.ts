import { publicResourceNames } from './catalog.ts';
import { readPublic } from './fetch-public.ts';

const ALLOWED_ORIGIN_HOSTS = new Set([
  'mcp.cryptgregresearch.org',
  'cryptgregresearch.org',
]);

const SUPPORTED_PROTOCOL_VERSIONS = new Set([
  '2025-03-26',
  '2025-11-25',
  '2026-07-28',
]);

export async function handleMcp(
  request: Request,
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  const origin = request.headers.get('Origin');
  if (origin !== null && origin !== '') {
    try {
      const parsedOrigin = new URL(origin);
      if (!ALLOWED_ORIGIN_HOSTS.has(parsedOrigin.host)) {
        return new Response('Forbidden', { status: 403 });
      }
    } catch {
      return new Response('Forbidden', { status: 403 });
    }
  }

  const url = new URL(request.url);
  if (url.pathname !== '/mcp') {
    return new Response('Not Found', { status: 404 });
  }

  if (request.method === 'GET') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { Allow: 'POST' },
    });
  }

  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { Allow: 'POST' },
    });
  }

  const accept = request.headers.get('Accept') ?? '';
  if (!accept.includes('application/json')) {
    return new Response('Not Acceptable', { status: 406 });
  }

  let bodyText: string;
  try {
    bodyText = await request.text();
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  let msg: any;
  try {
    msg = JSON.parse(bodyText);
  } catch {
    return new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: 'Parse error' },
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  if (typeof msg !== 'object' || msg === null || Array.isArray(msg)) {
    return new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32600, message: 'Invalid Request' },
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  if (msg.jsonrpc !== '2.0') {
    return new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        id: msg.id ?? null,
        error: { code: -32600, message: 'Invalid Request' },
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  const isNotification = !('id' in msg) || msg.id === undefined;
  const isResponse = !('method' in msg) && ('result' in msg || 'error' in msg);
  if (isNotification || isResponse) {
    return new Response(null, { status: 202 });
  }

  if (typeof msg.method !== 'string') {
    return new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        id: msg.id,
        error: { code: -32600, message: 'Invalid Request' },
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  try {
    if (msg.method === 'initialize') {
      const clientVersion = msg.params?.protocolVersion;
      const protocolVersion = SUPPORTED_PROTOCOL_VERSIONS.has(clientVersion)
        ? clientVersion
        : '2025-11-25';

      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          id: msg.id,
          result: {
            protocolVersion,
            capabilities: {
              tools: {},
            },
            serverInfo: {
              name: 'cryptgreg-mcp',
              version: '0.1.0',
            },
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    if (msg.method === 'tools/list') {
      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          id: msg.id,
          result: {
            tools: [
              {
                name: 'list_catalog',
                description: 'List available public catalog resources and interpretation policies.',
                inputSchema: {
                  type: 'object',
                  properties: {},
                },
              },
              {
                name: 'read_public_json',
                description: 'Read public JSON resource by name and optional project id.',
                inputSchema: {
                  type: 'object',
                  properties: {
                    resource: {
                      type: 'string',
                      description: 'Resource name to fetch.',
                    },
                    id: {
                      type: 'string',
                      description: 'Project ID (only meaningful when resource is project).',
                    },
                  },
                  required: ['resource'],
                },
              },
            ],
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    if (msg.method === 'tools/call') {
      if (!msg.params || typeof msg.params !== 'object' || typeof msg.params.name !== 'string') {
        return new Response(
          JSON.stringify({
            jsonrpc: '2.0',
            id: msg.id,
            error: { code: -32602, message: 'Invalid params' },
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      if (msg.params.name === 'list_catalog') {
        return new Response(
          JSON.stringify({
            jsonrpc: '2.0',
            id: msg.id,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      resources: publicResourceNames,
                      policy: 'Records with is_fixture true are scaffolds, not observed results.',
                    },
                    null,
                    2,
                  ),
                },
              ],
              resources: publicResourceNames,
            },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      if (msg.params.name === 'read_public_json') {
        const args = msg.params.arguments;
        if (!args || typeof args !== 'object' || typeof args.resource !== 'string') {
          return new Response(
            JSON.stringify({
              jsonrpc: '2.0',
              id: msg.id,
              result: {
                content: [
                  {
                    type: 'text',
                    text: 'Missing or invalid resource argument',
                  },
                ],
                isError: true,
              },
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            },
          );
        }

        const resource = args.resource;
        const id = typeof args.id === 'string' ? args.id : undefined;

        const result = await readPublic(resource, id, fetchImpl);
        if (!result.ok) {
          return new Response(
            JSON.stringify({
              jsonrpc: '2.0',
              id: msg.id,
              result: {
                content: [
                  {
                    type: 'text',
                    text: result.error,
                  },
                ],
                isError: true,
              },
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            },
          );
        }

        return new Response(
          JSON.stringify({
            jsonrpc: '2.0',
            id: msg.id,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result.body, null, 2),
                },
              ],
            },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          id: msg.id,
          result: {
            content: [
              {
                type: 'text',
                text: `Unknown tool: ${msg.params.name}`,
              },
            ],
            isError: true,
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    return new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        id: msg.id,
        error: {
          code: -32601,
          message: 'Method not found',
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch {
    return new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        id: msg?.id ?? null,
        error: {
          code: -32603,
          message: 'Internal error',
        },
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}

export default {
  async fetch(request: Request, _env: unknown, _ctx: unknown): Promise<Response> {
    return handleMcp(request, fetch);
  },
};
