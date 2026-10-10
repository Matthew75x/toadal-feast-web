import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { currentRouteQualificationErrors } from './lib/current-route-qualification.mjs';
import { verifyManifestCompliance } from './verify-manifest-compliance-ledger.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const project = path.join(root, 'studio-project', 'toadal-feast-website');
const readJson = file => JSON.parse(fs.readFileSync(path.join(project, file), 'utf8'));
function collectHrefs(value, result = []) {
  if (Array.isArray(value)) for (const child of value) collectHrefs(child, result);
  else if (value && typeof value === 'object') {
    if (typeof value.href === 'string') result.push(value.href);
    for (const child of Object.values(value)) collectHrefs(child, result);
  }
  return result;
}

test('Gulper player route 34 is a noindex Studio preview with working source navigation and export', () => {
  const index = readJson('pages/index.json');
  const route = index.pages.find(page => page.route === '/player/claw-feed-gulper/');
  assert.deepEqual(route, {
    id: 'page.player-claw-feed-gulper',
    route: '/player/claw-feed-gulper/',
    file: 'pages/player-claw-feed-gulper.json',
    title: 'CLAW: Feed Gulper browser preview · TOADAL FEAST',
  });
  assert.equal(index.pages.length, 34);

  const play = readJson('pages/play.json');
  const detail = readJson('pages/game-claw-feed-gulper.json');
  const player = readJson(route.file);
  assert.ok(collectHrefs(play).includes('/games/claw-feed-gulper/'), 'Play links to Gulper details');
  assert.ok(collectHrefs(detail).includes('/player/claw-feed-gulper/'), 'Gulper details launch route 34');
  assert.ok(collectHrefs(player).includes('/games/claw-feed-gulper/'), 'player returns to game details');
  assert.equal(player.publicationState, 'noindex');
  assert.equal(player.studioGenerated, true);
  assert.equal(player.referenceFile, 'player/claw-feed-gulper/index.html');
  assert.match(JSON.stringify(player), /wo002-browser-player/);
  assert.match(JSON.stringify(player), /claw-feed-gulper-session-hud/);

  const html = fs.readFileSync(path.join(root, 'dist', 'player', 'claw-feed-gulper', 'index.html'), 'utf8');
  assert.match(html, /<title>CLAW: Feed Gulper browser preview/);
  assert.match(html, /name="robots" content="noindex,\s*nofollow"/);
  assert.match(html, /\/toadal-feast-web\/public\/games\/claw-feed-gulper\/index\.html/);
  assert.match(html, /sandbox="allow-scripts allow-pointer-lock"/);
  assert.doesNotMatch(html, /allow-same-origin/);

  const ledger = JSON.parse(fs.readFileSync(path.join(root, 'manifests', 'manifest-compliance-ledger.json'), 'utf8'));
  assert.deepEqual(currentRouteQualificationErrors(root, ledger, index), []);
  assert.deepEqual(verifyManifestCompliance(root).errors, []);
});
