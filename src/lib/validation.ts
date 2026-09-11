import { z } from 'zod';

export const ProjectStatusSchema = z.enum(['LIVE', 'EXPERIMENTAL', 'IN DEVELOPMENT', 'CONCEPT', 'ARCHIVED', 'OFFLINE', 'UNVERIFIED']);
export const ResearchStatusSchema = z.enum(['DRAFT', 'EXPERIMENTAL', 'PREPRINT', 'PUBLISHED', 'RETRACTED']);
export const EvidenceStatusSchema = z.enum(['VERIFIED', 'UNVERIFIED', 'HISTORICAL', 'PENDING']);

export const ProjectSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/), name: z.string().min(1), strapline: z.string().min(1),
  description: z.string().min(1), status: ProjectStatusSchema, kind: z.string().min(1),
  repository: z.string().url().optional(), deployment: z.string().url().optional(),
  externalUrl: z.string().url().optional(), statusCheckedAt: z.string().datetime().optional(),
  verificationStatus: EvidenceStatusSchema.default('PENDING'), verificationNote: z.string().optional(), isFixture: z.boolean().default(false),
  featured: z.boolean().default(false), metrics: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
});
export const DatasetSchema = z.object({
  id: z.string().min(1), title: z.string().min(1), project: z.string(), description: z.string().min(1),
  records: z.number().int().nonnegative(), format: z.string(), path: z.string().startsWith('/'),
  status: z.enum(['VERIFIED', 'EXPERIMENTAL', 'PENDING']), isFixture: z.boolean().default(false), note: z.string().optional(),
});
export const ExperimentRunSchema = z.object({
  run_id: z.string().min(1), project: z.string(), started_at: z.string().datetime(),
  ended_at: z.string().datetime().optional(), environment_version: z.string(),
  agents: z.array(z.object({ agent_id: z.string(), model: z.string(), role: z.string() })),
  metrics: z.object({ actions: z.number().int().nonnegative(), messages: z.number().int().nonnegative(), transactions: z.number().int().nonnegative() }),
  isFixture: z.boolean().default(false),
});
export const EvidenceSchema = z.object({
  id: z.string(), type: z.enum(['experiment-run', 'transaction', 'deployment', 'dataset', 'screenshot', 'commit', 'benchmark', 'simulation-state', 'agent-log']),
  status: EvidenceStatusSchema, project: z.string(), created_at: z.string().datetime(),
  sources: z.array(z.string().startsWith('/')), isFixture: z.boolean().default(false),
});
export const TreasurySchema = z.object({
  network: z.string(), address: z.string(), balance: z.string(),
  assets: z.array(z.object({ symbol: z.string(), amount: z.string(), usd: z.string() })), as_of: z.string().datetime(),
  verificationStatus: EvidenceStatusSchema.default('PENDING'), isFixture: z.boolean().default(false), note: z.string().optional(),
});
export const LandSchema = z.object({ project: z.string(), total: z.number().int().nonnegative(), registered: z.number().int().nonnegative(), available: z.number().int().nonnegative(), status: z.string(), verificationStatus: EvidenceStatusSchema.default('PENDING'), isFixture: z.boolean().default(false), note: z.string().optional() });
export const ReceiptSchema = z.object({ id: z.string(), type: z.string(), description: z.string(), amount: z.string(), date: z.string(), status: EvidenceStatusSchema, source: z.string().url().optional(), isFixture: z.boolean().default(false) });

export type Project = z.infer<typeof ProjectSchema>;
export type Dataset = z.infer<typeof DatasetSchema>;
export type ExperimentRun = z.infer<typeof ExperimentRunSchema>;
export type Evidence = z.infer<typeof EvidenceSchema>;

export function statusClass(status: string) {
  return `status-${status.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}
