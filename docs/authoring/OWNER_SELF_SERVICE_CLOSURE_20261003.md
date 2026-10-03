# Owner self-service foundation closure — 2026-10-03

RESULT: PASS for the bounded foundation in OWNER_SELF_SERVICE_CLOSURE_PLAN_20261002.md. Representative owner-native page management is engineering-qualified through actual Studio UI on independent pilot copies. This is not owner visual acceptance, deployment, or completion of every original product-manifest goal.

## Exact checkpoints and environment

- Website starting source: 4d5f60ba06788939dc9a392249292777d972a07d / tree 09b7984039a11db1159d9f131c5a9b849aa5e04f.
- Website starter implementation: 89566dca408c360b4c2ccd4f51d35860cb22f948 / tree b5979e35f3956843aaf7de98ec8d0539bb80cde3.
- Final website receipt is the commit containing this document; obtain its exact SHA/tree with git rev-parse HEAD and git rev-parse 'HEAD^{tree}'. The external final receipt records them after commit.
- Studio 1.4.2 source: e06eb5f14c210fc22b9f39dd11b9b51ee6847faa / tree b6818ee8e0a5184e45630f6ebea871fb568a1bb2.
- Both repositories remain on work/owner-native-authoring-20261002.
- Website workspace: C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\toadal-feast-web-owner-native-authoring-20261002.
- Studio installation: C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\studio-owner-authoring-20261002\TOADAL_STUDIO_1.4.2_AUDITED_WEB_BUILDER.
- Canonical TOADAL_PROJECT: C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\toadal-feast-web-owner-native-authoring-20261002\studio-project\toadal-feast-website\project.json.
- Node v22.23.2 / npm 10.9.8.
- Updated canonical editor: http://127.0.0.1:4328/; preview: http://127.0.0.1:4328/preview/. Node PID 41644 serves the committed apps/studio/server.ts.
- Original 4323 PID 31036 and 4324 PID 30664 were not stopped. Pilot 4326 PID 2040 and corrected pilot/recovery 4327 PID 29312 remain available. 4323 is the older backend, not the new safe-page server.
- The 4327 service now has the independent restored owner-pilot-qa-self-service-20261003-import-2 project open; it is NOT the canonical project.
- Editing, rendering and export are local. No external API is needed for this workflow.
- TEMP/TMP for the updated services: D:\TOADAL_BACKUPS\studio-owner-authoring-20261002\owner-self-service-runtime-20261003, a sibling OUTSIDE the project. C: ~48.7 GB / D: ~88.3 GB free at closure checks.

## Delivered source, not dist-only behavior

| Foundation | Implemented and evidenced |
| --- | --- |
| Explicit editing safety | Ordinary component, Navigation, Page Settings and page-creation drafts; Save/Cancel/Keep/Discard guards across page, panel, project, restore, history and export transitions. Busy/stale/rejected saves preserve drafts. |
| Safe copies and routes | Recursive fresh component/DOM-local IDs across children and slots; shared asset/symbol references preserved; new copies are drafts with cleared schedules and stale canonical/OG URLs. Unsafe/colliding/protected routes rejected; specialized runtime/game/Reader sources excluded. |
| Page creation | Blank / Template / Existing page flow; curated TOADAL Media, Article/Story-style and Information starters, selected independent page, deliberate published-only Add to navigation. |
| Local draft preview | Draft preview is local and noindex/nofollow. Static export does not include drafts in pages, Search, sitemap or navigation. Preview is not deployment. |
| Structure and content | Add text/image, duplicate, reorder, hide, delete with confirmation, Undo; saved/reopened real image, narrative, and link fields; protected runtime content retained. |
| Export and recovery | Preparing/error/download-initiation feedback; deterministic static output; valid clicked destinations; whole-project Save As, portable backup and independent restore; invalid ZIP rejection with current source/context intact. |
| Owner walkthrough | Actual Content/Design and menu labels, screenshots, checkpoints, scope and limitations in OWNER_SELF_SERVICE_GUIDE_20261002.md. |

Canonical accepted pages, media, navigation, game cartridges and visitor dist bytes were not changed. The sole project-data change is collections/patterns.json adding three ordinary-page starter descriptors. All temporary copy/image/link/section/page edits live only in safe pilot projects. No manually patched dist.

## Proportionate qualification

- Affected Studio tests: 40/40 + 31/31 = 71/71 PASS on the committed Studio implementation.
- Actual UI pilot evidence: 9 foundation + 8 content/export + 6 recovery + 8 starter checks = 31 bounded checks PASS, with zero browser page errors.
- Canonical validation/inspect/quick render/static export/verify checkpoint PASS: 33 pages, four games, 70 assets; zero validation errors/warnings and zero dangling references; nine accessibility checks PASS.
- ai:doctor: 26/26 PASS, exit 0.
- Canonical static ZIP: 39,790,713 bytes. Complete uncompressed ledger equals all 140 tracked dist files: zero missing, extra or hash differences. index.html and 404.html present.
- Render freshness PASS (33 registered routes), static links PASS (34 HTML files), Pages base path PASS (/toadal-feast-web/; 34 HTML files), each exit 0.
- Media authored output checked on desktop and 390px; Article, Information, Existing and Blank previews checked at 1440/390 without overflow.
- Historical 183/183 Studio, 16/16 owner-preview, 48 integrated and 83/83 browser results were NOT rerun or represented as fresh qualification. No broad gate/matrix was necessary: canonical visitor output is byte-identical and the affected paths have focused coverage.

## Exact authored round-trip proof

Through Studio UI only: imported asset asset.import.gully-card-fit-desktop-7x4-1050x600.481ad8dc, fit=contain, focalX=45, focalY=55, imageHeight=180, aspectRatio=4/3, zoom=1.05, alt=Owner uploaded image pilot. Saved/reopened project props and emitted HTML/CSS agree; exported browser image decoded at natural width 1050 with computed object-fit contain and object-position 45% 55%.

Actual Media narrative field became “OWNER_AUTHORED_MEDIA_COPY — only in the independent pilot.” It survived reopen and appeared in generated HTML. The existing link href became /about/; Pages export emitted /toadal-feast-web/about/. QA clicked both the added Home navigation destination and that edited link in the exported browser.

Two static exports from unchanged saved pilot inputs had identical 142-file uncompressed path/SHA256 ledgers. Section additions and restored hidden/deleted sections were present in exported output. Whole-project backup was 39,911,518 bytes, SHA256 42a0be06bb4eb0b63f456521ac87c206fd41565f8b99f02d4fc8c3eaa93aff79. Restore preserved all 168 meaningful non-manifest source files byte-for-byte; project.json differed only in the intentional new independent id. Reopen/preview and invalid-ZIP non-mutation also passed.

The original pilot-roundtrip.json remains false for its final backup step: its launcher incorrectly placed TEMP/TMP INSIDE the project, making fs.cpSync attempt to copy a folder into itself. This is explained, not erased. Correcting only that QA environment prerequisite and using the SAME saved authored state produced the passing supplemental pilot-recovery.json. Earlier diagnostic receipts (UI async timing, no-op Save, browser response cache, wrong transient-status assertion) are retained on D:. No Studio assertion or failing product test was removed or weakened to pass.

Saved QA harnesses now accept OWNER_PILOT_URL, OWNER_PILOT_ROOT, OWNER_PILOT_EVIDENCE and OWNER_PILOT_IMAGE where relevant, guard against canonical contexts, and have syntax checks PASS. Use a fresh independent pilot, fresh evidence directory, and sibling D: TEMP/TMP when rerunning; do not rerun them against the accepted project or an already-mutated fixture. Full receipts retain their original tested sequence; later harness-only context guards were syntax-checked, not used to claim a new full pilot run.

## Preservation and resume

Studio full-history bundle:
D:\TOADAL_BACKUPS\studio-owner-authoring-20261002\studio-owner-self-service-foundation-20261003.bundle
SHA256 CD3F2766FC4A210BB36A08FEB04DD9676F25B68A58E9B6AE55C89BBB576FE705.

Bundle verify passed and a fresh bare reconstruction at D:\TOADAL_BACKUPS\studio-owner-authoring-20261002\studio-owner-self-service-recovered-20261003.git recovered the exact Studio SHA/tree above. Studio has no remote; this is a verified LOCAL recovery copy, not off-machine preservation. Existing non-secret configuration backup remains adjacent in non-git-owner-config; node_modules and ignored Vault packs are outside Git/bundle.

The only intentionally dirty Studio path is the pre-existing/generated AI/AUDIT/mcp-tools.jsonl, separately copied to the evidence directory as studio-audit-preserved.jsonl. Ignored owner-pilot-qa-* projects/history/build/exports remain intact; none is swept into source commits. Website evidence/tests/docs are checkpointed separately from raw ZIPs/logs/generated pilot files.

Reopen the running canonical editor at http://127.0.0.1:4328/. If the service later stops, run from the Studio installation:

~~~powershell
$env:TOADAL_PROJECT='C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\toadal-feast-web-owner-native-authoring-20261002\studio-project\toadal-feast-website\project.json'
$env:TOADAL_HOST='127.0.0.1'
$env:PORT='4328'
$env:TEMP='D:\TOADAL_BACKUPS\studio-owner-authoring-20261002\owner-self-service-runtime-20261003'
$env:TMP=$env:TEMP
node --no-warnings --experimental-strip-types apps/studio/server.ts
~~~

Check that the port is free before launching another instance. Do not stop other services or import test values into the canonical project.

## Evidence and remaining boundaries

Compact source-controlled receipt: self-service-20261003/acceptance.json. Guide screenshots: self-service-20261003/created-media-page.png and exported-media-390.png. Full raw receipts, exported ZIPs, ledgers, restored-editor screenshot, four starter-mobile screenshots and diagnostic attempts:
D:\TOADAL_BACKUPS\studio-owner-authoring-20261002\owner-self-service-evidence-20261003.

- Foundation acceptance is closed for representative ordinary website authoring; this does not mean every specialized feature is owner-editable.
- The Article starter retains the existing News/Devlog ordinary content and shell; its awaiting-publication text must be replaced with genuine owner content. It does not implement registry-driven Stories/Manga/Reader or a News publishing wizard.
- Raw game-source upload/compilation and prepared-cartridge onboarding remain separately scoped.
- Route changes update direct shared navigation destinations, not every incoming component/content link. Do not rename a linked live route without reviewing its incoming links.
- Whole-project restore opens an independent copy, not an in-place overwrite. All failure modes and off-machine recovery have not been certified.
- Native protected runtime leaves remain specialized; no arbitrary HTML/source editing capability is fabricated.
- Frozen asset pruning, Home LOCK_VISUAL and companion-overlap acceptance are not closed by this task.
- Studio bundle/config/evidence still require transfer to an approved off-machine ASSIGNATOR destination; no such destination was available to this local task.

No merge, main/staging change, production/toadalfeast.com change, deployment, redesign or next feature tranche. The GitHub Pages workflow deploys only staging/live-visual; any work-branch push is source preservation only. Before final preservation, remote main was 87050885331770ca3e30db7e463154aebd777512 and staging was 485e5cee7fd9e8d74bde017e99a861ff7da3a2c6; the external final receipt verifies them again.

Recommended next action: owner walkthrough on an independent project copy using the guide, before separately scoping the structured Stories publishing milestone.
