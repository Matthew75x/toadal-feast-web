# Lean Gully owner-native integration — 2026-10-02

Status: PASS for this focused integration. No merge, deployment, staging promotion, production change, main change, or LOCK_VISUAL claim.

## Preservation and authority

- Website workspace: `C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\toadal-feast-web-owner-native-authoring-20261002`; branch `work/owner-native-authoring-20261002`.
- Website starting checkpoint `9bad1ecf65ea6af5f7ae28ab45db5810484b2a17`, tree `91234bdeccb849be3ec1cd0274c88cc9d998ca99`, was pushed without force and fetched back before integration. The commit containing this receipt is the follow-up checkpoint; obtain its exact SHA/tree with `git rev-parse HEAD` and `git rev-parse 'HEAD^{tree}'`.
- Studio workspace: `C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\studio-owner-authoring-20261002\TOADAL_STUDIO_1.4.2_AUDITED_WEB_BUILDER`; version 1.4.2; same work branch; no remote exists.
- Studio starting tip `e906afc9943ec6e9a63d312d961e0f825f1839d8`, tree `b1650649904d867d869d95ec4513625c940faee1`, contains accepted checkpoint `c504b8e247640f097d85c86ae9da8c9b20c20762` and intervening owner-pilot fixes.
- Before integration, a full recoverable Studio branch bundle was created at `D:\TOADAL-Backups\owner-native-authoring-20261002\studio-owner-native-authoring-20261002.bundle`; SHA-256 `53b17ac4864a48f1a1438e49907068759a85189471b8f183b23f327bb78d1666`. Bundle verification, head listing, and fresh bare-repository recovery passed, including the accepted checkpoint's ancestry.
- Studio follow-up checkpoint: `4e0649e8a1a13ae87a53f895484b8db57d19fc8d`, tree `649c7a64e74061cce49b7df1a3a1929d3b8b8dd7`; seven reviewed source/test files. Generated `AI/AUDIT/mcp-tools.jsonl` remains modified and excluded, not discarded.
- Final full branch bundle: `D:\TOADAL-Backups\owner-native-authoring-20261002\studio-owner-native-gully-followup-20261002.bundle`; SHA-256 `630989f817d1dbc5d78b69b701de062926ab570450051b5b0c2ec76a061d4f61`. Bundle verification/list-heads passed and fresh D: bare-repository recovery confirmed exact final SHA/tree and both c504b8e/e906afc ancestors. Original bundle and audit-log bytes remain intact. This is local recovery preservation, not an off-machine Studio backup.
- Canonical source remains `studio-project/toadal-feast-website/reference/assets/images/characters/gully.webp`, SHA-256 `177f30acff9a2a782ba3e80aa3e05f19860dddeb513f7de0955fadc0b8585cea`, 319×319, 15,798 bytes. Home, World, Media and the character registry retain this source relationship.
- Derivative master authority is fetched handoff commit `012877ab7058f8de3c1802d2a572834a57ae2666`. No handoff branch merge/cherry-pick occurred. Only the approved desktop/mobile masters were used. Masters and metadata are preserved outside exporter paths at `D:\TOADAL-Backups\owner-native-authoring-20261002\gully-masters`.

## Actual issue and the focused fix

The real Studio Characters card had literal clipping, not an incorrect focal point. Its square image inherited height:auto: desktop image 254×254 inside a 254×160 clipped media well; 390px image 156.5×156.5 inside a 156.5×115 well. Computed fit was contain, focal 50%/50%, and no zoom transform. The lower body/feet fell outside the well. The grid remains four columns on desktop and two at ≤680px.

Only the Characters Gully image component `component.characters.rich-text.b6b62f40fca1.img` was re-authored. Desktop uses the approved 7:4 derivative; mobile uses 3:2. Native presentation: cover, focal 50/50, zoom 1, padding 0, desktop height 160px, mobile height 115px, mobile breakpoint 680px. At the widest two-column viewport, cover alone would crop the subject: a native mobile `imageMaxWidth:172.5` preserves the 3:2 framing and both feet. No Gully-specific CSS was added.

The minimal reusable Studio extension exposes a mobile asset picker, its breakpoint, and image max-width controls; renders a picture/source with the primary img fallback; validates the registered mobile reference; and respects these native responsive presentation values. A precise renderer guard prevents native image breakpoint `maxWidth` being misread as a legacy layout width. The latter collision initially injected a generated global stylesheet into unrelated/frozen HTML; it was fixed and covered by a byte-invariance regression test, not by weakening tests or changing frozen baselines.

The obsolete intermediate generated stylesheet was shown in scoped status with its hash/size, copied intact to `D:\TOADAL-Backups\owner-native-authoring-20261002\gully-qa\discarded-generated-stylesheet-preserved.css`, then removed only from generated dist. No source/history/master was deleted.

## Production asset ledger

- Desktop master: `gully-card-fit-desktop-7x4-1050x600.png`, 329,428 bytes, SHA-256 `481ad8dc37e26180319314452644e73c4743d2e2c0240640fc5ef661902ad499`.
- Desktop imported/public filename: `asset-import-gully-card-fit-desktop-7x4-431513d3.431513d3b1.webp`; 1050×600; 29,794 bytes; SHA-256 `431513d3b1ea642582412819b4e37be91b517f011a29ef8dd7bf63bd6030c48d`.
- Mobile master: `gully-card-fit-mobile-3x2-900x600.png`, 324,586 bytes, SHA-256 `a2f72ce4b16429ddac86a4f38291ed2ad3e6d5073e3d79e1add037dfcb241265`.
- Mobile imported/public filename: `asset-import-gully-card-fit-mobile-3x2-a6e8afa4.a6e8afa445.webp`; 900×600; 29,570 bytes; SHA-256 `a6e8afa445bde0c16837784850da3622de7705ae23ad11d2db1fdf0994fac8bd`.
- Conversion: Pillow 9.5.0 WebP quality 90, method 6. Alpha is identical (maximum alpha delta zero). Visual inspection confirmed intact eyes/outlines/detail; RGB is lossy, not claimed pixel-identical. Savings are about 91% per master.
- Catalog IDs: `asset.import.gully-card-fit-desktop-7x4.431513d3` and `asset.import.gully-card-fit-mobile-3x2.a6e8afa4`. Both imported through the actual Studio file picker; metadata recorded through the revision-checked native catalog/history transaction. Entries retain canonical asset/source/hash, exact handoff and master hashes, dimensions, conversion, alpha bounds, replacement capability, tags and `/characters/` render target.
- Project sources are the two files under `assets/imported/`; public copies are under `dist/assets/studio/`. The canonical square file was not overwritten.
- The existing visual authority lock retains its previous 68 entries and adds only these two exact approved records (70 total). The canonical Gully/gameplay verifier retains all six frozen source/output assertions and exact canonical archive/hash pins; derivative tests add positive and negative provenance checks.

## Real owner-native round trip

Using Studio 1.4.2 at `http://127.0.0.1:4323/`, the owner controls selected both catalog assets and the values above, saved, reloaded/reopened the project, and showed persisted fields. Desktop/mobile preview selected the intended source and framing. Workbench Export Website produced two independent static ZIPs, without manual source edits to make the UI test pass.

Evidence under `docs/authoring/gully-lean-evidence/` records exact saved/reopened fields, preview currentSrc/computed values, both export paths, focused browser results, native inspect/verify checkpoint and asset ledger. Screenshots and ZIPs remain at `D:\TOADAL-Backups\owner-native-authoring-20261002\gully-qa` and are deliberately not committed as temporary screenshots.

- UI save/reopen/preview/export: PASS. Owner can replace primary/mobile assets, adjust fit, focal, zoom and responsive image sizing without editing code.
- Both exports and tracked dist: 140 files, exact uncompressed ledger SHA-256 `90ffc5553176535dbf9e360fbd4a3d2e077b76b8f0f1921ae595e4f31ad59d18`; no differences; index.html and 404.html present. ZIP-container timestamps are not used as the determinism criterion.
- Native inspect/verify checkpoint: PASS, 33 pages, 4 games, 70 assets; validation zero errors/warnings; graph 182 nodes, 218 edges, zero dangling references. History cursor 11/11. Checkpoint verify also rerendered the final project successfully.
- Studio affected tests: 33/33 PASS (`tests/owner-native-controls.test.ts`, `tests/owner-fields-ui.test.ts`, `tests/owner-studio-ui-contract.test.ts`), using D: scratch. Includes missing/mobile-source validation and untouched reference/game output invariance.
- Website focused tests: 11/11 PASS (`scripts/canonical-gully-gameplay-authority.test.mjs`, `scripts/owner-native-projection.test.mjs`). Canonical Gully/gameplay CLI verifier PASS.
- Visual asset authority: PASS, 70 registered assets; 25 runtime derivatives; 85/85 visual files; 26 product references. Standalone render-freshness check PASS for all 33 registered routes. Pages base-path and static links PASS for 34 HTML files with `/toadal-feast-web/`.
- Focused exported-browser cases: 6/6 PASS at 1440, 390, 430, 320, 680 and 681px; exact desktop/mobile currentSrc, correct authored fit/focal/height, full alpha subject inside the well, zero horizontal overflow, asset 404 or page errors. Actual discovery click changed status to “Discovered in this browser”; actual profile link click reached `/toadal-feast-web/characters/toadal/`.
- Visually checked Characters desktop grid: full head feathers, body/wings and both feet, edge safety and coherent full-body scale. Other characters were not restyled. This remains owner review, not LOCK_VISUAL acceptance.

## Export hygiene and scope

Gully public payload before: 15,798 bytes, one necessary canonical square source. After: 75,162 bytes, that same source plus 59,364 bytes for two necessary responsive derivatives. No unused 4:3/2:1/alternate-square PNG variants, source masters, README, handoff manifest/receipt, or workbench metadata were added to public assets. Existing legitimate runtime manifest assets remain intentional.

Against the starting website checkpoint, tracked generated output changes only `dist/characters/index.html` and adds the two WebPs. Home, World, Media, App/Download, companion/runtime/Interactive Discovery bytes remain unchanged. All six canonical gameplay source/output blobs remain unchanged. `project.json` remains byte-identical, SHA-256 `e175531b79f16825f51dd560a213b2616dbf60e7b1076a5058ce8b8c48bdf37f`; intended authoritative changes are in the native Characters page and catalog, not dist-only.

No full 183-test suite, 83-case matrix or owner-preview gate was rerun. Their previously qualified results describe the accepted baseline, not a fresh full-suite claim for this follow-up. Broader owner-native acceptance/cancel semantics from earlier pilot work are not claimed closed by this focused Gully task.

## Resume

Recover Studio in a new unused directory with `git clone --config core.autocrlf=false --branch work/owner-native-authoring-20261002 D:\TOADAL-Backups\owner-native-authoring-20261002\studio-owner-native-gully-followup-20261002.bundle <new-unused-Studio-directory>`. Keep source bytes LF for the recorded renderer SDK provenance. Existing ignored dependencies/Vault packs are local prerequisites, not claimed included by the Git bundle; use the retained qualified runtime environment when resuming.

Keep existing localhost services running: 4320 (original reopened service, PID 30660) and 4323 (reviewed final Studio source, PID 8432 at checkpoint). Use 4323 for this integration; 4320 started before the final source changes. Both use the canonical project, entirely local Node Studio/renderer/export paths; no external deployment/API was needed.

If a service is no longer running, from the Studio repository use PowerShell:

```powershell
$env:TOADAL_PROJECT='C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\toadal-feast-web-owner-native-authoring-20261002\studio-project\toadal-feast-website\project.json'
$env:PORT='4323'; $env:TOADAL_HOST='127.0.0.1'
$env:TEMP='D:\Codex-TOADAL-Owner-QA-8b9080b3491b414fadb09ccb022b838e\studio-export-tmp'; $env:TMP=$env:TEMP
node --no-warnings --experimental-strip-types apps/studio/server.ts
```

No remaining blocker for this focused integration. Next action: owner review of the corrected Characters Gully card in local Studio before separately authorizing any staging promotion.
