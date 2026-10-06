#!/usr/bin/env node
// Derive display-only availability for already-listed Studio cards. Does not publish or enable games.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { classifyGame, availabilityLabel } = require('../studio-project/toadal-feast-website/reference/assets/js/play-catalogue.js');
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const project = path.join(repo, 'studio-project/toadal-feast-website');
export function* components(value) {
  if (Array.isArray(value)) { for (const child of value) yield* components(child); }
  else if (value && typeof value === 'object') {
    if (value.id && value.type) yield value;
    for (const child of Object.values(value)) yield* components(child);
  }
}
const json = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export function selectedRows(root, page) {
  const cards = [...components(page.components)].filter(node => node.props?.attributes?.['data-game-id'] && /(?:^|\s)studio-game-card(?:\s|$)/.test(node.props.className || ''));
  const ids = new Set();
  return cards.map(card => {
    const id = card.props.attributes['data-game-id'];
    if (!/^[a-z][a-z0-9-]{0,79}$/.test(id) || ids.has(id)) throw new Error('Invalid or duplicate listed game ID');
    ids.add(id);
    const file = path.join(root, 'games', id + '.json'), bytes = fs.readFileSync(file), game = JSON.parse(bytes);
    if (game.schemaVersion !== 1 || game.id !== 'game.' + id || game.slug !== id || typeof game.name !== 'string' || !game.name.trim() ||
        game.name.length > 200 || !['preview', 'public'].includes(game.status) || game.route !== '/games/' + id + '/') throw new Error('Listed game record identity/publication state requires review: ' + id);
    if (card.props.attributes['data-game-status'] !== game.status) throw new Error('Existing release badge/status must be explicitly reconciled: ' + id);
    const availability = classifyGame(game);
    if (availability === 'playable') {
      const entry = path.join(root, 'reference', game.web.browserCartridge.entry);
      if (!fs.existsSync(entry) || !fs.statSync(entry).isFile()) throw new Error('Enabled catalogue entry is not present: ' + id);
      const detail = json(path.join(root, 'pages/game-' + id + '.json'));
      const player = json(path.join(root, 'pages/player-' + id + '.json'));
      if (detail.route !== game.route || player.route !== '/player/' + id + '/' ||
          !JSON.stringify(detail.components).includes(player.route) || !JSON.stringify(player.components).includes(game.web.browserCartridge.entry)) throw new Error('Connected detail/player source is absent: ' + id);
    }
    return { id, card, title: game.name, release: game.status, availability, sourceSha256: sha(bytes), label: availabilityLabel(availability, game.status) };
  });
}
export function synchronize(root = project, checkOnly = true) {
  const file = path.join(root, 'pages/play.json'), page = json(file), rows = selectedRows(root, page), nodes = [...components(page.components)];
  const differences = [];
  function attribute(node, key, value) {
    if (node.props.attributes[key] !== value) { differences.push(node.id + ':' + key); node.props.attributes[key] = value; }
  }
  function text(node, value) {
    if (!node || node.type !== 'core.text' || typeof node.props.text !== 'string') throw new Error('Missing native derived catalogue text');
    if (node.props.text !== value) { differences.push(node.id + ':text'); node.props.text = value; }
  }
  const areas = nodes.filter(node => Object.hasOwn(node.props?.attributes || {}, 'data-catalogue-root'));
  if (areas.length !== 1) throw new Error('Exactly one native catalogue region is required');
  attribute(areas[0], 'data-catalogue-version', '1');
  for (const row of rows) {
    const { card } = row;
    attribute(card, 'data-catalogue-title', row.title);
    attribute(card, 'data-catalogue-availability', row.availability);
    attribute(card, 'data-catalogue-source-sha256', row.sourceSha256);
    const labels = [...components(card)].filter(node => Object.hasOwn(node.props?.attributes || {}, 'data-catalogue-availability-label'));
    if (labels.length !== 1) throw new Error('Each card requires one native availability label: ' + row.id);
    text(labels[0], row.label);
  }
  for (const node of nodes) {
    const a = node.props?.attributes || {};
    if (Object.hasOwn(a, 'data-catalogue-count')) text(node, String(rows.filter(row => a['data-catalogue-count'] === 'all' || row.availability === a['data-catalogue-count']).length));
    if (Object.hasOwn(a, 'data-catalogue-playable-total')) text(node, String(rows.filter(row => row.availability === 'playable').length));
    if (Object.hasOwn(a, 'data-catalogue-filter') && a['data-catalogue-filter'] === 'unavailable') attribute(node, 'hidden', !rows.some(row => row.availability === 'unavailable'));
  }
  if (checkOnly && differences.length) throw new Error('Stale catalogue projection. Review game changes, then run node scripts/sync-play-catalogue.mjs --write: ' + differences.join(', '));
  if (!checkOnly && differences.length) fs.writeFileSync(file, JSON.stringify(page, null, 2) + '\n');
  return { status: 'PASS', mode: checkOnly ? 'verify-only' : 'synchronize-selected-card-metadata', listedGames: rows.map(({ id, release, availability, sourceSha256 }) => ({ id, release, availability, sourceSha256 })), differences: differences.length, gamesModified: false, privateOrUnlistedGamesAdded: false };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length && !['--check', '--write'].includes(args[0]))) throw new Error('Usage: node scripts/sync-play-catalogue.mjs [--check | --write]');
  console.log(JSON.stringify(synchronize(project, !args.includes('--write')), null, 2));
}
