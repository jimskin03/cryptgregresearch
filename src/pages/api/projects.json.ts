import type { APIRoute } from 'astro';
import { projectRegistryLastUpdated, projects } from '@/data/records';

export const GET: APIRoute = () => {
  const compatibilityProjects = projects.map((project) => ({
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.featured ? 'FEATURED' : project.id === 'beacon-relay' ? 'CONCEPT / IN DEVELOPMENT' : project.status,
    status_checked_at: project.statusCheckedAt ?? projectRegistryLastUpdated,
    host: project.externalUrl ? new URL(project.externalUrl).host : null,
    url: project.externalUrl ?? null,
    project_type: project.kind,
    verification_note: project.verificationNote ?? null,
    is_fixture: project.isFixture,
  }));
  return new Response(JSON.stringify({
    schema_version: '1.0',
    last_updated: projectRegistryLastUpdated,
    projects: compatibilityProjects,
  }, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};