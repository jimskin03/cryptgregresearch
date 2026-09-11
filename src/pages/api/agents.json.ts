import type { APIRoute } from 'astro';
import { agents, projectRegistryLastUpdated } from '@/data/records';
import { apiJson } from '@/lib/api';
export const GET: APIRoute = () => apiJson({ resource: 'agents', lastUpdated: projectRegistryLastUpdated, data: { agents } });
