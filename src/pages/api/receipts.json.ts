import type { APIRoute } from 'astro';
import { projectRegistryLastUpdated, receipts } from '@/data/records';
import { apiJson } from '@/lib/api';
export const GET: APIRoute = () => apiJson({
  resource: 'receipts',
  lastUpdated: projectRegistryLastUpdated,
  data: {
    receipts: receipts.map(({ isFixture, ...receipt }) => ({ ...receipt, is_fixture: isFixture })),
  },
});
