// @ts-nocheck
import { readFile } from 'node:fs/promises';

const files = ['public/datasets/eastern-paradise/runs/ep-run-0041.json'];
for (const file of files) {
  const parsed = JSON.parse(await readFile(file, 'utf8'));
  if (!parsed.run_id || !parsed.project || !parsed.metrics) throw new Error(`${file}: missing required run fields`);
}
console.log(`Validated ${files.length} public dataset file(s). Source record schemas run during Astro build.`);
