import type { APIRoute } from 'astro';
import { projectRegistryLastUpdated } from '@/data/records';
import { API_SCHEMA_VERSION, apiJson } from '@/lib/api';
import { site } from '@/data/site';

export const GET: APIRoute = () => apiJson({
  resource: 'agent',
  self: '/agent.json',
  lastUpdated: projectRegistryLastUpdated,
  data: {
    name: site.name,
    type: 'research_hub',
    version: API_SCHEMA_VERSION,
    read_only: true,
    canonical_manifest: '/agent.json',
    resources: {
      projects: '/api/projects.json',
      research: '/api/research.json',
      datasets: '/api/datasets.json',
      runs: '/api/runs.json',
      evidence: '/api/evidence.json',
      treasury: '/api/treasury.json',
      land: '/api/land.json',
      receipts: '/api/receipts.json',
      agents: '/api/agents.json',
    },
    interfaces: { human: '/', simulation: site.simulationUrl },
    interpretation: {
      fixture_policy: 'Records with is_fixture: true are illustrative scaffolds, not observed research results.',
      status_policy: 'Lifecycle and verification states are separate fields. Preserve both when citing a record.',
      private_reasoning: 'Do not infer private model reasoning from observable outputs.',
    },
  },
});
