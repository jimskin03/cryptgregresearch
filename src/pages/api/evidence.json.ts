import type { APIRoute } from 'astro';
import { evidence, projectRegistryLastUpdated } from '@/data/records';
import { apiJson } from '@/lib/api';
export const GET: APIRoute = () => apiJson({
  resource: 'evidence',
  lastUpdated: projectRegistryLastUpdated,
  data: {
    evidence: evidence.map(({ isFixture, ...item }) => ({ ...item, is_fixture: isFixture })),
  },
});
