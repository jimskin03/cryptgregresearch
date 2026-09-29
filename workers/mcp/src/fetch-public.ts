import { publicUrl } from './catalog.ts';

export type ReadPublicResult =
  | { ok: true; body: unknown }
  | { ok: false; error: string };

export async function readPublic(
  resource: string,
  idOrFetch?: string | typeof fetch,
  fetchImplParam?: typeof fetch,
): Promise<ReadPublicResult> {
  let id: string | undefined;
  let fetchImpl: typeof fetch = fetch;

  if (typeof idOrFetch === 'function') {
    fetchImpl = idOrFetch;
    id = undefined;
  } else {
    id = idOrFetch;
    if (fetchImplParam) {
      fetchImpl = fetchImplParam;
    }
  }

  const url = publicUrl(resource, id);
  if (!url) {
    return { ok: false, error: 'resource_not_public' };
  }

  const response = await fetchImpl(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    return { ok: false, error: `upstream_${response.status}` };
  }

  const contentLength = response.headers.get('content-length');
  if (contentLength !== null) {
    const length = Number(contentLength);
    if (!Number.isNaN(length) && length > 1000000) {
      return { ok: false, error: 'upstream_too_large' };
    }
  }

  try {
    const body = await response.json();
    return { ok: true, body };
  } catch {
    return { ok: false, error: 'upstream_invalid_json' };
  }
}
