const RESOURCES: Record<string, string> = {
  projects: 'https://cryptgregresearch.org/api/projects.json',
  research: 'https://cryptgregresearch.org/api/research.json',
  observations: 'https://cryptgregresearch.org/api/observations.json',
  datasets: 'https://cryptgregresearch.org/api/datasets.json',
  runs: 'https://cryptgregresearch.org/api/runs.json',
  evidence: 'https://cryptgregresearch.org/api/evidence.json',
  treasury: 'https://cryptgregresearch.org/api/treasury.json',
  land: 'https://cryptgregresearch.org/api/land.json',
  receipts: 'https://cryptgregresearch.org/api/receipts.json',
  agents: 'https://cryptgregresearch.org/api/agents.json',
};

const SLUG = /^[a-z0-9-]{1,64}$/;

export function publicUrl(resource: string, id?: string): string | null {
  if (resource === 'project') {
    if (!id || !SLUG.test(id)) return null;
    return `https://cryptgregresearch.org/api/projects/${id}.json`;
  }
  if (id) return null;
  return RESOURCES[resource] ?? null;
}

export const publicResourceNames = Object.keys(RESOURCES);
