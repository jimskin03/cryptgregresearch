import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { apiJson } from '@/lib/api';
import { gateReport, numberedSources } from '@/lib/observations';

// Read-only mirror of the weekly observational series. The source gate applies
// here too: withheld editions are counted, never disclosed.
export const GET: APIRoute = async () => {
  const all = await getCollection('observations');
  const reports = all.map((entry) => ({ entry, gate: gateReport(entry) }));
  const published = reports.filter(({ gate }) => gate.published).map(({ entry }) => entry);

  const editions = published
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
    .map((entry) => ({
      id: entry.data.id,
      title: entry.data.title,
      edition: entry.data.edition,
      date: entry.data.date.toISOString(),
      status: entry.data.status,
      kind: entry.data.kind,
      conclusion: entry.data.conclusion,
      is_methods_memo: entry.data.kind === 'METHODS' || entry.data.conclusion === 'NONE',
      authors: entry.data.authors,
      scope: entry.data.scope,
      summary: entry.data.summary,
      window: { start: entry.data.window.start.toISOString(), end: entry.data.window.end.toISOString() },
      observed: entry.data.observed,
      interpreted: entry.data.interpreted,
      uncertain: entry.data.uncertain,
      datasets: entry.data.datasets,
      stats: entry.data.stats,
      sources: numberedSources(entry).map(({ n, id, title, url, accessed, kind, quote }) => ({
        n, id, title, url, accessed: accessed.toISOString(), kind, quote: quote ?? null,
      })),
      review: {
        data_reviewer: entry.data.review.data_reviewer,
        data_verified_at: entry.data.review.data_verified_at?.toISOString() ?? null,
        editorial_approver: entry.data.review.editorial_approver,
        editorial_approved_at: entry.data.review.editorial_approved_at?.toISOString() ?? null,
        method: entry.data.review.method ?? null,
        disagreements: entry.data.review.disagreements,
        ledger: entry.data.review.ledger ?? null,
      },
      url: `/research/weekly/${entry.slug}`,
      is_fixture: entry.data.is_fixture,
      gate: { published: true, reasons: [] },
    }));

  const lastUpdated = published.length > 0
    ? published.map((entry) => entry.data.date).sort((a, b) => b.valueOf() - a.valueOf())[0].toISOString()
    : null;

  return apiJson({
    resource: 'observations',
    lastUpdated,
    data: {
      series: 'weekly',
      cadence: 'weekly',
      scope: ['eastern-paradise', 'chain-intelligence'],
      excluded: ['expense-tracker', 'portal-telemetry'],
      roles: { author: 'research owner', data_reviewer: 'independent record verification', editorial_approver: 'final editorial approval before publication' },
      publication_rule: 'Fails closed: an edition is published only when its status is PUBLISHED, every source carries a url, access date and verbatim quote, an independent data reviewer (not an author) has verified the cited records, and editorial approval is recorded.',
      structure: ['observed', 'interpreted', 'uncertain'],
      edition_kinds: ['OBSERVATION', 'METHODS'],
      conclusion_states: ['NONE', 'PRELIMINARY', 'SUPPORTED', 'INCONCLUSIVE'],
      published_editions: editions.length,
      withheld_editions: reports.length - editions.length,
      latest_edition: editions[0]?.edition ?? null,
      editions,
    },
  });
};