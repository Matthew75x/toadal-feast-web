import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=fs.readFileSync(path.join(root,'scripts','owner-preview-browser-matrix.mjs'),'utf8');

test('owner preview matrix waits for the companion position lifecycle before geometry sampling',()=>{
  assert.match(source,/async function waitForCompanionReady\(timeoutMs=1500\)/);
  assert.match(source,/getAttribute\('data-position-ready'\)==='true'/);
  assert.match(source,/const companionReady=await waitForCompanionReady\(\)/);
  assert.match(source,/if\(!companionReady\)issues\.push\('companion-position-not-ready'\)/);
  assert.match(source,/results\.push\(\{\.\.\.c,status,issues,companionReady,/);
});
