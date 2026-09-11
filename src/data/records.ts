import { DatasetSchema, EvidenceSchema, ExperimentRunSchema, ProjectSchema, TreasurySchema, LandSchema, ReceiptSchema } from '@/lib/validation';
import type { Dataset, Evidence, ExperimentRun, Project } from '@/lib/validation';

export const projectRegistryLastUpdated = '2026-09-11T00:00:00Z';
const checked = projectRegistryLastUpdated;

export const projects: Project[] = [
  { id: 'eastern-paradise', name: 'Eastern Paradise', strapline: 'A transparent sanctuary economy built for inspection.', description: 'A transparent sanctuary economy built for inspection.', status: 'EXPERIMENTAL', verificationStatus: 'UNVERIFIED', kind: 'simulation', externalUrl: 'https://simulation.cryptgregresearch.org/', statusCheckedAt: checked, featured: true, isFixture: true, verificationNote: 'The public simulation is live; the published research records are fixture scaffolds until independently verified observations replace them.', metrics: [] },
  { id: 'nightshift', name: 'Nightshift / Template Demo', strapline: 'A public-facing experiment in rapid web interfaces.', description: 'A public-facing experiment in rapid web interfaces.', status: 'LIVE', verificationStatus: 'VERIFIED', kind: 'web experiment', externalUrl: 'https://template.cryptgregresearch.org/', statusCheckedAt: checked, isFixture: false, featured: false, metrics: [] },
  { id: 'verdium-storm', name: 'Verdium Storm', strapline: 'A focused interface for exploring the Verdium concept.', description: 'A focused interface for exploring the Verdium concept.', status: 'LIVE', verificationStatus: 'VERIFIED', kind: 'web application', externalUrl: 'https://verdiumstorm.cryptgregresearch.org/', statusCheckedAt: checked, featured: false, isFixture: false, metrics: [] },
  { id: 'chain-intelligence', name: 'Chain Intelligence', strapline: 'Read-only wallet intelligence across Bitcoin, Solana, and XRP Ledger.', description: 'Read-only wallet intelligence across Bitcoin, Solana, and XRP Ledger.', status: 'LIVE', verificationStatus: 'VERIFIED', kind: 'on-chain dashboard', externalUrl: 'https://crypto.cryptgregresearch.org/', statusCheckedAt: checked, isFixture: false, featured: false, metrics: [] },
  { id: 'expense-tracker', name: 'CryptGreg Finance', strapline: 'One private workspace for your Ledger, compound-growth calculator, and Portfolio.', description: 'One private finance workspace for Ledger, compound growth, and ISIN-based Portfolio tracking.', status: 'LIVE', verificationStatus: 'VERIFIED', kind: 'finance workspace', externalUrl: 'https://expensetracker.cryptgregresearch.org/', statusCheckedAt: checked, featured: false, isFixture: false, metrics: [] },
  { id: 'beacon-relay', name: 'Beacon Relay', strapline: 'An agentic + human play concept under active exploration.', description: 'An agentic + human play concept under active exploration.', status: 'IN DEVELOPMENT', verificationStatus: 'UNVERIFIED', kind: 'research experiment', externalUrl: 'https://beacon-relay-gregy.onrender.com/', statusCheckedAt: checked, verificationNote: 'Concept status; no live-service claim.', isFixture: true, featured: false, metrics: [] },
];
ProjectSchema.array().parse(projects);

export const datasets: Dataset[] = [{ id: 'ep-run-0041', title: 'Eastern Paradise Run 0041 fixture summary', project: 'eastern-paradise', description: 'A public fixture summary for a planned observable simulation run; it is not an event-level dataset.', records: 1, format: 'JSON', path: '/datasets/eastern-paradise/runs/ep-run-0041.json', status: 'EXPERIMENTAL', isFixture: true, note: 'Event-level JSONL is not published yet.' }];
DatasetSchema.array().parse(datasets);

export const runs: ExperimentRun[] = [{ run_id: 'ep-run-0041', project: 'eastern-paradise', started_at: '2026-09-10T03:20:14Z', ended_at: '2026-09-10T04:03:51Z', environment_version: '0.8.2', agents: [{ agent_id: 'agent-01', model: 'frontier-model-a', role: 'merchant' }, { agent_id: 'agent-02', model: 'frontier-model-b', role: 'builder' }], metrics: { actions: 421, messages: 183, transactions: 34 }, isFixture: true }];
ExperimentRunSchema.array().parse(runs);

export const evidence: Evidence[] = [{ id: 'ep-run-0041', type: 'experiment-run', status: 'UNVERIFIED', project: 'eastern-paradise', created_at: '2026-09-10T04:03:51Z', sources: ['/datasets/eastern-paradise/runs/ep-run-0041.json'], isFixture: true }];
EvidenceSchema.array().parse(evidence);

export const treasury = { network: 'NOT YET PUBLISHED', address: 'No public wallet published', balance: 'Not published', assets: [], as_of: projectRegistryLastUpdated, verificationStatus: 'PENDING' as const, isFixture: true, note: 'Treasury values are withheld until a source-linked public wallet and audit record are available.' };
TreasurySchema.parse(treasury);
export const treasuryRows = [
  { label: 'Treasury wallet', value: 'source pending', status: 'UNVERIFIED' },
  { label: 'Treasury balance', value: 'source pending', status: 'UNVERIFIED' },
  { label: 'Reserve policy', value: 'not published', status: 'PENDING' },
] as const;

export const land = { project: 'eastern-paradise', total: 3, registered: 1, available: 1, status: 'EXPERIMENTAL', verificationStatus: 'PENDING' as const, isFixture: true, note: 'These three illustrative sample plots are not a complete land registry.' };
LandSchema.parse(land);
export const landPlots = [
  { id: 'EP-0001', status: 'OWNED', description: 'Filled node motif' },
  { id: 'EP-0002', status: 'OPEN', description: 'Concentric survey motif' },
  { id: 'EP-0003', status: 'UPCOMING', description: 'Cross-grid motif' },
] as const;

export const receipts = [{ id: 'receipt-001', type: 'deployment', description: 'Eastern Paradise public deployment', amount: 'PUBLIC', date: '2026-09-01', status: 'VERIFIED' as const, source: 'https://simulation.cryptgregresearch.org/', isFixture: false }];
ReceiptSchema.array().parse(receipts);
export const auditReceipts = [
  { label: 'RESEARCH / PUBLICATIONS', description: 'Experimental publications with their linked project and dataset context.', href: '/research' },
  { label: 'EVIDENCE / API', description: 'Published evidence records, statuses, and source paths.', href: '/api/evidence.json' },
  { label: 'PROJECTS / REGISTRY', description: 'Project lifecycle, verification state, and last-check timestamps.', href: '/api/projects.json' },
] as const;

export const agents = [{ id: 'agent-01', name: 'Merchant 01', role: 'merchant', project: 'eastern-paradise', status: 'OBSERVABLE' }];
