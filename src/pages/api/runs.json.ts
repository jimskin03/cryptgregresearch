import type { APIRoute } from 'astro';
import { projectRegistryLastUpdated, runs } from '@/data/records';
import { apiJson } from '@/lib/api';
export const GET: APIRoute = () => apiJson({
  resource: 'runs',
  lastUpdated: projectRegistryLastUpdated,
  data: {
    runs: runs.map(({ isFixture, ...run }) => ({ ...run, is_fixture: isFixture })),
  },
});
