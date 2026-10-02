#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const repo = path.resolve(process.argv[2] || '.');
const projectRoot = path.join(repo, 'studio-project/toadal-feast-website');
const captureManifestPath = path.join(repo, 'docs/review/visual-asset-gameplay-convergence-20261001/capture-assets.json');
const expectedCaptureArchiveSha = 'fb614e1f5293b226d38b47265b88f3ae65d775158ab2c3d85f62ad739f427482';
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const writeJson = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const replaceExactly = (text, original, replacement, label) => {
  const count = text.split(original).length - 1;
  if (count === 0 && text.includes(replacement)) return text;
  if (count !== 1) throw new Error(label + ': expected exactly one source fragment, found ' + count);
  return text.replace(original, replacement);
};

const captures = readJson(captureManifestPath);
if (captures.schema !== 'toadal-feast.owner-qa-capture-assets.v1' || captures.sourceArchiveSha256 !== expectedCaptureArchiveSha) {
  throw new Error('Capture manifest is not bound to the expected owner QA archive.');
}
if (!Array.isArray(captures.assets) || captures.assets.length !== 5) throw new Error('Expected the five explicitly approved capture derivatives.');
for (const asset of captures.assets) {
  const diskPath = path.join(projectRoot, asset.source);
  if (!fs.existsSync(diskPath)) throw new Error('Capture derivative is missing: ' + asset.source);
  const bytes = fs.readFileSync(diskPath);
  if (bytes.length !== asset.bytes || sha256(bytes) !== asset.sha256) throw new Error('Capture derivative hash/size mismatch: ' + asset.source);
  if (asset.authoritySha256 !== asset.authoritySha256.toLowerCase() || !asset.authoritySource.includes('#')) {
    throw new Error('Capture archive member provenance is incomplete: ' + asset.id);
  }
}

const assetIndexPath = path.join(projectRoot, 'assets/index.json');
const assetIndex = readJson(assetIndexPath);
const currentAssets = new Map((assetIndex.assets || []).filter((item) => !item.id.startsWith('asset.app.capture.')).map((item) => [item.id, item]));
for (const asset of captures.assets) currentAssets.set(asset.id, asset);
assetIndex.assets = [...currentAssets.values()];
writeJson(assetIndexPath, assetIndex);

const authorityLockPath = path.join(repo, 'manifests/visual-asset-authority-lock.json');
const authorityLock = readJson(authorityLockPath);
const snapshot = new Map((authorityLock.registeredAssetSnapshot || []).filter((item) => !item.id.startsWith('asset.app.capture.')).map((item) => [item.id, item]));
for (const asset of captures.assets) snapshot.set(asset.id, {
  id: asset.id,
  source: asset.source,
  sha256: asset.sha256,
  bytes: asset.bytes,
  category: asset.category,
});
authorityLock.registeredAssetSnapshot = [...snapshot.values()];
authorityLock.sourceFiles.ownerCaptureManifest = 'docs/review/visual-asset-gameplay-convergence-20261001/capture-assets.json';
authorityLock.ownerSuppliedCaptureSource = {
  filename: captures.sourceArchive,
  sha256: captures.sourceArchiveSha256,
  approvalScope: 'local owner-preview only; not blanket public-marketing approval',
  note: 'Only selected raw QA captures/result proof listed in the capture ledger are represented. Source ZIP and diagnostic-footer captures are not shipped.',
};
writeJson(authorityLockPath, authorityLock);

const homePath = path.join(projectRoot, 'pages/home.json');
const home = readJson(homePath);
const homeComponent = home.components.find((item) => item.id === 'component.home.app');
if (!homeComponent) throw new Error('Home app conversion component is missing.');
const oldHomeArt = "<div class='app-art'><img src='assets/images/characters/companion/production-pack-v2/toadal-mobile-app.png' alt='Toadal holding a phone with TOADAL FEAST app artwork' width='1254' height='1254' loading='lazy' decoding='async'></div>";
const newHomeArt = "<figure class='app-art app-home-capture' data-app-capture-hero><div class='app-device-frame app-device-frame--home'><img src='assets/images/app/convergence-20261001/arcade-active-gameplay.webp' alt='Owner-supplied mobile Arcade active-play capture; the movement hint and QA tools badge remain visible.' width='440' height='820' loading='lazy' decoding='async'></div><figcaption class='app-capture-caption'>Arcade · active mobile play<br><span>Control hint and QA badge visible in source</span></figcaption></figure>";
homeComponent.props.html = replaceExactly(homeComponent.props.html, oldHomeArt, newHomeArt, 'Home app capture');
writeJson(homePath, home);

const appPath = path.join(projectRoot, 'pages/app.json');
const app = readJson(appPath);
const appComponent = app.components.find((item) => item.id === 'component.live-app.rich-text');
if (!appComponent) throw new Error('App hero component is missing.');
const oldAppArt = "<figure class='wo002-detail-art'><img src='/assets/images/characters/toadal-victory.png' alt='Toadal, the crowned golden-yellow hero wearing his red scarf.' width='611' height='640' decoding='async'><figcaption>Canonical Toadal character artwork.</figcaption></figure>";
const newAppArt = "<figure class='wo002-detail-art app-detail-capture' data-app-capture-hero><div class='app-device-frame app-device-frame--hero'><img src='/assets/images/app/convergence-20261001/arcade-active-gameplay.webp' alt='Owner-supplied mobile Arcade active gameplay; movement hint and QA tools badge remain visible.' width='440' height='820' decoding='async'></div><figcaption>Arcade · active mobile gameplay capture. The first-run control hint and QA tools badge are present in the supplied source.</figcaption></figure>";
appComponent.props.html = replaceExactly(appComponent.props.html, oldAppArt, newAppArt, 'App hero capture');
const factsMarker = "</section><section class='wo002-detail-facts'";
const captureGallery = "</section><section class='app-capture-gallery' aria-labelledby='app-capture-gallery-title' data-app-capture-gallery><div class='app-capture-gallery-heading'><p class='section-kicker'>OWNER-SUPPLIED QA CAPTURES</p><h2 id='app-capture-gallery-title'>A closer look at the mobile modes</h2><p>These images document mobile-app screens, not separate browser games. The source is QA evidence for this local owner-preview candidate; visible overlays and hints are retained and described.</p></div><div class='app-capture-grid'><figure class='app-capture-card'><div class='app-device-frame'><img src='/assets/images/app/convergence-20261001/menu-onboarding-overlay.webp' alt='TOADAL FEAST mobile app mode menu capture with UI panels and QA tools badge visible.' width='440' height='820' loading='lazy' decoding='async'></div><figcaption><strong>App home · mode menu</strong><span>Mode grid; QA tools badge visible.</span></figcaption></figure><figure class='app-capture-card'><div class='app-device-frame'><img src='/assets/images/app/convergence-20261001/puzzle-entry.webp' alt='Mobile Puzzle level-selection screen from an owner-supplied app capture.' width='440' height='820' loading='lazy' decoding='async'></div><figcaption><strong>Puzzle · level selection</strong><span>A mobile mode screen, not website gameplay.</span></figcaption></figure><figure class='app-capture-card'><div class='app-device-frame'><img src='/assets/images/app/convergence-20261001/puzzle-result-proof.webp' alt='Mobile Puzzle level-clear result proof with three stars, route recap, and reward summary.' width='780' height='1688' loading='lazy' decoding='async'></div><figcaption><strong>Puzzle · completed-level proof</strong><span>Owner-supplied result screen; shown as proof, not a playable web demo.</span></figcaption></figure><figure class='app-capture-card'><div class='app-device-frame'><img src='/assets/images/app/convergence-20261001/feastfall-entry-onboarding-overlay.webp' alt='Mobile Feastfall screen with the onboarding prompt “Meet Froggy and learn the table” visible.' width='440' height='820' loading='lazy' decoding='async'></div><figcaption><strong>Feastfall · entry screen</strong><span>Onboarding prompt and QA tools badge visible.</span></figcaption></figure></div></section><section class='wo002-detail-facts'";
if (!appComponent.props.html.includes("data-app-capture-gallery")) {
  const count = appComponent.props.html.split(factsMarker).length - 1;
  if (count !== 1) throw new Error('App facts insertion point must occur exactly once.');
  appComponent.props.html = appComponent.props.html.replace(factsMarker, captureGallery);
}
writeJson(appPath, app);

const wickedPath = path.join(projectRoot, 'pages/game-wicked-bites.json');
const wicked = readJson(wickedPath);
const wickedComponent = wicked.components.find((item) => item.props?.html);
if (!wickedComponent) throw new Error('Wicked Bites detail component is missing.');
const oldWickedArt = '<figure class="wo002-detail-art"><img src="/assets/images/world/candy-kingdom.webp" alt="Candy Kingdom world artwork, not an in-game screenshot." decoding="async"><figcaption>World/character artwork — not a gameplay screenshot.</figcaption></figure>';
const newWickedArt = '<figure class="wo002-detail-art wicked-gameplay-capture" data-gameplay-capture><img src="/assets/images/games/wicked-bites-v5.5-preview.webp" alt="Real Wicked Bites version 5.5 browser-preview gameplay capture." width="844" height="390" decoding="async"><figcaption>Qualified Wicked Bites v5.5 gameplay capture. This is the isolated staging preview, not a public release.</figcaption></figure>';
wickedComponent.props.html = replaceExactly(wickedComponent.props.html, oldWickedArt, newWickedArt, 'Wicked Bites gameplay capture');
writeJson(wickedPath, wicked);

console.log(JSON.stringify({
  status: 'PASS',
  registeredCaptures: captures.assets.map((asset) => asset.id),
  homeArcadeLead: 'mobile Arcade gameplay capture, truthfully labeled',
  appSupportingCaptures: ['mode menu', 'Puzzle level selection', 'Puzzle result proof', 'Feastfall entry with onboarding prompt'],
  wickedBites: 'existing qualified gameplay asset now used on detail page',
  storeLinks: 'existing disabled/unconfigured state preserved',
}, null, 2));
