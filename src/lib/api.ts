import { site } from '@/data/site';

export const API_SCHEMA_VERSION = '1.1';

type ApiEnvelopeOptions<T> = {
  resource: string;
  lastUpdated: string;
  data: T;
  self?: string;
};

export function apiJson<T>({ resource, lastUpdated, data, self }: ApiEnvelopeOptions<T>) {
  return new Response(JSON.stringify({
    schema_version: API_SCHEMA_VERSION,
    resource,
    self: self ?? `/api/${resource}.json`,
    generated_at: lastUpdated,
    last_updated: lastUpdated,
    site: site.url,
    ...data,
  }, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=600',
    },
  });
}

export function plainText(text: string) {
  return new Response(text, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=600',
    },
  });
}
