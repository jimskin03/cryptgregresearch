// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { publicUrl, publicResourceNames } from '../src/catalog.ts';

test('projects URL exact', () => {
  assert.strictEqual(
    publicUrl('projects'),
    'https://cryptgregresearch.org/api/projects.json',
  );
});

test('project id eastern-paradise exact', () => {
  assert.strictEqual(
    publicUrl('project', 'eastern-paradise'),
    'https://cryptgregresearch.org/api/projects/eastern-paradise.json',
  );
});

test('project id ../admin returns null', () => {
  assert.strictEqual(publicUrl('project', '../admin'), null);
});

test('finance returns null', () => {
  assert.strictEqual(publicUrl('finance'), null);
});

test('bookmarks returns null', () => {
  assert.strictEqual(publicUrl('bookmarks'), null);
});

test('project id with invalid chars or empty returns null', () => {
  assert.strictEqual(publicUrl('project'), null);
  assert.strictEqual(publicUrl('project', ''), null);
  assert.strictEqual(publicUrl('project', 'Invalid_Slug'), null);
  assert.strictEqual(publicUrl('project', 'invalid.slug'), null);
});

test('publicResourceNames contains all public resources and excludes finance/bookmarks', () => {
  const expected = [
    'projects',
    'research',
    'observations',
    'datasets',
    'runs',
    'evidence',
    'treasury',
    'land',
    'receipts',
    'agents',
  ];
  assert.deepStrictEqual(publicResourceNames.sort(), expected.sort());
  assert.strictEqual(publicResourceNames.includes('finance'), false);
  assert.strictEqual(publicResourceNames.includes('bookmarks'), false);
});
