import { DatasetSchema, EvidenceSchema, ExperimentRunSchema, ProjectSchema, TreasurySchema, LandSchema, ReceiptSchema } from '@/lib/validation';
import type { Dataset, Evidence, ExperimentRun, Project } from '@/lib/validation';

export const projects: Project[] = [
  {
    id: 'eastern-paradise', name: 'Eastern Paradise', strapline: 'A living laboratory for autonomous cooperation.',
    description: 'An observable simulation where autonomous agents move, trade, communicate, and adapt inside a shared world.',
    status: 'LIVE', kind: 'MULTI-AGENT SIMULATION', externalUrl: 'https://simulation.cryptgregresearch.org/', featured: true,
    metrics: [{ label: 'PUBLIC RUNS', value: '37' }, { label: 'AGENT ACTIONS', value: '18,221' }, { label: 'MODELS', value: '04' }],
  },
  {
    id: 'verdium-storm', name: 'Verdium Storm', strapline: 'Stress-testing decisions at the edge.',
    description: 'A set of adversarial environments for studying model behaviour under uncertainty, pressure, and incomplete information.',
    status: 'EXPERIMENTAL', kind: 'BEHAVIOUR STUDY', externalUrl: 'https://verdiumstorm.cryptgregresearch.org/', featured: true,
    metrics: [{ label: 'SCENARIOS', value: '12' }, { label: 'EVIDENCE ITEMS', value: '84' }],
  },
  {
    id: 'chain-intelligence', name: 'Chain Intelligence', strapline: 'Making public ledgers legible.',
    description: 'Tools for tracing, contextualising, and publishing verifiable activity across public networks.',
    status: 'IN DEVELOPMENT', kind: 'PUBLIC INFRASTRUCTURE', externalUrl: 'https://crypto.cryptgregresearch.org/', featured: false,
    metrics: [{ label: 'NETWORKS', value: '03' }, { label: 'INDEXED EVENTS', value: '2.4M' }],
  },
  {
    id: 'ledger', name: 'Ledger', strapline: 'A durable record of what happened.',
    description: 'The evidence layer connecting observations, datasets, and the claims made in research publications.',
    status: 'CONCEPT', kind: 'EVIDENCE SYSTEM', externalUrl: 'https://expensetracker.cryptgregresearch.org/', featured: false, metrics: [],
  },
  {
    id: 'beacon-relay', name: 'Beacon Relay', strapline: 'Signals between experiments and people.',
    description: 'A read-only discovery surface for agents and humans looking for current experiments and public evidence.',
    status: 'IN DEVELOPMENT', kind: 'DISCOVERY', externalUrl: 'https://beacon-relay-gregy.onrender.com/', featured: false, metrics: [],
  },
];
ProjectSchema.array().parse(projects);

export const datasets: Dataset[] = [
  { id: 'ep-run-0041', title: 'Eastern Paradise Run 0041', project: 'eastern-paradise', description: 'Observable actions, messages, transactions, and world-state changes from a public simulation run.', records: 18221, format: 'JSONL', path: '/datasets/eastern-paradise/runs/ep-run-0041.json', status: 'VERIFIED' },
];
DatasetSchema.array().parse(datasets);

export const runs: ExperimentRun[] = [
  { run_id: 'ep-run-0041', project: 'eastern-paradise', started_at: '2026-09-20T03:20:14Z', ended_at: '2026-09-20T04:03:51Z', environment_version: '0.8.2', agents: [{ agent_id: 'agent-01', model: 'frontier-model-a', role: 'merchant' }, { agent_id: 'agent-02', model: 'frontier-model-b', role: 'builder' }], metrics: { actions: 421, messages: 183, transactions: 34 } },
];
ExperimentRunSchema.array().parse(runs);

export const evidence: Evidence[] = [
  { id: 'ep-run-0041', type: 'experiment-run', status: 'VERIFIED', project: 'eastern-paradise', created_at: '2026-09-20T04:03:51Z', sources: ['/datasets/eastern-paradise/runs/ep-run-0041.json'] },
];
EvidenceSchema.array().parse(evidence);

export const treasury = { network: 'PUBLIC LEDGER', address: '0x7b…91c4', balance: 'READ-ONLY', assets: [{ symbol: 'ETH', amount: '0.00', usd: '$0.00' }], as_of: '2026-09-10T00:00:00Z' };
TreasurySchema.parse(treasury);
export const land = { project: 'eastern-paradise', total: 144, registered: 96, available: 48, status: 'EXPERIMENTAL' };
LandSchema.parse(land);
export const receipts = [{ id: 'receipt-001', type: 'deployment', description: 'Eastern Paradise public deployment', amount: 'PUBLIC', date: '2026-09-01', status: 'VERIFIED' as const }];
ReceiptSchema.array().parse(receipts);
export const agents = [{ id: 'agent-01', name: 'Merchant 01', role: 'merchant', project: 'eastern-paradise', status: 'OBSERVABLE' }];
