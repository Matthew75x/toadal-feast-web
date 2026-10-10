#!/usr/bin/env node
// Adopt CARD-02 for changed cartridges without requalifying historical previews.
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export function changedCartridges(files) {
  const roots = new Set();
  for (const file of files) {
    const match = file.replaceAll('\\', '/').match(/^(studio-project\/toadal-feast-website\/reference|dist)\/public\/games\/([a-z0-9]+(?:-[a-z0-9]+)*)\/(.+)$/);
    if (!match || /(?:^|\/)(?:README[^/]*|LICENSE[^/]*|[^/]+\.md)$/i.test(match[3])) continue;
    roots.add(`${match[1]}/public/games/${match[2]}`);
  }
  return [...roots].sort();
}

export function verifyChangedGameCards({repo, base, head = 'HEAD'}) {
  if (!base) throw Error('Explicit comparison base is required');
  const diff = spawnSync('git', ['diff', '--name-only', '-z', base, head, '--',
    'studio-project/toadal-feast-website/reference/public/games', 'dist/public/games'],
    {cwd: repo, encoding: 'utf8', env: {...process.env, GIT_NO_LAZY_FETCH: '1'}});
  if (diff.status !== 0) throw Error(`Cannot establish changed cartridge scope: ${diff.stderr}`);
  const roots = changedCartridges(diff.stdout.split('\0').filter(Boolean));
  const results = [];
  for (const relative of roots) {
    const root = path.join(repo, relative);
    // Complete deletion is not admission. Partial deletion still fails the gate.
    if (!fs.existsSync(root)) { results.push({root: relative, status: 'REMOVED'}); continue; }
    const check = spawnSync(process.execPath, [path.join(repo, 'tools/verify-required-game-card.mjs'), root],
      {cwd: repo, encoding: 'utf8'});
    if (check.status !== 0) throw Error(`${relative}: ${check.stderr.trim()}`);
    results.push({root: relative, ...JSON.parse(check.stdout)});
  }
  return {status: 'CHANGED_CARD_GATE_PASS', comparison: {base, head}, cartridges: results,
    releaseApproval: false, historicalUnchangedCartridgesRequalified: false};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [base, head, ...extra] = process.argv.slice(2);
    if (!base || extra.length) throw Error('Usage: node tools/verify-changed-game-cards.mjs BASE [HEAD]');
    console.log(JSON.stringify(verifyChangedGameCards({repo: path.resolve(import.meta.dirname, '..'), base, head}), null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
