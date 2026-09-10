# Cryptgreg Research

Astro foundation for a static, evidence-linked research platform.

## Commands

```sh
pnpm install
pnpm run validate
pnpm run build
pnpm run dev
```

The build validates the typed canonical records in `src/data/records.ts` and the Markdown research collection. Public machine-readable resources are generated from those sources at `/api/*.json`; legacy root JSON URLs remain available for compatibility.

## Architecture

- `src/content/research/` contains publication source material.
- `src/data/records.ts` is the canonical source for projects, datasets, runs, evidence, and public records.
- `src/lib/validation.ts` owns the Zod schemas and status vocabulary.
- `src/components/` contains reusable presentation components.
- `src/pages/api/` exposes read-only JSON resources, with legacy aliases at the root.
- `src/scripts/auth.ts` contains the optional Supabase magic-link flow. Set `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` to enable it.

Only observable outputs belong in datasets. Private model reasoning and chain-of-thought are explicitly excluded.
