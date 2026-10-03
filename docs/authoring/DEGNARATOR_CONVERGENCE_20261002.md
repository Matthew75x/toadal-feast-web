# TOADAL DEGNARATOR convergence — 2026-10-02

## Executive status

RESULT: PARTIAL PASS. Representative non-coding workflows are proven, not full owner-usability or LOCK_VISUAL acceptance.

| Area | Status | Reason |
| --- | --- | --- |
| Website | GREEN | Approved content/design preserved; fresh canonical export equals tracked dist. |
| Studio | GREEN | Scoped changes committed; 27/27 affected tests and real UI recovery pass. |
| Owner usability | AMBER | Native inspector is safer; settings/navigation/structure workflows are not uniformly protected or fully piloted. |
| Visual convergence | AMBER | Approved design retained; companion overlap remains an owner decision. |
| Asset/export hygiene | AMBER | Unused new managed imports/overrides do not auto-ship; frozen legacy payload still ships wholesale. |
| Preservation | GREEN | Website GitHub work branch and independently recovered Studio bundle; Studio backup is still local, not off-machine. |

No merge, deployment, main/staging/production update, cartridge change, or ASSIGNATOR native-release work. Prior 183/183 Studio, 16/16 gate, 48 integrated and 83/83 browser results are historical evidence, not newly rerun results.

## Authorities

Website root: `C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\toadal-feast-web-owner-native-authoring-20261002`.
Branch: `work/owner-native-authoring-20261002`.
Unchanged qualified content/export SHA `1ceccb84b5722d2cdf292a9ba9d330299fb29c97`; tree `ec9fa0364b9af4e36bc3c8d2b30987d5cbeeb767`.
Remote `https://github.com/Matthew75x/toadal-feast-web.git`. This tip and ancestor `9bad1ecf65ea6af5f7ae28ab45db5810484b2a17` were fetched/proven before work. This report is a documentation/evidence-only follow-up: `git rev-parse HEAD` / `git rev-parse 'HEAD^{tree}'` identify its exact checkpoint. The external handoff adds the post-push SHA/tree without a self-referential commit hash.

Studio root: `C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\studio-owner-authoring-20261002\TOADAL_STUDIO_1.4.2_AUDITED_WEB_BUILDER`.
Same branch; final SHA `d18c692268eb88dbbc14f23c94dd9c0a95f379ee`; tree `0d197aac219e6925b2552e971e384722b3b0446c`.
Studio **1.4.2**, Node **v22.23.2**, npm **10.9.8**. No Studio remote exists; none invented.

Bundle `D:\TOADAL_BACKUPS\studio-owner-authoring-20261002\studio-owner-experience-convergence-20261002.bundle`, SHA-256 `cd9910cd3c397c1b4cdc70b0e16778d4a68a6198399065d7a38df2458162e548`.
Complete history/ref verified and independently recovered at `D:\TOADAL_BACKUPS\studio-owner-authoring-20261002\verify-convergence.git`; exact SHA/tree and c504b8e/4e0649e ancestors pass. Original pre-change bundle intact.

Canonical TOADAL_PROJECT: `C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\toadal-feast-web-owner-native-authoring-20261002\studio-project\toadal-feast-website\project.json`.
Unchanged manifest SHA-256 `e175531b79f16825f51dd560a213b2616dbf60e7b1076a5058ce8b8c48bdf37f`. This is the 33-page website, not the different bundled 24-page sample.

## Localhost / reopen

Canonical Studio `http://127.0.0.1:4323/`, preview `/preview/`, Node PID 31036 running `apps/studio/server.ts`.
Safe pilot `http://127.0.0.1:4324/`, PID 30664, manifest `D:\TOADAL_BACKUPS\studio-owner-authoring-20261002\owner-pilot-main\project.json`.
Leave both services running. Earlier 4320/4325 listeners ceased during runtime/auth transition, not by coordinator shutdown; only 4323/4324 were reopened.
Editing, rendering and export are local; no external API is required. GitHub was used for preservation, not deployment.

If 4323 is no longer listening, from the exact Studio root:

```powershell
$env:TOADAL_PROJECT='C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\toadal-feast-web-owner-native-authoring-20261002\studio-project\toadal-feast-website\project.json'
$env:PORT='4323'; $env:TOADAL_HOST='127.0.0.1'
$env:TEMP='D:\Codex-TOADAL-Owner-QA-8b9080b3491b414fadb09ccb022b838e\studio-export-tmp'; $env:TMP=$env:TEMP
node --no-warnings --experimental-strip-types apps/studio/server.ts
```

Do not launch on an occupied port. Fresh recovery needs Node and `npm ci` for pinned qrcode. Website Git carries canonical project/assets. Small non-secret preferences/HUD documents are preserved at `D:\TOADAL_BACKUPS\studio-owner-authoring-20261002\non-git-owner-config`. Ignored classified Vault art/custom tools and node_modules are outside the bundle; optional to site rendering, but transfer Vault packs separately to reproduce that complete library. No credentials copied.

## Owner workflow matrix

| Workflow | Status | Evidence / limit |
| --- | --- | --- |
| Page finding | GREEN | Named Pages and current-page title; Home/Characters/Toadal selection proved. |
| Image import | GREEN | Studio file picker imported a named project asset; catalog now has thumbnails. |
| Image replacement | GREEN | Selection saved/reopened and selected file emitted in export. |
| Fit/focal/scale | GREEN | Contain, 42/58 focal, 150px height, 7/4 aspect, 1.02 scale persisted/rendered. |
| Text | GREEN | Real biography text saved/reopened, previewed and exported. |
| Dialogue/content | AMBER | Structured character biography proven; no dedicated dialogue type claimed. |
| Links | GREEN | /about/ route saved; exact exported CTA clicked to About. |
| Navigation | AMBER | Labels/order/save/reopen/export and stable metadata proved; full dirty/cancel guard still absent. |
| Ordering | AMBER | Navigation order proven; general content reorder not fully piloted. |
| Visibility | AMBER | UI exists; no fresh hide/export round trip claimed. |
| Responsive preview | GREEN | Desktop/tablet/mobile sampled; independent mobile image settings visible. |
| Save | GREEN | Explicit native Save/Ctrl+S; invalid focal/route does not write. |
| Reopen | GREEN | Image/copy/navigation persisted through reload. |
| Export | GREEN | Authored values emitted; repeated uncompressed bytes identical. |
| Error recovery | AMBER | Native Cancel/Keep/Undo and failed-reload recovery pass; legacy/settings protection incomplete. |

Duplicate/add/remove controls are supported, not freshly certified owner-intuitive. Three protected runtime leaves remain specialized/read-only. Tested edits required no code or dist editing.

## Systemic fixes / changed files

Native inspector drafts replace silent 800ms writes with Save/Cancel, dirty feedback, Ctrl+S, transition choices and unload protection. Concurrent operations/errors retain drafts; failed Cancel cannot navigate. Current title survives reopen. Asset thumbnails/explanation distinguish backup originals from runtime assets. Navigation reorder/removal preserves IDs/metadata, validates destinations, and Workbench correctly shows 10 primary links. Legacy changed assets materialize only when their HTML reference is used.

Studio checkpoint: exactly 11 intentional source/test/doc files, listed in `convergence-20261002/studio-checkpoint-files.json`. Pre-existing `AI/AUDIT/mcp-tools.jsonl` remains dirty (88 appended lines), not committed/discarded. Preserved copy SHA-256 `c12716819ed13ac18bd6a8bba92f794a0e7782bf3b38da8488dcbc3af52e624d`. Runtime build/history, caches, screenshots and harnesses excluded. No implementation exists only in dist.

## Round-trip / safety evidence

All edits used the separate D: pilot. Characters/copy/catalog/Home/navigation restored via Studio Undo; original hashes match. Canonical content never received temporary values.

Image `pages/characters.json`, component `component.characters.rich-text.b6b62f40fca1.img`: asset `asset.import.gully-card-fit-desktop-7x4-1050x600.481ad8dc`, fit contain, focalX/Y 42/58, imageHeight 150, aspectRatio 7/4, zoom 1.02, alt `Owner pilot full-body Gully image`.
Export `characters/index.html` emits `assets/studio/asset-import-gully-card-fit-desktop-7x4-1050x600-481ad8dc.481ad8dc37.png`, with `object-fit:contain;object-position:42% 58%;height:150px;transform:scale(1.02);transform-origin:42% 58%;aspect-ratio:7/4;padding:0px`. Existing mobile asset/override stays independent; desktop replacement does not claim to replace it.

Copy `pages/toadal-profile.json`, component `component.toadal-profile.rich-text.6313f0136c06.p`, `text`: actual biography plus `Owner pilot copy only — not published.` appeared in preview/export `characters/toadal/index.html`.
Link `pages/home.json`, component `component.home.hero.2395d33d8bd2.button-link-button-link-`, `href=/about/`: UI save/reopen/preview, exported `/toadal-feast-web/about/`, real browser click to About. Navigation retained play/home IDs after moving/renaming Home.

Repeated image/copy exports: 140 identical files, uncompressed ledger `1994b86dfaf9bc6f760078b5bd5f1a4bc7d8114054f9012310feaa2c97dda36c`. Invalid input/no-silent-write/Keep/Cancel/Ctrl+S passed. A browser-only simulated 503 proved failed Cancel retains draft, blocks transition and can retry without data mutation. Earlier pre-final-Undo assertion and two click-harness selector/path errors are retained diagnostics, not hidden product failures.

## Visual / content convergence

No website redesign. Ten routes at 1440/820/390: 30 HTTP-200 samples, 243 image instances, zero horizontal overflow and no recorded broken-image/browser failures. Approved world imagery/cream cards/brown framing/pink CTAs/gold accents retained. Existing responsive compressed Gully derivatives unchanged; no one-off CSS fix.

Remaining gap: fixed companion overlaps lower-right content on desktop Home and several tablet layouts; contact sheets show the owner tradeoff. Approved companion architecture unchanged. 'Play the Feast World for Free' passes the current contract with exactly one isolated PREVIEW Wicked Bites route and zero PUBLIC games; optional wording clarity is an owner decision.
Unverified app/store links stay disabled, editorial surfaces remain honestly gated, Support still lacks approved destinations; no lore/content invented. Sandbox iframe storage restrictions are not asserted to be top-level Feast Pass failures.

## Asset / export report

70 managed records; frozen reference contains 99 asset files. Dynamic/script/template paths mean uncatalogued assets cannot be blindly called unreachable. Shared source/Vault imports stay separate; unused new imports/overrides are not emitted, but backups retain originals.

Essentially 100% of frozen legacy assets still copy to runtime. Minimal-runtime reachability closure is NOT certified: master/archived paths need static+dynamic/template proof before pruning. Exact public export: 140 files / 42,456,991 bytes; assets 102 / 39,073,448 bytes. ZIP 39,790,713 bytes, SHA-256 `658edcf1bd488d08307ad5064d4d120b35700673f40ff521529d4b723fe1d0ff`.
One 14,740-byte Toadal portrait duplicate serves canonical/materialized paths. Large companion PNGs ~1.3–1.7 MB remain candidates; no blanket recompression. New optimization prevents unused changed overrides expanding output, not a claimed reduction of this accepted package. Prior Gully savings retained, not counted as new work.

## Focused QA / canonical flow

27/27 affected tests PASS after final fix; JS syntax/diff checks PASS. No broad suite rerun.
Validation, typed inspect, render, static export, verify checkpoint PASS: 33 pages, 4 games, 70 assets; graph 182 nodes/218 edges/0 dangling; zero validation errors/warnings. Fresh export matches all tracked dist bytes; index/404 present. Current Pages paths/static links PASS (34 HTML), freshness PASS (33 routes), Home visual contract 38/38 PASS.

Obsolete WO-001 verifier gave two retained failures: it expected non-linked cards and retired Home Search form. Current contract explicitly requires preview routing and compact header Search link; 38/38 passes. No tests/source changed to conceal this discrepancy.
Protected remotes unchanged: main `87050885331770ca3e30db7e463154aebd777512`, staging/live-visual `485e5cee7fd9e8d74bde017e99a861ff7da3a2c6`. Pages triggers/guards only staging; work-branch push does not deploy. Production/toadalfeast.com untouched.

## Evidence

Committed compact receipts: `docs/authoring/convergence-20261002/`.
Original D: root: `D:\TOADAL_BACKUPS\studio-owner-authoring-20261002`.
Subfolders `convergence-owner-main` and `convergence-owner-nav` retain ZIPs/pilot evidence; `convergence-visual` has metrics.json/contact-1440.png/contact-820.png/contact-390.png. Click screenshot: `convergence-owner-nav/exported-about-click.png`. Canonical receipt `convergence-canonical.json`.
Preflight `C:\Users\Metarator\Documents\Codex\DEGNARATOR_TOADAL_PREFLIGHT_20261002.md`; newest website-root `TOADAL_STUDIO_LIVE_STATE_20261002.md` section supersedes historical states.

## Remaining blockers / owner decisions

No focused functional/checkpoint blocker. Full usability acceptance remains incomplete for uniform form drafts and structure/visibility pilots; frozen minimal runtime asset reachability remains incomplete. These are bounded follow-ups, not permission for redesign now.
Owner decisions: companion overlap tradeoff, approved store/support destinations/editorial material, optional headline wording. No LOCK_VISUAL claim.

## Handoff to ASSIGNATOR

Website authority: pushed documentation-only follow-up on existing work branch; source/export identical to 1ceccb8. Studio authority: d18c692 SHA/tree above in verified bundle. Canonical 33-page project, not bundled sample. No merge/deploy approval.

```powershell
git clone --branch work/owner-native-authoring-20261002 'D:\TOADAL_BACKUPS\studio-owner-authoring-20261002\studio-owner-experience-convergence-20261002.bundle' '<NEW_STUDIO_RECOVERY_PATH>'
git -C '<NEW_STUDIO_RECOVERY_PATH>' rev-parse HEAD 'HEAD^{tree}'
```

Use a new recovery path; do not overwrite working checkouts. Do not repeat completed QA or duplicate ASSIGNATOR Android/iOS/Firebase/Player/store lanes.
NEXT ACTION: transfer the verified Studio bundle and accompanying owner configuration/evidence to ASSIGNATOR for off-machine preservation.
