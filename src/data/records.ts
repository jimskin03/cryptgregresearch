import { DatasetSchema, EvidenceSchema, ExperimentRunSchema, ProjectSchema, TreasurySchema, LandSchema, ReceiptSchema } from '@/lib/validation';
import type { Dataset, Evidence, ExperimentRun, Project } from '@/lib/validation';

export const projectRegistryLastUpdated = '2026-09-10T00:00:00Z';
const checked = projectRegistryLastUpdated;

export const projects: Project[] = [
  { id: 'eastern-paradise', name: 'Eastern Paradise', strapline: 'A transparent sanctuary economy built for inspection.', description: 'A transparent sanctuary economy built for inspection.', status: 'FEATURED', kind: 'simulation', externalUrl: 'https://simulation.cryptgregresearch.org/', statusCheckedAt: checked, featured: true, isFixture: true, metrics: [] },
  { id: 'nightshift', name: 'Nightshift / Template Demo', strapline: 'A public-facing experiment in rapid web interfaces.', description: 'A public-facing experiment in rapid web interfaces.', status: 'UNVERIFIED', kind: 'web experiment', externalUrl: 'https://template.cryptgregresearch.org/', statusCheckedAt: checked, verificationNote: 'Browser-side verification deferred; server check did not resolve.', isFixture: true, featured: false, metrics: [] },
  { id: 'verdium-storm', name: 'Verdium Storm', strapline: 'A focused interface for exploring the Verdium concept.', description: 'A focused interface for exploring the Verdium concept.', status: 'LIVE', kind: 'web application', externalUrl: 'https://verdiumstorm.cryptgregresearch.org/', statusCheckedAt: checked, featured: false, isFixture: false, metrics: [] },
  { id: 'chain-intelligence', name: 'Chain Intelligence', strapline: 'Read-only wallet intelligence across Bitcoin, Solana, and XRP Ledger.', description: 'Read-only wallet intelligence across Bitcoin, Solana, and XRP Ledger.', status: 'UNVERIFIED', kind: 'on-chain dashboard', externalUrl: 'https://crypto.cryptgregresearch.org/', statusCheckedAt: checked, verificationNote: 'Vercel deployment reported; custom-domain DNS and HTTPS verification pending.', isFixture: true, featured: false, metrics: [] },
  { id: 'expense-tracker', name: 'Expense Tracker + Compound Calculator', strapline: 'Ledger: a practical personal finance tool with an integrated compound-growth calculator.', description: 'Ledger: a practical personal finance tool with an integrated compound-growth calculator.', status: 'LIVE', kind: 'web application + utility', externalUrl: 'https://expensetracker.cryptgregresearch.org/', statusCheckedAt: checked, featured: false, isFixture: false, metrics: [] },
  { id: 'beacon-relay', name: 'Beacon Relay', strapline: 'An agentic + human play concept under active exploration.', description: 'An agentic + human play concept under active exploration.', status: 'CONCEPT / IN DEVELOPMENT', kind: 'research experiment', externalUrl: 'https://beacon-relay-gregy.onrender.com/', statusCheckedAt: checked, verificationNote: 'Concept status; no live-service claim.', isFixture: true, featured: false, metrics: [] },
];
ProjectSchema.array().parse(projects);

export const datasets: Dataset[] = [{ id: 'ep-run-0041', title: 'Eastern Paradise Run 0041', project: 'eastern-paradise', description: 'Observable actions, messages, transactions, and world-state changes from a public simulation run.', records: 18221, format: 'JSONL', path: '/datasets/eastern-paradise/runs/ep-run-0041.json', status: 'EXPERIMENTAL', isFixture: true }];
DatasetSchema.array().parse(datasets);

export const runs: ExperimentRun[] = [{ run_id: 'ep-run-0041', project: 'eastern-paradise', started_at: '2026-09-20T03:20:14Z', ended_at: '2026-09-20T04:03:51Z', environment_version: '0.8.2', agents: [{ agent_id: 'agent-01', model: 'frontier-model-a', role: 'merchant' }, { agent_id: 'agent-02', model: 'frontier-model-b', role: 'builder' }], metrics: { actions: 421, messages: 183, transactions: 34 }, isFixture: true }];
ExperimentRunSchema.array().parse(runs);

export const evidence: Evidence[] = [{ id: 'ep-run-0041', type: 'experiment-run', status: 'UNVERIFIED', project: 'eastern-paradise', created_at: '2026-09-20T04:03:51Z', sources: ['/datasets/eastern-paradise/runs/ep-run-0041.json'], isFixture: true }];
EvidenceSchema.array().parse(evidence);

export const treasury = { network: 'PUBLIC LEDGER', address: '0x7b…91c4', balance: 'READ-ONLY', assets: [{ symbol: 'ETH', amount: '0.00', usd: '$0.00' }], as_of: '2026-09-10T00:00:00Z' };
TreasurySchema.parse(treasury);
export const treasuryRows = [
  { label: 'Treasury wallet', value: 'source pending', status: 'UNVERIFIED' },
  { label: 'SOL balance', value: 'source pending', status: 'UNVERIFIED' },
  { label: 'Reserve ratio', value: 'historical record', status: 'HISTORICAL' },
] as const;

export const land = { project: 'eastern-paradise', total: 144, registered: 96, available: 48, status: 'EXPERIMENTAL' };
LandSchema.parse(land);
export const landPlots = [
  { id: 'EP-0001', status: 'OWNED', description: 'Filled node motif' },
  { id: 'EP-0002', status: 'OPEN', description: 'Concentric survey motif' },
  { id: 'EP-0003', status: 'UPCOMING', description: 'Cross-grid motif' },
] as const;

export const receipts = [{ id: 'receipt-001', type: 'deployment', description: 'Eastern Paradise public deployment', amount: 'PUBLIC', date: '2026-09-01', status: 'VERIFIED' as const }];
ReceiptSchema.array().parse(receipts);
export const auditReceipts = [
  { label: 'RUNBOOK / MAINNET', description: 'Operations, thresholds, and approval chain — version-controlled and dated.' },
  { label: 'DEPLOY / EVIDENCE LOG', description: 'Publish claims backed by screenshots, checks, and API responses.' },
  { label: 'PROJECTS / DATA INDEX', description: 'Stable IDs, URLs, hosts, types, and honest status timestamps for agents.' },
] as const;

export const agents = [{ id: 'agent-01', name: 'Merchant 01', role: 'merchant', project: 'eastern-paradise', status: 'OBSERVABLE' }];