import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { projectRegistryLastUpdated } from '@/data/records';
import { apiJson } from '@/lib/api';
export const GET: APIRoute = async () => {
  const research = await getCollection('research');
  return apiJson({
    resource: 'research',
    lastUpdated: projectRegistryLastUpdated,
    data: { research: research.map(({ data, id }) => {
      const { id: _frontmatterId, ...metadata } = data;
      return { id, ...metadata, date: data.date.toISOString() };
    }) },
  });
};
