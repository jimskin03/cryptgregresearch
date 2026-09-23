import { getCollection, type CollectionEntry } from 'astro:content';

export type Observation = CollectionEntry<'observations'>;

export type GateReport = {
  published: boolean;
  reasons: string[];
};

// Fail closed. An edition is publishable only when every condition below holds;
// anything else stays off the public site and out of the API surface, and is
// reported publicly as a withheld count only.
export function gateReport(entry: Observation, now: Date = new Date()): GateReport {
  const reasons: string[] = [];
  const { data } = entry;

  if (data.status !== 'PUBLISHED') reasons.push(`status is ${data.status}, not PUBLISHED`);
  if (data.sources.length === 0) reasons.push('no cited sources');
  for (const source of data.sources) {
    if (!source.quote) reasons.push(`source ${source.id} has no verbatim quote`);
  }

  // The source gate must be independent of the writer.
  if (data.authors.includes(data.review.data_reviewer)) {
    reasons.push(`data reviewer ${data.review.data_reviewer} is also an author of the draft`);
  }
  if (!data.review.data_verified_at) reasons.push('no independent data-verification timestamp');
  if (!data.review.editorial_approved_at) reasons.push('no editorial approval timestamp');

  if (data.window.start > data.window.end) reasons.push('observation window start is after its end');
  if (data.window.end > now) reasons.push('observation window ends in the future');
  if (data.review.data_verified_at && data.review.data_verified_at > now) reasons.push('data-verification timestamp is in the future');
  if (data.review.editorial_approved_at && data.review.editorial_approved_at > now) reasons.push('editorial approval timestamp is in the future');
  if (data.is_fixture) reasons.push('edition is a fixture, not an observation');

  return { published: reasons.length === 0, reasons };
}

export async function publishedObservations(now: Date = new Date()): Promise<Observation[]> {
  const entries = await getCollection('observations');
  return entries
    .filter((entry) => gateReport(entry, now).published)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

// Publication month for display, e.g. "2026-W39 · September 2026".
export function editionLabel(entry: Observation) {
  return `${entry.data.edition} · ${entry.data.date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
}

// Evidence rail rows, numbered in source order so inline [n] markers match.
export function numberedSources(entry: Observation) {
  return entry.data.sources.map((source, index) => ({ n: index + 1, ...source }));
}