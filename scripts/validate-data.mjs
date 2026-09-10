// @ts-nocheck
import { readFile } from 'node:fs/promises';

const projects = JSON.parse(await readFile('projects.json', 'utf8'));
if (!projects.last_updated || !Array.isArray(projects.projects) || projects.projects.length === 0) {
  throw new Error('projects.json: expected last_updated and a non-empty projects array');
}
for (const project of projects.projects) {
  if (!project.id || !project.name || !project.url) throw new Error(`projects.json: incomplete project ${project.id ?? '(unknown)'}`);
  new URL(project.url);
}

const files = ['public/datasets/eastern-paradise/runs/ep-run-0041.json'];
for (const file of files) {
  const parsed = JSON.parse(await readFile(file, 'utf8'));
  if (!parsed.run_id || !parsed.project || !parsed.metrics || parsed.is_fixture !== true || parsed.observable_outputs?.note === undefined) {
    throw new Error(`${file}: missing required or fixture metadata`);
  }
}
console.log(`Validated ${projects.projects.length} compatibility project records and ${files.length} public dataset file(s).`);