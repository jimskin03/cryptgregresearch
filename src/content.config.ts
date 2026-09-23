import { defineCollection, z } from 'astro:content';

const sourceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  url: z.string().url(),
  accessed: z.coerce.date(),
  kind: z.enum(['measurement', 'public-record', 'primary-document', 'dataset', 'peer-reviewed', 'news']).default('measurement'),
  quote: z.string().min(1).optional(),
});

const research = defineCollection({
  type: 'content',
  schema: z.object({
    id: z.string(),
    title: z.string(),
    date: z.coerce.date(),
    status: z.enum(['DRAFT', 'EXPERIMENTAL', 'PREPRINT', 'PUBLISHED', 'RETRACTED']),
    project: z.string(),
    authors: z.array(z.string()),
    datasets: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    summary: z.string(),
    stats: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
    sources: z.array(sourceSchema).default([]),
  }),
});

// Weekly observational series. Roles are explicit and separated so the source
// gate is genuinely independent of the writer:
//   authors          — wrote the draft (research owner)
//   review.data_*    — independently verified the cited records (must not be an author)
//   review.editorial_* — final editorial approval before publication
// Publication fails closed: an edition is rendered or listed only when every
// gate condition holds. See src/lib/observations.ts and docs/weekly-observations.md.
const observations = defineCollection({
  type: 'content',
  schema: z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    edition: z.string().regex(/^\d{4}-W\d{2}$/, 'edition must look like 2026-W39'),
    date: z.coerce.date(),
    status: z.enum(['DRAFT', 'IN REVIEW', 'PUBLISHED', 'RETRACTED']),
    kind: z.enum(['OBSERVATION', 'METHODS']).default('OBSERVATION'),
    conclusion: z.enum(['NONE', 'PRELIMINARY', 'SUPPORTED', 'INCONCLUSIVE']).default('PRELIMINARY'),
    authors: z.array(z.string()).min(1),
    scope: z.array(z.string()).default([]),
    summary: z.string().min(1),
    window: z.object({ start: z.coerce.date(), end: z.coerce.date() }),
    observed: z.array(z.string()).default([]),
    interpreted: z.array(z.string()).default([]),
    uncertain: z.array(z.string()).default([]),
    datasets: z.array(z.string()).default([]),
    stats: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
    sources: z.array(sourceSchema).default([]),
    review: z.object({
      data_reviewer: z.string().min(1),
      data_verified_at: z.coerce.date().optional(),
      editorial_approver: z.string().min(1),
      editorial_approved_at: z.coerce.date().optional(),
      method: z.string().optional(),
      disagreements: z.array(z.string()).default([]),
      ledger: z.string().optional(),
    }),
    is_fixture: z.boolean().default(false),
  }),
});

export const collections = { research, observations };