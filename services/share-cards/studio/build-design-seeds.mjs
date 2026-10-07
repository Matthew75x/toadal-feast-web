/*
 * Developer-only design handoff generator. It does not run in the share service.
 * Pass the exact accepted native HUD source; no source/runtime is vendored here.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { stripTypeScriptTypes } from 'node:module';

const studioRoot = path.dirname(fileURLToPath(import.meta.url));
const serviceRoot = path.resolve(studioRoot, '..');
const sourcePath = process.argv[2] && path.resolve(process.argv[2]);
if (!sourcePath) throw new Error('Usage: node studio/build-design-seeds.mjs <accepted packages/hud-authoring/src/index.ts>');
const authority = {
  repository: 'Matthew75x/toadal-studio',
  commit: 'ffebf68559c0866e8e68b3de1470fa89ee654013',
  path: 'packages/hud-authoring/src/index.ts',
  gitBlobSha: 'f4f4a146b3a043dd858860e63b5d54aab2e89d90'
};
const sourceBytes = await fs.readFile(sourcePath);
const gitBlob = crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob ' + sourceBytes.length + '\0'), sourceBytes
])).digest('hex');
assert.equal(gitBlob, authority.gitBlobSha, 'Native source must exactly match the accepted Git blob.');
const sourceSha256 = crypto.createHash('sha256').update(sourceBytes).digest('hex');
const compiledPath = path.join(path.dirname(sourcePath), 'native-hud-validation.mjs');
if (path.dirname(compiledPath) === studioRoot) throw new Error('Compile the validator in a separate temporary workspace.');
const compiledSource = stripTypeScriptTypes(sourceBytes.toString('utf8'), { mode: 'strip', sourceUrl: sourcePath });
await fs.writeFile(compiledPath, compiledSource);
const native = await import(pathToFileURL(compiledPath).href + '?source=' + sourceSha256);
assert.equal(native.HUD_SCHEMA, 'toadal-hud-authoring');
assert.equal(native.HUD_SCHEMA_VERSION, 2);
const assets = {};
for (const [key, name] of [['header', 'toadal-feast-header.png'], ['toad', 'toadal-victory.png'], ['frame', 'astro-score-frame.png']]) {
  const bytes = await fs.readFile(path.join(serviceRoot, 'assets', name));
  assets[key] = { name, sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
    data: 'data:image/png;base64,' + bytes.toString('base64') };
}
const animation = { name: 'none', duration: 1, delay: 0, iterationCount: 1, easing: 'linear', fillMode: 'none', playState: 'paused' };
const base = {
  opacity: 1, rotation: 0, visible: true, locked: false, runtimeEnabled: true,
  label: '', value: '', title: '', subtitle: '', icon: '', fill: 'transparent',
  stroke: 'transparent', strokeWidth: 0, radius: 0, glow: false, font: 'rounded',
  effect: 'clean', frameStyle: 'minimal', animation,
  moduleGroup: 'share-card-seed', responsiveAnchor: 'top-left',
  meta: { disposition: 'design-seed-only', automaticServerSync: false }
};
function element(type, id, fields) { return { ...base, type, id, name: id, exportId: id.replaceAll('-', '_'), ...fields }; }
function text(id, value, x, y, width, height, fontSize, color, bindingKey) {
  return element('text', id, { value, x, y, width, height, fontSize, textColor: color,
    dataRole: bindingKey === 'share.score' ? 'number' : 'text', bindingKey,
    meta: { ...base.meta, editableCopy: true, fontDifference: 'Native rounded font; production text uses bundled Lilita One.' }
  });
}
function panel(id, x, y, width, height, fill, stroke, radius = 0, strokeWidth = 0) {
  return element('panel', id, { x, y, width, height, fill, stroke, radius, strokeWidth,
    locked: true, runtimeEnabled: false, dataRole: 'decorative' });
}
function image(id, asset, x, y, width, height, alt) {
  return element('image', id, { x, y, width, height, imageSrc: asset.data, imageAlt: alt,
    imageFit: 'contain', locked: true, runtimeEnabled: false, dataRole: 'decorative',
    meta: { ...base.meta, asset: asset.name, assetSha256: asset.sha256 }
  });
}
function stars(accent) {
  return [[45,95,10],[666,168,13],[1125,73,12],[1090,520,12],[650,530,9],[928,70,7]].map(([x,y,size], i) =>
    element('icon', 'star-' + i, { x: x-size, y: y-size, width: size*2+16, height: size*2+16,
      icon: '✦', textColor: accent, fontSize: size*2, locked: true, runtimeEnabled: false, dataRole: 'decorative' }));
}
function document(theme, kind, elements) {
  return {
    schema: 'toadal-hud-authoring', schemaVersion: 2,
    id: 'hud.share.' + theme + '.' + kind + '.design-seed.v1',
    name: 'DESIGN SEED · ' + (theme === 'astro' ? 'Astro personal score' : 'Feast invitation'),
    updatedAt: '2026-10-06T00:00:00.000Z',
    canvas: { width: 1200, height: 630, background: theme === 'astro' ? '#070d22' : '#1a0d25',
      safeArea: true, gridSize: 8, snap: true, smartGuides: true },
    activeKit: 'universal', elements, motionMode: 'reduced', exportQuality: 1,
    notes: 'Editable design handoff seed, not an accepted visual source or live template. ' +
      'Uses actual PNG artwork and native rounded text. Font sizing, padding, gradients and text alignment can differ from fixed production renderer template version 1. ' +
      'Every animation is none. Score 1,240 is a layout placeholder, not a real game result. ' +
      'Binding keys are design intent only; the share service never loads this JSON. Designer edits need a reviewed fixed server template revision before publication.'
  };
}
const feastAccent = '#ffdc78';
const feast = document('feast', 'invite', [
  panel('background', 0, 0, 1200, 630, '#291330', 'transparent'),
  panel('inner-rim', 18, 18, 1164, 594, 'transparent', '#b68c54', 32, 2),
  ...stars(feastAccent),
  image('toadal-lettering-header', assets.header, 54, 39, 606, 126, 'TOADAL FEAST branded lettering'),
  text('invite-heading-line-1', 'You’re invited', 62, 173, 620, 83, 60, '#fff6d9', 'share.invite.headingLine1'),
  text('invite-heading-line-2', 'to the Feast!', 62, 253, 620, 85, 66, '#fff6d9', 'share.invite.headingLine2'),
  text('invite-message', 'Good games. Great company.', 65, 347, 640, 48, 30, feastAccent, 'share.invite.message'),
  text('invite-supporting-copy', 'Bring your appetite for adventure.', 65, 393, 640, 45, 23, '#d3cadf', 'share.invite.supportingCopy'),
  panel('cta-chip', 72, 502, 310, 62, feastAccent, 'transparent', 31),
  text('cta-copy', 'COME PLAY', 104, 508, 246, 50, 26, '#20122c', 'share.cta.label'),
  text('invite-status', 'AN INVITATION TO PLAY', 64, 571, 620, 45, 17, '#c8bbd4', 'share.status'),
  image('toadal-victory-character', assets.toad, 688, 112, 476, 490, 'Canonical TOADAL character celebrating')
]);
const astroAccent = '#83edff';
const astro = document('astro', 'score', [
  panel('background', 0, 0, 1200, 630, '#0e1933', 'transparent'),
  panel('inner-rim', 18, 18, 1164, 594, 'transparent', '#83edff', 32, 2),
  ...stars(astroAccent),
  image('toadal-lettering-header', assets.header, 54, 39, 606, 126, 'TOADAL FEAST branded lettering'),
  text('game-name', 'Wicked Bites', 62, 165, 630, 66, 45, '#fff6d9', 'share.gameName'),
  image('astro-score-frame', assets.frame, 42, 233, 640, 218, 'Astro Arcade score frame'),
  text('personal-score', '1,240', 149, 275, 444, 105, 80, '#fff6d9', 'share.score'),
  text('score-units', 'PERSONAL SCORE · POINTS', 138, 370, 440, 40, 24, astroAccent, 'share.scoreLabel'),
  text('score-message', 'A little friendly competition?', 64, 443, 640, 46, 22, '#d3cadf', 'share.message'),
  panel('cta-chip', 72, 502, 310, 62, astroAccent, 'transparent', 31),
  text('cta-copy', 'PLAY WICKED BITES', 98, 508, 258, 50, 26, '#20122c', 'share.cta.label'),
  text('score-status', 'PERSONAL RESULT · NO VERIFIED RANK', 64, 571, 650, 45, 17, '#c8bbd4', 'share.status'),
  image('toadal-victory-character', assets.toad, 688, 112, 476, 490, 'Canonical TOADAL character celebrating')
]);
const result = [];
for (const [name, input] of [['feast-invite.hud.json', feast], ['astro-personal-score.hud.json', astro]]) {
  const normalized = native.normalizeHudDocument(input);
  const validation = native.validateHudDocument(normalized);
  assert.equal(validation.valid, true, JSON.stringify(validation.errors));
  assert.deepEqual(validation.warnings, [], 'Native schema warnings');
  assert.equal(normalized.canvas.width, 1200);
  assert.equal(normalized.canvas.height, 630);
  assert.equal(normalized.motionMode, 'reduced');
  assert(normalized.elements.every(item => item.animation.name === 'none'), 'No animation in stationary share-card seed');
  assert(normalized.elements.filter(item => item.type === 'image').every(item => item.imageSrc.startsWith('data:image/png;base64,')));
  if (name.startsWith('astro')) assert(normalized.elements.some(item => item.bindingKey === 'share.score' && !item.locked));
  const body = JSON.stringify(normalized, null, 2) + '\n';
  await fs.writeFile(path.join(studioRoot, name), body);
  result.push({ file: name, valid: true, errors: [], warnings: [], elements: normalized.elements.length,
    editableTextLayers: normalized.elements.filter(item => item.type === 'text' && !item.locked).length,
    schema: normalized.schema, schemaVersion: normalized.schemaVersion,
    sha256: crypto.createHash('sha256').update(body).digest('hex') });
}
const receipt = {
  disposition: 'DESIGN_HANDOFF_SEEDS_ONLY', productionTemplateVersion: '1', serverConsumesSeeds: false,
  validationAuthority: { ...authority, sha256: sourceSha256, sourceBytes: sourceBytes.length,
    compiler: 'Node module.stripTypeScriptTypes (syntax stripping, not a new native package qualification)', node: process.version },
  embeddedAssets: Object.fromEntries(Object.entries(assets).map(([key, asset]) => [key, { file: asset.name, sha256: asset.sha256 }])),
  canvas: { width: 1200, height: 630 }, animation: 'none', motionMode: 'reduced',
  results: result, limitations: [
    'Passed native normalizeHudDocument and validateHudDocument, not native Designer browser import/export or owner visual acceptance.',
    'Native rounded text is editable but does not reproduce the production Lilita One renderer or all production gradients/padding/alignment.',
    'Header image preserves the actual file20 lettering treatment as a static asset; changing its text requires a new approved lettering raster.',
    'No automatic synchronization, cartridge admission, progression, telemetry, runtime template upload or public publication.'
  ]
};
await fs.writeFile(path.join(studioRoot, 'validation-receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify(receipt, null, 2));
