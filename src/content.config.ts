import { defineCollection, z } from 'astro:content';

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
  }),
});

export const collections = { research };
