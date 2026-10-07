import fs from 'node:fs';
import path from 'node:path';
import { controlConsistencyErrors, donorIdentity, DONOR_SOURCES } from './lib/manifest-compliance-contract.mjs';

const root = process.cwd();
const ledgerPath = path.join(root, 'manifests', 'manifest-compliance-ledger.json');
const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
const pageIndex = JSON.parse(fs.readFileSync(path.join(root, 'studio-project', 'toadal-feast-website', 'pages', 'index.json'), 'utf8'));
const routeRecordCount = Array.isArray(pageIndex.pages) ? pageIndex.pages.length : 0;
const consistencyErrors = controlConsistencyErrors(ledger, root);
if (consistencyErrors.length) throw new Error(consistencyErrors.join('\n'));
const visualDonor = donorIdentity(ledger, DONOR_SOURCES.visual);
const assetDonor = donorIdentity(ledger, DONOR_SOURCES.assets);
const operational = ledger.operationalAuthority;

// Keep the local-only Home parity donor recoverable without making it authority.
if (ledger.donorEvidence?.strictHomeParityWip) {
  Object.assign(ledger.donorEvidence.strictHomeParityWip, {
    preservedPatch: 'docs/authority/donors/home-lock-visual-parity-20261001.patch',
    preservedPatchSha256: 'c215c613b6d67a40bde9ccc5b23cb84302e2cab6c03cb122eed42c47f5739d5d',
    visualProof: 'docs/review/manifest-recalibration/home-lock-wip-donor-1440x900.webp',
    visualProofSha256: '31b00079fd7b97f91294c2c3957543ec334f17717e36f70e44e76497be8f0ca6'
  });
}
fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2) + '\n');

const counts = {};
for (const p of ledger.pages) counts[p.status] = (counts[p.status] || 0) + 1;

const md = [];
md.push('# TOADAL FEAST Website - Manifest Compliance Ledger', '');
md.push('**Historical qualification date:** ' + ledger.date);
md.push(`**Operational staging authority:** \`${operational.repository}\` / \`${operational.ref}\`. Resolve this live ref before consequential operations; a dated SHA below does not authorize promotion.`);
md.push(`**Dated staging readback (${operational.latestReadback.observedDate}):** \`${operational.latestReadback.sha}\`; observation only, not a fixed current head.`);
md.push(`**Historical public staging (${ledger.authority.observedDate}):** \`${ledger.authority.liveStaging}\``);
md.push(`**Historical qualified review candidate (${ledger.authority.observedDate}):** \`${ledger.authority.currentReviewCandidate}\``);
md.push('**Controlling denominator:** the original 30-page manifest plus locked cross-cutting product requirements.', '');
md.push('## Why this exists', '');
md.push('This ledger replaces work-order completion as the project-level progress measure. A green verifier, a clean branch, or a closed work order does **not** mean the website manifest is complete.', '');
md.push('Future work must map to this ledger. If a task does not advance a row below, a cross-cutting requirement, or a real release blocker, it is not project-priority work.', '');
md.push('## Original vision - recovered and still authoritative', '');
md.push('- Enter the **TOADAL FEAST world**: colorful food kingdoms, adventure, characters, exploration and feasting.');
md.push('- Web is broader than a port of the mobile game: free browser experiences + world/story/media discovery + lightweight progression + app conversion.');
md.push('- Visitor journey: **play free -> discover world/cast/story -> consume media/lore/news -> earn guest Feast Pass progress -> optionally create account later -> convert to full mobile app**.');
md.push('- TOADAL FEAST is visitor-facing first; TOADAL GAMES is subordinate except studio/business/legal contexts.');
md.push('- Toadal is a **reactive site companion**, using semantic context and actual pose/art changes across pointer, keyboard focus and touch.');
md.push('- Guest progression starts without an account and is stored durably in-browser; account/sync expands it later.');
md.push('- Unavailable account/community/store/future destinations should be visible only through truthful polished states, never fake-live.');
md.push('- The 30 page families remain requirements. Work orders are implementation slices, not replacements for the roadmap.', '');
md.push('## Qualification and owner acceptance', '');
md.push('**Historical phase (' + ledger.latestManifestV1Closure.observedDate + '):** ' + ledger.latestManifestV1Closure.phase + '. Source/artifact qualification and owner visual acceptance are separate. Home remains PARTIAL because LOCK_VISUAL acceptance is owner-pending; this control repair does not redesign it or claim acceptance.', '');
md.push(`Historical source-bound closure: [${ledger.latestManifestV1Closure.deploymentVerified ? 'deployment' : 'qualification'} record](${path.posix.relative('docs/authority', ledger.latestManifestV1Closure.report)}); qualification: \`${ledger.latestManifestV1Closure.qualificationReport}\`. These records bind the historical qualified SHA/tree, not later branch heads.`, '');
md.push(`The approved Home remains \`${ledger.visualEvidence?.home?.path || 'docs/review/WO-002/evidence/approved-home-visual-authority.png'}\` (SHA-256 \`${ledger.authority.approvedHomeSha256}\`).`, '');
md.push('## 30-page compliance', '');
md.push('| # | Manifest page | Visual authority | Delivery | Status | Evidence / remaining gap |');
md.push('|---:|---|---|---|---|---|');
for (const p of ledger.pages) md.push(`| ${p.n} | ${p.page} | ${p.visualAuthority} | ${p.delivery} | **${p.status}** | ${p.evidence} **Gap:** ${p.remainingGap} |`);
md.push('', '### Page-family status count', '');
for (const k of Object.keys(counts).sort()) md.push(`- **${k}: ${counts[k]}**`);
md.push('', `Route presence is not the same as page completion. This candidate currently contains ${routeRecordCount} static route records; several map to the same manifest family and many remain truthful previews.`, '');
md.push('## Cross-cutting product contract', '');
md.push('| Requirement | Status | Evidence / gap |');
md.push('|---|---|---|');
for (const x of ledger.crossCutting || []) md.push(`| ${x.requirement} | **${x.status}** | ${x.evidence} |`);
md.push('', '## Visual evidence levels', '');
md.push(`- Home: **${ledger.visualEvidence.home.status}** - \`${ledger.visualEvidence.home.path}\`.`);
for (const x of ledger.visualEvidence.batch1 || []) md.push(`- Page ${x.n} ${x.page}: \`${x.path}\` - ${x.approval}.`);
md.push(`- Pages 11-30 also appear in \`${ledger.visualEvidence.mixedReference.desktop30}\`, but that contact sheet is reference material and does not give every page the same approval level as Home/Batch 1.`, '');
md.push('## Authority firewall', '', '### Active authority', '');
for (const x of ledger.sourceMap.active_authority || []) md.push(`- **${x.source}** - ${x.rule}`);
md.push('', '### Dated implementation observations and donors', '');
for (const x of ledger.sourceMap.implementation_evidence || []) md.push(`- **${x.source}** \`${x.sha}\` (${x.observedDate}; ${x.classification}) - ${x.role}`);
md.push('', '### Historical / donor-only material', '');
for (const x of ledger.sourceMap.historical_or_donor_only || []) md.push(`- **${x.path}** - ${x.reason}`);
md.push('', 'This firewall matters because the local project folders contain older redesign documents that conflict with the later authority. Physical proximity or newer file timestamps do not make those documents current authority.', '');
md.push('## Donor/reuse findings', '');
for (const [key, x] of Object.entries(ledger.donorEvidence || {})) md.push(`- **${key}: ${x.status}** - ${x.finding || ''}${x.preservedPatch ? ` Preserved patch: \`${x.preservedPatch}\`.` : ''}`);
md.push('', 'The correct progression strategy is **behavior salvage + current-schema rebuild**, not greenfield reinvention and not direct import of obsolete storage/economy/branding.', '');
md.push('## External-source check', '');
md.push('- **Figma:** connected Approved Home Target is available, but MCP inspection is currently rate-limited. The exact approved Home is preserved in-repo, so the target is not lost.');
md.push('- **Netlify:** cartridge previews and the older V13 site preview are donor/preview evidence only. GitHub Pages is current website staging authority.');
md.push('- **ASSIGNATOR project folders:** active, preservation and historical worktrees were enumerated; donor classification is recorded in the Project Source Map.', '');
md.push('## Operating rules from this point forward', '');
(ledger.operatingRules || []).forEach((r, i) => md.push(`${i + 1}. ${r}`));
md.push('', '## Manifest-first execution order', '');
for (const x of ledger.executionPriorities || []) md.push(`${x.rank}. **${x.lane}** (manifest rows ${x.manifestRows.join(', ')}) - ${x.impact} **Remaining gate:** ${x.doneWhen}`);
md.push('', 'Arcade remains a separate HOLD/evidence lane and is **not** allowed to consume the website roadmap unless a manifest-level browser-game integration task specifically requires it.', '');

fs.writeFileSync(path.join(root, 'docs', 'authority', 'MANIFEST_COMPLIANCE_LEDGER_2026-10-01.md'), md.join('\n'));

const sm = [];
sm.push('# TOADAL FEAST Website - Project Source Map / Authority Firewall', '', '**Historical inventory date:** 2026-10-01; current navigation regenerated from the machine ledger.', '');
sm.push('## Purpose', '', 'ASSIGNATOR contains many historical TOADAL website worktrees and redesign packages. This document prevents a historical donor from silently becoming current product authority.', '');
sm.push('## Operational staging authority', '');
sm.push(`- Repository/ref: \`${operational.repository}\` / \`${operational.ref}\`. Resolve the live ref before consequential operations; candidate qualification is not deployment admission.`);
sm.push(`- Dated readback (${operational.latestReadback.observedDate}): \`${operational.latestReadback.sha}\`; this is an observation, not a permanently current SHA.`, '');
sm.push('## Historical project-folder inventory (2026-10-01 / qualification 2026-10-02)', '');
sm.push(`- \`C:/ReleaseOps/toadal-feast-web-live-staging\` - historical public staging lineage; recorded staging SHA (${ledger.authority.observedDate}) \`${ledger.authority.liveStaging}\`.`);
sm.push(`- \`C:/ReleaseOps/toadal-feast-web-stories-stack-20261001\` - historical qualified review candidate \`${ledger.authority.currentReviewCandidate}\` on \`${ledger.authority.currentReviewBranch}\`.`);
sm.push('- `C:/ReleaseOps/toadal-feast-web-gated-ecosystem-20261001` - parallel gated-ecosystem candidate for manifest rows 19, 21, 22, 26, 27, 28, 29; not deployed.');
sm.push(`- \`C:/ReleaseOps/toadal-feast-web-visual-combined-20261001\` - older visual-only convergence candidate \`${visualDonor.sha}\`; historical implementation donor, not operational authority.`);
sm.push('- `C:/ReleaseOps/toadal-feast-web-manifest-recalibration-20261001` - manifest-control baseline worktree.');
sm.push(`- \`C:/ReleaseOps/toadal-feast-web-master-asset-integration-20261001\` - recovered Master V2 companion/asset authority \`${assetDonor.sha}\`; historical asset provenance donor, not operational authority.`);
sm.push('- `C:/ReleaseOps/toadal-feast-web-discovery-visual-20261001` - World/Stories/Media candidate.');
sm.push('- `C:/ReleaseOps/toadal-feast-web-home-header-convergence-review-20261001` - reviewed Home/header candidate.');
sm.push('- `C:/ReleaseOps/toadal-feast-web-production-asset-archive-20261001` - complete production-ready asset-pack preservation.', '');
sm.push('## Local donor that must not be lost', '');
sm.push('- `C:/ReleaseOps/toadal-feast-web-home-lock-visual-20261001` - unpushed Home LOCK_VISUAL WIP donor. Its exact CSS diff is preserved as `docs/authority/donors/home-lock-visual-parity-20261001.patch` (SHA-256 `c215c613b6d67a40bde9ccc5b23cb84302e2cab6c03cb122eed42c47f5739d5d`).');
sm.push('- Visual proof: `docs/review/manifest-recalibration/home-lock-wip-donor-1440x900.webp` (SHA-256 `31b00079fd7b97f91294c2c3957543ec334f17717e36f70e44e76497be8f0ca6`).');
sm.push('- Use it as a visual/CSS donor only. It is not authority and not approved final.', '');
sm.push('## Preservation-only folders', '', '- `toadal-feast-web-local-wip-preservation`', '- `toadal-feast-web-wo002-preservation`', '- companion prep/archive branches and staging rollback refs', '', 'Preservation folders are evidence/donors. They are not product authority.', '');
sm.push('## Historical / superseded website folders', '', '- `toadal-games-redesign-20260925`', '- `toadal-games-master-20260925`', '- `toadal-games-web-r2`, `r3`, `v4`', '- `toadal-final-*`, `toadal-release-*`, `toadal-integration-*`', '- older WO-001 polish/audit/remediation worktrees', '- `visual-recovery-combined`, `visual-remediation`, `website-visual-audit-*`', '');
sm.push('These folders remain useful for engineering donors, historical evidence or assets. They cannot override the 2026-10-01 consolidated TOADAL FEAST product authority.', '');
sm.push('### Explicit conflict example', '', '`C:/ReleaseOps/toadal-games-redesign-20260925` contains an older authority model that describes TOADAL GAMES/Grove-first composition, a green/Toto guide and dashboard/left-rail concepts. Later authority establishes TOADAL FEAST-first presentation and canonical golden Toadal. The old rules are donor/history only.', '');
sm.push('## High-value historical donors', '');
sm.push('- `toadal-games-redesign-20260925/site/src/scripts/app.js` - working browser-local Sparks, streaks, Treats, quest, daily reward and reduced-motion parallax donor.');
sm.push('- `toadal-games-web-r3/TOADAL_GAMES_R3_INTERACTIVE_MASCOT` - explicitly deferred/not a release candidate, but R2 smoke proves a 21-route local build plus Passport/HUD, optional sound, daily reward, Treat/quest persistence and reward behavior. Its route templates include Toadal, Account, Community, Store, Support, Privacy, Terms and Updates.');
sm.push('- Import behavior/templates only after translating them to current TOADAL FEAST branding, truthful feature states and current storage/content contracts.', '');
sm.push('## External systems', '', '- **GitHub Pages** is the active public staging system.', '- **Netlify** contains cartridge previews and an older V13 site preview; it is not current website deployment authority.', '- **Figma** contains the Approved Home Target page. Repository-preserved approved Home evidence remains usable when Figma MCP quota is unavailable.', '');
sm.push('## Rule', '', 'Before using any source outside `docs/authority`, `docs/design`, approved mockup evidence or current candidate lineage, identify its authority tier in the Manifest Compliance Ledger. If uncertain, treat it as a donor - not as an instruction.', '');
fs.writeFileSync(path.join(root, 'docs', 'authority', 'PROJECT_SOURCE_MAP_2026-10-01.md'), sm.join('\n'));

console.log('Manifest compliance docs regenerated from JSON.');
