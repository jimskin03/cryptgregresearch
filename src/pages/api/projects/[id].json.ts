import type { APIRoute } from 'astro';
import { projectRegistryLastUpdated, projects } from '@/data/records';
import { apiJson } from '@/lib/api';

export function getStaticPaths() {
  return projects.map((project) => ({ params: { id: project.id }, props: { project } }));
}

export const GET: APIRoute = ({ props }) => {
  const project = props.project as typeof projects[number];
  return apiJson({
    resource: `projects/${project.id}`,
    lastUpdated: project.statusCheckedAt ?? projectRegistryLastUpdated,
    data: {
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        lifecycle_status: project.status,
        verification_status: project.verificationStatus,
        is_fixture: project.isFixture,
        status_checked_at: project.statusCheckedAt ?? null,
        verification_note: project.verificationNote ?? null,
        project_type: project.kind,
        url: project.externalUrl ?? null,
        human_url: `/projects/${project.id}`,
      },
    },
  });
};
