#!/usr/bin/env node
// @ts-nocheck
// Two gates, both fail closed:
//   1. public fixture datasets stay non-future-dated and explicitly flagged;
//   2. a PUBLISHED weekly observation must carry cited sources with access dates
//      and quotes, an independent data review (reviewer not an author), and
//      recorded editorial approval — otherwise the build fails instead of
//      shipping an unevidenced claim.
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const files = ['public/datasets/eastern-paradise/runs/ep-run-0041.json'];
for (const file of files) {
  const parsed = JSON.parse(await readFile(file, 'utf8'));
  if (!parsed.run_id || !parsed.project || !parsed.metrics || parsed.is_fixture !== true || parsed.observable_outputs?.note === undefined) {
    throw new Error(`${file}: missing required or fixture metadata`);
  }
  if (new Date(parsed.started_at) > new Date() || new Date(parsed.ended_at) > new Date()) {
    throw new Error(`${file}: fixture timestamps must not be future-dated`);
  }
}
console.log(`Validated ${files.length} public fixture dataset file(s).`);

const observationsDir = 'src/content/observations';
const errors = [];
let published = 0;

const scalar = (front, key) => front.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1]?.trim();
const nested = (front, key) => front.match(new RegExp(`^\\s+${key}:\\s*(.+)$`, 'm'))?.[1]?.trim();
const list = (front, key) => {
  const block = front.match(new RegExp(`^${key}:\\s*\\n((?:\\s+-\\s*.+\\n)+)`, 'm'))?.[1] ?? '';
  return block.split('\n').map((line) => line.replace(/^\s*-\s*/, '').replace(/^['"]|['"]$/g, '').trim()).filter(Boolean);
};
const inFuture = (value) => value && new Date(value) > new Date();

if (existsSync(observationsDir)) {
  const entries = (await readdir(observationsDir)).filter((name) => name.endsWith('.md') && !name.startsWith('_'));
  for (const name of entries) {
    const raw = await readFile(`${observationsDir}/${name}`, 'utf8');
    const parts = raw.split(/^---\s*$/m);
    const front = parts[1] ?? '';
    const fail = (message) => errors.push(`${observationsDir}/${name}: ${message}`);
    const status = scalar(front, 'status');
    const edition = scalar(front, 'edition') ?? 'unknown edition';

    if (!/^\d{4}-W\d{2}$/.test(edition)) fail(`edition "${edition}" is not in YYYY-Www form`);
    if (!scalar(front, 'title')) fail('missing title');
    if (!scalar(front, 'summary')) fail('missing summary');
    if (!scalar(front, 'scope') && list(front, 'scope').length === 0) fail('missing scope');
    const authors = list(front, 'authors');
    if (authors.length === 0) fail('missing authors');
    if (!scalar(front, 'window')) fail('missing observation window');

    if (status === 'PUBLISHED') {
      published += 1;
      const urlCount = (front.match(/^\s+url:/gm) ?? []).length;
      const accessedCount = (front.match(/^\s+accessed:/gm) ?? []).length;
      const quoteCount = (front.match(/^\s+quote:/gm) ?? []).length;
      if (urlCount === 0) fail('PUBLISHED edition cites no sources');
      if (urlCount !== accessedCount) fail(`every source needs an accessed date (${urlCount} urls, ${accessedCount} accessed)`);
      if (quoteCount !== urlCount) fail(`every source needs a verbatim quote (${urlCount} urls, ${quoteCount} quotes)`);
      const dataReviewer = nested(front, 'data_reviewer');
      if (!dataReviewer) fail('missing review.data_reviewer');
      if (dataReviewer && authors.includes(dataReviewer)) fail(`data reviewer ${dataReviewer} is also an author — the source gate must be independent`);
      if (!nested(front, 'data_verified_at')) fail('missing review.data_verified_at');
      if (!nested(front, 'editorial_approver')) fail('missing review.editorial_approver');
      if (!nested(front, 'editorial_approved_at')) fail('missing review.editorial_approved_at');
      for (const line of front.match(/^\s+accessed:\s*(\S+)/gm) ?? []) {
        const value = line.split(':')[1].trim();
        if (inFuture(value)) fail(`accessed date ${value} is in the future`);
      }
      if (inFuture(nested(front, 'data_verified_at'))) fail('review.data_verified_at is in the future');
      // The runtime gate withholds a PUBLISHED edition whose observation window is
      // still open, so fail the build here instead of letting it vanish silently.
      const windowEnd = front.match(/^\s+end:\s*(\S+)/m)?.[1]?.trim();
      const windowStart = front.match(/^\s+start:\s*(\S+)/m)?.[1]?.trim();
      if (windowEnd && inFuture(windowEnd)) fail(`observation window ends ${windowEnd} in the future — the gate would withhold this edition`);
      if (windowStart && windowEnd && new Date(windowStart) > new Date(windowEnd)) fail('window.start is after window.end');
      if (inFuture(nested(front, 'editorial_approved_at'))) fail('review.editorial_approved_at is in the future');
      if (/^is_fixture:\s*true/m.test(front)) fail('PUBLISHED edition is marked is_fixture: true');
      const observed = list(front, 'observed');
      const cited = [...observed, ...list(front, 'interpreted'), ...list(front, 'uncertain')].filter((item) => /\[\d+\]/.test(item)).length;
      if (observed.length > 0 && cited === 0) fail('no inline [n] citation anywhere in the findings');
    } else if (status && !['DRAFT', 'IN REVIEW', 'RETRACTED'].includes(status)) {
      fail(`unknown status "${status}"`);
    }
  }
  console.log(`Validated ${published} published weekly observation(s) out of ${entries.length} file(s).`);
}

if (errors.length > 0) {
  console.error('Publication gate failed:');
  for (const error of errors) console.error(` - ${error}`);
  process.exit(1);
}
console.log('Publication gate passed: every published edition is sourced, quoted, independently reviewed, and approved.');