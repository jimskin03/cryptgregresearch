import type { APIRoute } from 'astro';
import { projectRegistryLastUpdated, projects } from '@/data/records';
import { apiJson } from '@/lib/api';

export const GET: APIRoute = () => {
  const compatibilityProjects = projects.map((project) => ({
    id: project.id,
    name: project.name,
    description: project.description,
    lifecycle_status: project.status,
    verification_status: project.verificationStatus,
    status_checked_at: project.statusCheckedAt ?? projectRegistryLastUpdated,
    host: project.externalUrl ? new URL(project.externalUrl).host : null,
    url: project.externalUrl ?? null,
    project_type: project.kind,
    verification_note: project.verificationNote ?? null,
    is_fixture: project.isFixture,
  }));
  return apiJson({
    resource: 'projects',
    lastUpdated: projectRegistryLastUpdated,
    data: {
      status_vocabulary: {
        lifecycle_status: ['LIVE', 'EXPERIMENTAL', 'IN DEVELOPMENT', 'CONCEPT', 'ARCHIVED', 'OFFLINE', 'UNVERIFIED'],
        verification_status: ['VERIFIED', 'UNVERIFIED', 'HISTORICAL', 'PENDING'],
      },
      projects: compatibilityProjects,
    },
  });
};
