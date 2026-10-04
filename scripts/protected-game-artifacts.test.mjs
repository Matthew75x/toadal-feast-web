import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { verifyProtectedGameArtifacts } from './lib/protected-game-artifacts.mjs';

const htmlPath = 'public/games/wicked-bites/index.html';
const cssPath = 'public/games/wicked-bites/game.css';
const htmlBytes = Buffer.from('<!doctype html><html><body>protected game</body></html>');
const cssBytes = Buffer.from('.game { color: #f00; }\n');

async function makeFixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'protected-game-artifacts-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const project = path.join(root, 'project');
  const reference = path.join(project, 'reference');
  const dist = path.join(root, 'dist');
  await mkdir(path.join(reference, path.dirname(htmlPath)), { recursive: true });
  await mkdir(path.join(dist, path.dirname(htmlPath)), { recursive: true });
  await writeFile(path.join(reference, htmlPath), htmlBytes);
  await writeFile(path.join(reference, cssPath), cssBytes);
  await writeFile(path.join(dist, htmlPath), htmlBytes);
  await writeFile(path.join(dist, cssPath), cssBytes);
  return { dist, project };
}

test('protected game artifact verifier accepts exact accounted HTML and CSS bytes', async (t) => {
  const { dist, project } = await makeFixture(t);
  const result = verifyProtectedGameArtifacts(dist, project);
  assert.equal(result.valid, true, result.errors.join('\n'));
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.files.map(({ file }) => file).sort(), [cssPath, htmlPath]);
  assert.ok(result.files.every(({ sourceHash, exportHash }) => sourceHash === exportHash));
});

test('protected game artifact verifier rejects missing published payloads', async (t) => {
  const { dist, project } = await makeFixture(t);
  await rm(path.join(dist, cssPath));
  const result = verifyProtectedGameArtifacts(dist, project);
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes(`Protected artifact missing: ${cssPath}`), result.errors.join('\n'));
});

test('protected game artifact verifier rejects tampered published payload bytes', async (t) => {
  const { dist, project } = await makeFixture(t);
  await writeFile(path.join(dist, htmlPath), Buffer.concat([htmlBytes, Buffer.from(' tampered')]));
  const result = verifyProtectedGameArtifacts(dist, project);
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes(`Protected artifact bytes changed: ${htmlPath}`), result.errors.join('\n'));
});

test('protected game artifact verifier rejects unaccounted protected output', async (t) => {
  const { dist, project } = await makeFixture(t);
  const unaccountedPath = path.join(dist, 'cartridges', 'unlisted', 'payload.js');
  await mkdir(path.dirname(unaccountedPath), { recursive: true });
  await writeFile(unaccountedPath, 'unaccounted payload');
  const result = verifyProtectedGameArtifacts(dist, project);
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('Unaccounted protected output: cartridges/unlisted/payload.js'), result.errors.join('\n'));
});
