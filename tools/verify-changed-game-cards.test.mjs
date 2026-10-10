import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {changedCartridges, verifyChangedGameCards} from './verify-changed-game-cards.mjs';

test('both authored and exported runtime changes require a card; docs and unrelated assets do not', () => {
  assert.deepEqual(changedCartridges([
    'studio-project/toadal-feast-website/reference/public/games/lily-pad-leap/index.html',
    'studio-project/toadal-feast-website/reference/public/games/lily-pad-leap/toadal-bridge.js',
    'dist/public/games/lily-pad-leap/poster.webp',
    'dist/public/games/old-preview/README.md',
    'dist/assets/images/home.webp',
  ]), [
    'dist/public/games/lily-pad-leap',
    'studio-project/toadal-feast-website/reference/public/games/lily-pad-leap',
  ]);
});

test('unchanged historical previews pass; runtime mutation fails closed; full removal is recorded', () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'toadal card gate '));
  const git = (...args) => {
    const r = spawnSync('git', ['-c', 'user.name=Gate Fixture', '-c', 'user.email=fixture@example.invalid', ...args],
      {cwd: repo, encoding: 'utf8'});
    assert.equal(r.status, 0, r.stderr);
    return r.stdout.trim();
  };
  try {
    git('init');
    const root = path.join(repo, 'dist/public/games/historical');
    fs.mkdirSync(root, {recursive: true});
    fs.writeFileSync(path.join(root, 'index.html'), '<p>Old preview</p>');
    fs.mkdirSync(path.join(repo, 'tools'));
    fs.copyFileSync(path.join(import.meta.dirname, 'verify-required-game-card.mjs'), path.join(repo, 'tools/verify-required-game-card.mjs'));
    git('add', '.'); git('commit', '-m', 'historical fixture');
    const base = git('rev-parse', 'HEAD');
    assert.deepEqual(verifyChangedGameCards({repo, base}).cartridges, []);
    fs.writeFileSync(path.join(root, 'index.html'), '<p>Changed runtime without approved card</p>');
    git('add', '.'); git('commit', '-m', 'changed fixture');
    assert.throws(() => verifyChangedGameCards({repo, base}), /historical.*CARD_GATE_FAIL/);
    fs.rmSync(root, {recursive: true});
    git('add', '.'); git('commit', '-m', 'removed fixture');
    assert.deepEqual(verifyChangedGameCards({repo, base}).cartridges,
      [{root: 'dist/public/games/historical', status: 'REMOVED'}]);
    assert.throws(() => verifyChangedGameCards({repo, base: 'missing-comparison-ref'}), /Cannot establish changed cartridge scope/);
  } finally { fs.rmSync(repo, {recursive: true, force: true}); }
});
