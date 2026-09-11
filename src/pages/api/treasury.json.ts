import type { APIRoute } from 'astro';
import { projectRegistryLastUpdated, treasury } from '@/data/records';
import { apiJson } from '@/lib/api';
export const GET: APIRoute = () => {
  const { isFixture, verificationStatus, ...record } = treasury;
  return apiJson({ resource: 'treasury', lastUpdated: projectRegistryLastUpdated, data: { treasury: { ...record, is_fixture: isFixture, verification_status: verificationStatus } } });
};
