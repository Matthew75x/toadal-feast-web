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

test('Gulper route34 is an editable noindex availability page while public cartridge admission is held', () => {
  const index = readJson('pages/index.json');
  const route = index.pages.find(page => page.route === '/player/claw-feed-gulper/');
  assert.equal(route.id, 'page.player-claw-feed-gulper');
  assert.equal(route.route, '/player/claw-feed-gulper/');
  assert.equal(route.file, 'pages/player-claw-feed-gulper.json');
  assert.equal(index.pages.length, 34);

  const play = readJson('pages/play.json');
  const detail = readJson('pages/game-claw-feed-gulper.json');
  const player = readJson(route.file);
  const game = readJson('games/claw-feed-gulper.json');
  assert.equal(route.title, player.title, 'the registered title matches the actual held route');
  assert.ok(collectHrefs(play).includes('/games/claw-feed-gulper/'), 'Play links to Gulper details');
  assert.ok(!collectHrefs(detail).includes('/player/claw-feed-gulper/'), 'details do not offer a held launch');
  assert.ok(collectHrefs(player).includes('/games/claw-feed-gulper/'), 'held route returns to game details');
  assert.ok(collectHrefs(player).includes('/games/wicked-bites/'), 'held route offers the admitted alternative');
  assert.equal(game.web.enabled, false);
  assert.equal(game.web.browserCartridge.runnable, false);
  assert.equal(game.web.browserCartridge.launchHeld, true);
  assert.equal(player.publicationState, 'noindex');
  assert.equal(player.studioGenerated, true);
  assert.equal(player.referenceFile, 'player/claw-feed-gulper/index.html');
  assert.match(JSON.stringify(player.components), /Browser play is not available yet/);
  assert.doesNotMatch(JSON.stringify(player.components), /isolated-frame|<iframe|\/public\/games\/claw-feed-gulper/);

  const html = fs.readFileSync(path.join(root, 'dist', 'player', 'claw-feed-gulper', 'index.html'), 'utf8');
  assert.match(html, /<title>CLAW: Feed Gulper.*Preview unavailable/);
  assert.match(html, /name="robots" content="noindex,\s*nofollow"/);
  assert.match(html, /Browser play is not available yet/);
  assert.doesNotMatch(html, /<iframe|\/public\/games\/claw-feed-gulper\/index\.html/);
  const detailHtml = fs.readFileSync(path.join(root, 'dist/games/claw-feed-gulper/index.html'), 'utf8');
  assert.match(detailHtml, /not available to play yet|Browser play is not available yet/);
  assert.doesNotMatch(detailHtml, /Playable browser preview|browser preview is ready|Browser-local save/i,
    'held detail and companion copy must not describe a playable or saving browser game');
  assert.doesNotMatch(detailHtml, /href=['"][^'"]*\/player\/claw-feed-gulper\//i,
    'held detail must not offer a player launch');
  assert.equal(fs.existsSync(path.join(root, 'dist/public/games/claw-feed-gulper')), false);
  assert.equal(fs.existsSync(path.join(project, 'reference/public/games/claw-feed-gulper/index.html')), true,
    'the accepted private source remains preserved');

  const ledger = JSON.parse(fs.readFileSync(path.join(root, 'manifests', 'manifest-compliance-ledger.json'), 'utf8'));
  assert.deepEqual(currentRouteQualificationErrors(root, ledger, index), []);
  assert.deepEqual(verifyManifestCompliance(root).errors, []);
});
