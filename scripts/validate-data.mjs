// @ts-nocheck
import { readFile } from 'node:fs/promises';

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
