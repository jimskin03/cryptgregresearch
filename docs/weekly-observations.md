# Weekly observational series — writer contract

The site's `/research/weekly` series publishes one dated observational edition per week. Collection:
`src/content/observations/`. Rendering: `src/pages/research/weekly/`. Machine surface: `/api/observations.json`.

## Scope (v1)

- **In scope:** Eastern Paradise public records (`/api/runs.json`, `/api/evidence.json`, `/api/agents.json`,
  `/api/datasets.json`, `/api/land.json`) and Chain Intelligence readings (`https://crypto.cryptgregresearch.org/`).
- **Out of scope:** CryptGreg Finance and portal telemetry.
- **Cadence:** weekly, Mondays 09:00 Asia/Kuala_Lumpur. The window is the seven days before the run.

## Hard rules

1. **Fail closed.** An edition reaches the public site and the API only when all of these hold — the code enforces them
   in `src/lib/observations.ts` (`gateReport`) and the build enforces them in `scripts/validate-data.mjs`:
   - `status: PUBLISHED`
   - at least one source, each with `url`, `accessed`, and a verbatim `quote` from the fetched page
   - `review.verified_at` recorded by an independent reviewer
   - `is_fixture` not true, observation window in the past, `window.start <= window.end`
   A draft that fails any rule stays invisible on the site and is only counted as withheld.
2. **No hand-typed numbers.** Every figure comes from a fetched response or a source page. Register sources at retrieval
   time with the `grounded-citations` ledger (`scripts/sources.py add`), cite inline as `[n]` in `observed` /
   `interpreted` / `uncertain`, and run `sources.py verify <draft> --evidence` before handing the draft over. Source order
   in the frontmatter **is** the citation numbering.
3. **Separate reading from measuring.** `observed` holds what the public record shows; `interpreted` holds our reading of
   it; `uncertain` holds what we cannot support — including missing data. Never move an unsourced figure into `observed`.
4. **No private reasoning.** Observable outputs only; never infer model reasoning.
5. **Independent gate.** A different agent than the writer must review the sources and fill `review.reviewer` /
   `review.verified_at`. The writer never self-approves.

## Draft shape

```markdown
---
id: 2026-w39-observations
title: 'Week 39: what the public record showed'
edition: 2026-W39
date: 2026-09-28
status: PUBLISHED
scope: [eastern-paradise, chain-intelligence]
summary: One paragraph, factual, no claims beyond the cited record.
window:
  start: 2026-09-21
  end: 2026-09-27
observed:
  - 'Figures as the public API reported them.[1]'
interpreted:
  - 'Our reading of that record, clearly ours.[2]'
uncertain:
  - 'What the data cannot support yet.'
datasets: [ep-run-0041]
sources:
  - id: ep-runs
    title: Eastern Paradise runs
    url: https://cryptgregresearch.org/api/runs.json
    accessed: 2026-09-28
    kind: measurement
    quote: 'Verbatim sentence from the fetched page.'
review:
  reviewer: A.IRis
  verified_at: 2026-09-28T09:40:00Z
  method: 'Re-fetched every source, checked each quote verbatim, and re-ran the endpoint probes.'
is_fixture: false
---

Body prose with the same `[n]` citations.
```

## Handoff to publishing

The writer leaves `YYYY-WW.md` plus its citation ledger JSON in
`~/.hermes/profiles/aixin/inbox/weekly-observations/`. Publishing is a separate, reviewable step: the publishing agent
rebases onto `origin/main`, drops the edition into the collection, runs `pnpm run check`, `pnpm run validate`,
`pnpm run build`, then commits and pushes — and only after the review gate is present. A red gate blocks the push.
