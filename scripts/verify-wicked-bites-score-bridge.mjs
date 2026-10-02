#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '.');
const bridgePath = path.join(root, 'studio-project', 'toadal-feast-website', 'reference', 'public', 'games', 'wicked-bites', 'toadal-bridge.js');
const advancedPath = path.join(root, 'studio-project', 'toadal-feast-website', 'collections', 'advanced-code.json');

const bridge = fs.readFileSync(bridgePath, 'utf8');
const advanced = JSON.parse(fs.readFileSync(advancedPath, 'utf8')).javascript || '';
const failures = [];
const need = (source, regex, message) => { if (!regex.test(source)) failures.push(message); };

need(bridge, /const\s+PROTOCOL\s*=\s*['"]toadal\.game\.v1['"]/, 'Wicked bridge must use toadal.game.v1.');
need(bridge, /send\(['"]game:score['"]\s*,\s*\{\s*score\s*\}/, 'Wicked bridge must emit game:score from its score reader.');
need(bridge, /send\(['"]game:complete['"]\s*,\s*\{\s*score:\s*readScore\(\)\s*\}/, 'Wicked bridge must emit game:complete with the final score.');
need(bridge, /function\s+readScore\(\)/, 'Wicked bridge must retain an explicit score reader.');
need(bridge, /new\s+URL\(document\.referrer\)\.origin/, 'Wicked bridge must derive/validate the parent origin.');
need(bridge, /event\.origin\s*!==\s*parentOrigin/, 'Wicked bridge must reject messages from another origin.');
need(bridge, /event\.source\s*!==\s*parent/, 'Wicked bridge must reject messages from a different source window.');
if (/localStorage|sessionStorage|SaveManager|indexedDB/i.test(bridge)) {
  failures.push('Wicked compatibility bridge must not own or scrape persistent game/website storage.');
}

need(advanced, /['"]game:score['"]/, 'Website player host must accept game:score.');
need(advanced, /['"]game:complete['"]/, 'Website player host must accept game:complete.');
need(advanced, /event\.source\s*!==\s*frame\.contentWindow/, 'Website player host must validate iframe source.');
need(advanced, /message\.protocol\s*!==\s*protocol/, 'Website player host must validate protocol.');
need(advanced, /message\.gameId\s*!==\s*gameId/, 'Website player host must validate gameId.');

if (failures.length) {
  console.error('WICKED BITES SCORE BRIDGE CHECK: FAIL');
  failures.forEach((failure) => console.error('- ' + failure));
  process.exit(1);
}

console.log('WICKED BITES SCORE BRIDGE CHECK: PASS');
console.log('Existing compatibility bridge emits score/completion and remains storage-isolated.');
