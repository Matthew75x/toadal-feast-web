#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const repo = path.resolve(process.argv[2] || '.');
const read = (rel) => fs.readFileSync(path.join(repo, rel), 'utf8');
const json = (rel) => JSON.parse(read(rel));

const compatibility = json('docs/implementation/CP9_PLAYER_COMPATIBILITY_MAP.json');
const ledger = json('docs/implementation/WEB_GAME_EVIDENCE_LEDGER_2026-09-30.json');
const states = json('docs/implementation/PUBLIC_FEATURE_STATE.json');
const contract = read('docs/implementation/BROWSER_GAME_CARTRIDGE_CONTRACT.md');
const wo = read('docs/work-orders/WO-002-play-games-player.md');
const wicked = json('studio-project/toadal-feast-website/games/wicked-bites.json');
const claw = json('studio-project/toadal-feast-website/games/claw-feed-gulper.json');

const checks = [];
const check = (id, ok, detail) => checks.push({ id, ok: Boolean(ok), detail });

check('status-hold', wo.includes('**Status:** HOLD until WO-001 PASS'), 'WO-002 remains explicitly blocked until WO-001 acceptance.');
check('compat-schema', compatibility.schema === 'toadal-feast.web.cp9-player-compatibility.v1', 'Compatibility map schema is exact.');
check('current-contract', compatibility.currentContract?.wireLabel === 'toadal.game.v1' && compatibility.currentContract?.name === 'toadal.game' && compatibility.currentContract?.version === 1, 'Current player contract is toadal.game.v1.');
check('legacy-contract', compatibility.legacyContract?.contract === 'toadal-web-player-v2', 'Recovered CP9 player contract is identified exactly.');

const expectedInbound = new Map([
  ['game.ready', 'game:ready'],
  ['game.gameplayStart', 'game:started'],
  ['game.complete', 'game:complete'],
  ['game.exit', 'game:request-exit'],
  ['game.error', 'game:error'],
  ['game.requestFullscreen', 'game:request-fullscreen'],
  ['game.saveStatus', null],
]);
const inbound = new Map((compatibility.legacyGameToHost || []).map(x => [x.legacy, x.current ?? null]));
check('legacy-inbound-map', [...expectedInbound].every(([k,v]) => inbound.has(k) && inbound.get(k) === v), 'All CP9 game-to-host messages have an explicit normalization decision.');

const expectedOutbound = new Map([
  ['host:pause', 'host.pause'],
  ['host:resume', 'host.resume'],
  ['host:mute', 'host.mute'],
  ['host:unmute', 'host.unmute'],
  ['host:init', null],
  ['host:visibility', null],
  ['host:exit-confirmed', null],
]);
const outbound = new Map((compatibility.currentHostToLegacy || []).map(x => [x.current, x.legacy ?? null]));
check('legacy-outbound-map', [...expectedOutbound].every(([k,v]) => outbound.has(k) && outbound.get(k) === v), 'All current host-to-legacy CP9 messages have an explicit compatibility decision.');

check('security-boundary', (compatibility.security || []).length >= 6 && compatibility.security.some(x => /origin/i.test(x)) && compatibility.security.some(x => /source/i.test(x)) && compatibility.security.some(x => /allowlist/i.test(x)), 'Compatibility plan retains strict origin/source/type security.');

const candidates = new Map((compatibility.qualifiedStagingCandidates || []).map(x => [x.id, x]));
check('wicked-candidate', candidates.get('wicked-bites')?.version === '5.5' && candidates.get('wicked-bites')?.sourceCommit === '6fff3c89605092ba5c5e122565cb98415c8ab5e5' && candidates.get('wicked-bites')?.entrySha256 === 'a6d0772c608ff50e042f319dcb5cabe612cafeb656a2a19f922cc5f4068b50b5', 'Wicked Bites candidate authority is sealed.');
check('claw-candidate', candidates.get('claw-feed-gulper')?.version === '2.5.1' && candidates.get('claw-feed-gulper')?.sourceCommit === '7c49d1bf70ebf6503fde3b533a1acd356d12c77c' && candidates.get('claw-feed-gulper')?.entrySha256 === '77815f0652a9a0899ec426534f339d9c26fde9cf71c215c553f305a132d69701', 'CLAW candidate authority is sealed.');

check('cp9-archive-authority', ledger.cp9ArchiveSha256 === 'ebbd2b7631268e39522a2f63eb7377ce2cd6571b86cb88947c597b0b1376e7a4', 'CP9 archive hash matches recovered authority.');
const evidence = new Map((ledger.games || []).map(x => [x.id, x]));
check('evidence-ledger', evidence.get('wicked-bites')?.state === 'QUALIFIED_STAGING_PREVIEW_AVAILABLE' && evidence.get('claw-feed-gulper')?.state === 'QUALIFIED_STAGING_PREVIEW_AVAILABLE', 'Evidence ledger records both qualified staging candidates.');

check('public-state-still-gated', states.features?.wickedBites === 'PREVIEW_UNTIL_REAL_WEB_BUILD' && states.features?.clawFeedGulper === 'PREVIEW_UNTIL_REAL_WEB_BUILD', 'Public feature state is still gated pending current player integration.');
check('home-records-still-withheld', wicked.web?.enabled === false && !wicked.web?.launchUrl && claw.web?.enabled === false && !claw.web?.launchUrl, 'Home game records still expose no launch route before WO-002.');

const currentEvents = ['game:ready','game:started','game:paused','game:resumed','game:score','game:complete','game:error','game:request-exit','game:request-fullscreen','host:init','host:pause','host:resume','host:mute','host:unmute','host:exit-confirmed','host:visibility'];
check('current-contract-vocabulary', contract.includes('Version: `toadal.game.v1`') && currentEvents.every(event => contract.includes('`' + event + '`')), 'Current cartridge contract still contains its full message vocabulary.');

check('no-premature-public-exposure', compatibility.publicExposureRule?.includes('Do not mark') && wicked.status !== 'PUBLIC' && claw.status !== 'PUBLIC', 'Planning evidence does not silently promote a cartridge to PUBLIC.');

const fail = checks.filter(x => !x.ok);
console.log(JSON.stringify({ schema: 'toadal-feast.wo002-readiness.v1', repo, summary: { total: checks.length, pass: checks.length - fail.length, fail: fail.length }, checks }, null, 2));
if (fail.length) process.exitCode = 1;
