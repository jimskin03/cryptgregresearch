import type { APIRoute } from 'astro';
import { datasets, projectRegistryLastUpdated } from '@/data/records';
import { apiJson } from '@/lib/api';
export const GET: APIRoute = () => apiJson({
  resource: 'datasets',
  lastUpdated: projectRegistryLastUpdated,
  data: {
    datasets: datasets.map(({ isFixture, ...dataset }) => ({ ...dataset, is_fixture: isFixture })),
  },
});
