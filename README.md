# Cryptgreg Research

Astro foundation for a static, evidence-linked research platform.

## Commands

```sh
pnpm install
pnpm run check
pnpm run validate
pnpm run build
pnpm run dev
```

The homepage is implemented by `src/components/LegacyHome.astro` with the unchanged legacy stylesheet in `src/styles/legacy-home.css`. Its DOM, class names, section order, spacing, breakpoints, and visual system are frozen; refactors should change implementation or data flow only.

## Architecture

- `src/content/research/` contains publication source material.
- `src/data/records.ts` is the canonical source for projects, datasets, runs, evidence, and public records.
- `src/components/LegacyHome.astro` owns the homepage markup; it does not fetch or replace cards after load.
- `src/styles/legacy-home.css` preserves the legacy homepage CSS unchanged.
- `src/lib/validation.ts` owns the Zod schemas and status vocabulary.
- `src/components/` contains reusable presentation components.
- `src/pages/api/` exposes read-only JSON resources. `/projects.json` is a compatibility representation generated from the typed project registry.
- `src/scripts/auth.ts` contains the optional Supabase magic-link flow. Set `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` to enable it.
- GitHub Pages publishes only the Astro build artifact from `.github/workflows/astro-pages.yml`, so `src/pages/` and `public/` are the canonical sources; the Astro build is the only publisher for this domain.

The public Eastern Paradise run is explicitly marked as fixture data until it is replaced by a dated, source-linked observation. Only observable outputs belong in datasets. Private model reasoning and chain-of-thought are explicitly excluded.