import type { APIRoute } from 'astro';
import { land, projectRegistryLastUpdated } from '@/data/records';
import { apiJson } from '@/lib/api';
export const GET: APIRoute = () => {
  const { isFixture, verificationStatus, ...record } = land;
  return apiJson({ resource: 'land', lastUpdated: projectRegistryLastUpdated, data: { land: { ...record, is_fixture: isFixture, verification_status: verificationStatus } } });
};
