'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const json = rel => JSON.parse(read(rel));

const bridge = json('docs/implementation/game-feast-pass-bridge.schema.json');
const progression = json('docs/implementation/progression-state.schema.json');
const guest = read('dist/assets/js/guest-progression.js');
const definitions = read('dist/assets/js/progression-definitions.js');
const contract = read('docs/implementation/GAME_FEAST_PASS_BRIDGE_CONTRACT.md');

assert.equal(bridge.properties.schemaVersion.const, 1);
assert.equal(bridge.properties.source.const, 'toadal-feast-game');
assert.equal(bridge.properties.authority.const, 'local-game-projection');
assert.equal(bridge.properties.syncStatus.const, 'not-synced');
assert.deepEqual(
  bridge.properties.accomplishments.items.properties.kind.enum,
  ['feat-earned','title-earned']
);

const bridgeBytes = JSON.stringify(bridge);
for (const forbidden of ['"xp"','"sparks"','"treats"','"coins"','"candy"','"reward"']) {
  assert.equal(bridgeBytes.includes(forbidden), false,
    'game projection schema must not prescribe Feast Pass economy field ' + forbidden);
}

const profileProps = progression.properties.profile.properties;
assert.ok(profileProps.selectedBadge, 'existing selectedBadge field must remain');
assert.ok(profileProps.selectedTitle, 'selectedTitle must have its own profile field');
assert.deepEqual(profileProps.selectedTitle.type, ['string','null']);
assert.match(guest, /selectedBadge:\s*null,\s*selectedTitle:\s*null/,
  'guest profile defaults must keep Badge and Title separate');

assert.match(definitions, /starter-config-editable-not-canonical/,
  'website reward configuration must remain explicitly non-canonical');
assert.equal(guest.includes('game:feat:'), false,
  'guest runtime must not silently ingest game accomplishments yet');
assert.equal(guest.includes('game:title:'), false,
  'guest runtime must not silently ingest game Titles yet');

assert.match(contract, /does\s+(?:\*\*)?not(?:\*\*)?\s+read the game save/i);
assert.match(contract, /must not turn a bridge accomplishment directly into/i);
assert.match(contract, /currencies:\s*\*\*outside this bridge\*\*/i);
assert.match(contract, /must not say game progress is currently synchronized/i);

console.log('Website game→FEAST PASS bridge contract: PASS');
console.log(JSON.stringify({
  schemaVersion:bridge.properties.schemaVersion.const,
  syncStatus:bridge.properties.syncStatus.const,
  selectedTitleReserved:true,
  guestIngestion:false,
  rewardAuthority:false,
}, null, 2));
