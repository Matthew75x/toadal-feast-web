# WO-003 Arcade Isolation & Qualification — Final Evidence

**Final disposition: ARCADE HOLD**
**Overall status: BLOCKED — conditional integration gates were not met.**

This records the completed bounded audit on `work/WO-003-arcade-isolation-20260930`. It deliberately stops before website integration: the exact isolated candidate passed its bounded runtime/security checks, but the smallest faithful package, the exact-cartridge gameplay acceptance items, and a completed real run are not established. No Arcade listing, detail/player route, static export, Pages deployment, or WO-004 work was started.

## 1. Accepted WO-002 authority and preservation

- Accepted WO-002 branch: `work/WO-002-home-evolution-20260930`.
- Exact accepted WO-002 HEAD: `8e0ded8ee1a94ddccaad6127ac05416551d23c6d`.
- Exact tree: `afd55a9bd0b0e0969cc7f6fa238eef7cf9c89aaa`.
- At freeze and final recheck, the WO-002 checkout was clean. Its evidence report is `docs/review/WO-002/WO-002_IMPLEMENTATION_EVIDENCE_2026-09-30.md` in that checkout and records the exact HEAD/tree context and passing results.
- Accepted static ZIP: `C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\toadal-feast-web-wo002-20260930\studio-project\toadal-feast-website\build\exports\toadal-feast-website-static-site.zip`; 2,141,382 bytes; SHA-256 `780082A1CC67273C868AB648745367B574F056289783FEF99B2F61D50B69125B`.
- Preserved bundle: `C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\wo003-preservation-20260930\wo002-accepted-8e0ded8ee1a94ddccaad6127ac05416551d23c6d.bundle`; 61,033,925 bytes; SHA-256 `874CB3B3C8A4BB6F6761E0AFA43B50999D19CF9A4C61779C7A4CC43EDE780AF8`. `git bundle verify` passed and reported a complete history containing the accepted WO-002 branch ref.

The WO-002 ZIP remains the last integrated website export. There is no WO-003 Arcade export.

## 2. Source authority and provenance

- Authoritative repository: `Matthew75x/Toadal-Feast-Development`, branch `main`, exact commit `6daedca1eb6aa5c953e53a538561e9c42ff9cb3c`, tree `85a5e1eb95b77deb4164f8d91e1f46e5fd8b4aee`; read-only remote `origin/main` matched. The checked-out source tree remained clean and was not modified.
- Source identifies TOADAL FEAST `1.2.9`.
- Selected donor: `arcade-standalone.html`, Git blob `951db826b29bde244486c2aacaae220cb42d3131`, 36,016 bytes, SHA-256 `e6547b9628b44ecf608f3a448a12c5761c1dcadc87f5bd3c89650ea6574a42cf`.
- Rejected alternate: `arcade-modern.html`, blob `e8a70691ecd45965ef83f1eea53e5d72d6aabf66`, a redirect shim to the full application rather than the dedicated standalone runtime.
- The selected source is authoritative by repository/ref identity, commit/tree, Git blob, and byte hash—not by folder recency. The older ASSIGNATOR audit evidence is not treated as proof for this exact isolated package.

## 3. Candidate copy, hashes, and intentional changes

The candidate lives outside the published route graph at:

`studio-project/toadal-feast-website/reference/audit/arcade-standard-6daedca1/`

The scoped `.gitattributes` rule for this audit tree disables text normalization so a Windows checkout preserves the same donor bytes used by the recorded SHA-256 ledger.

Its served `arcade-standalone.html` returned HTTP 200 from the local qualification host, 35,987 bytes, SHA-256 `aa2a55eb19a29da9e5b3cc2a336be5d22073a7d6a31d1bef34ce7a4ea619253b`. This is a harness-served candidate entry; a website-integrated/website-served Arcade entry does not exist.

The only donor-file modifications are isolated in this audit copy:

1. Entry: adds `wo003-arcade-preview.css`, the preview class, and the bridge; removes an unused poster preload and the QA bug-recorder/download script.
2. `src/runtime/modes/arcade/arcade-sprite-runtime.js`: source SHA-256 `75eb153926aed61bcf203734d8bcb2cafb8453b17b23fc65eb76c55a87418d51` → candidate SHA-256 `eaf9b33b96b8987b7498ba8642304fb0cb68a8cb71fbd5e15d3c5bc4f86a9fa5`; avoids an optional manifest fetch in the opaque-origin profile and initializes only selected Toadal presentation.
3. `src/runtime/rendering/draw-characters-3.js`: source SHA-256 `dd41997be2f20b9677e186516eec5284268c48bf646714060f16476205067c00` → candidate SHA-256 `5938a34570aab5f20c183cddf0e2ce80054e84fac75faaf5c11e1be8006315c2`; removes eager Bob preload for this locked Toadal profile.
4. Added website-side preview bridge `wo003-arcade-preview-bridge.js`, 9,060 bytes, SHA-256 `7a039ce97bb0a22519d075331ddcab0b1a53eed4516478fecdea4cffe0451750`.
5. Added preview-surface CSS `wo003-arcade-preview.css`, 2,103 bytes, SHA-256 `b52a9f2dc8183f2a67d8d37f10fec29309f20961b80930461d194271878d9195`, and test-only `qualification-harness.html`, 4,577 bytes, SHA-256 `780c812cf1c7aedd1093b7b62dffc0b27ab620c0e51aa815b8984bc28babd193`.

No authoritative gameplay, physics, scoring, art, or mobile-source files were edited. The candidate does not modify the external source repository.

## 4. Package accounting — unresolved and blocking

Machine-readable evidence:

- `docs/review/WO-003/arcade-package/source-static-closure.json`
- `docs/review/WO-003/arcade-package/runtime-overlay-ledger.json`
- `docs/review/WO-003/arcade-package/runtime-qualification.json`
- `docs/review/WO-003/arcade-package/package-inventory.json`

Counts are source bytes (not compressed transfer sizes):

| Evidence scope | Files | Bytes | Notes |
|---|---:|---:|---|
| Conservative static-string closure | 359 | 20,232,319 | SHA ledger `dab5d495d58aec5f4241f077bb3de9af5d2b38c6cdccc82c30e082a451717b41`; 101 unresolved dynamic/static references |
| Runtime asset overlay | 107 | 12,882,746 | SHA ledger `1cf66d39f15e451ee64d15f7921b06ef33eb21b8c515b811d3e63a3eefdf3285` |
| Unique donor-source union | 398 | 28,843,732 | 68 paths overlap between the two ledgers (4,271,544 bytes) |
| Full audit directory | 401 | 28,859,472 | Donor union plus three harness/adapter files |

Qualification observed 214 unique local request paths (211 unique donor-package files plus the three harness/adapter files), 0 external requests, 0 failed resources/responses, 0 page errors, 0 unexpected console errors, and 0 downloads. The 211 donor files requested over the qualification workflow total 14,649,672 source bytes. The current candidate still contains 187 unrequested donor files totaling 14,194,060 bytes; 30 of the overlay files (4,548,170 bytes) were unrequested in that run. This does not prove every unrequested file is unreachable: some may be dynamically selected backgrounds or progression assets. Removing them safely has not been established.

The largest files in the audit candidate are recorded with size and SHA-256 in `package-inventory.json`. The leading items are the non-profile Fire character sheet (1,322,157 bytes), classic Arcade poster (1,184,719 bytes; its preload was removed but the file remains), Feast Frenzy mode art (611,201 bytes), and multiple alternate living-feast backgrounds around 0.37–0.47 MB. The complete top-20 list is in that JSON. The inventory reports three identical-content path pairs; it flags both generic UI copies of an apple/power-up and an Infinite friends pair. Static categories are recorded in the closure JSON; the audit-copy category totals are in `package-inventory.json`.

No Android/iOS project or native package was copied. The audit closure does contain unrelated Puzzle/Infinite references and other-character/alternate-mode assets; it also retains unresolved references and assets not requested by the selected-profile run. The earlier source-level estimate of 359 files was explicitly a lower bound, not a final sealed package. Therefore Sections 8–9 do **not** pass. Do not treat this audit directory as a production cartridge or copy it into a website route.

The inventory script is `scripts/wo003-package-inventory.mjs`. Its saved inventory contains a sorted all-file SHA-256 ledger; ledger input is sorted `path<TAB>bytes<TAB>sha256` rows with LF endings. Sorted ledger SHA-256: `649e54fa2c6a7b4cc44952314c8092b9c9d525ce160d4331fd8ddde1d9acf34d`. The JSON inventory SHA-256 at generation: `53BA81AC1A0A419D2EF95F054E312F749AE97AAADCB8CC836B0E12ECDF4624F6`.

## 5. Runtime, gameplay, browser, and security evidence

Environment used for the isolated qualification:

- Node `v22.23.2`; npm `10.9.8`.
- Python `3.7.4`; Playwright `1.35.0`.
- Chrome `154.0.8037.57` at `C:\Program Files\Google\Chrome\Application\chrome.exe`.
- Command: `& 'C:\Users\Metarator\.pyenv\pyenv-win\versions\3.7.4\python.exe' scripts/wo003-qualify-arcade.py --output docs/review/WO-003/arcade-package`.
- Result: exit code 0, **38/38 PASS**, zero failed checks.

Positive evidence includes cold launch into standard Arcade with canonical Toadal; menu/help interaction; scoring; keyboard movement/jump/tongue actions; six tongue-food catches and a peak score of 150 over a bounded 16.03-second run; pause/resume; visibility and focus recovery; host mute/unmute; restart; host-owned live exit; fullscreen enter/exit; error-channel probe; reload and close/reopen; phone/tablet touch; phone orientation resize; and desktop/tablet/phone overflow checks. The game stayed in level 1 and remained `playing`; it emitted no `game:complete`. Direct food catches, charged hops, Golden Block catches, and Golden Throw catches were zero in this run.

Viewport results: phone 390×844 portrait PASS; orientation resize to 844×390 PASS; tablet 768×1024 PASS; desktop 1366×768 PASS; large desktop 1920×1080 PASS. No horizontal overflow. Touch taps and joystick pointer movement were exercised. Audio mute/unmute and fullscreen entry/exit passed. This is an isolated harness result, not an integrated website-page or Home-shell regression.

Isolation contract and observed probes:

- iframe sandbox: `allow-scripts allow-pointer-lock`; no `allow-same-origin`, popups, forms, downloads, or top navigation. Fullscreen is explicitly requested by the host harness.
- Child origin was opaque (`null`). Host messages were checked against expected origin and exact frame source; a same-origin sibling spoof was rejected. For an opaque child, the harness targets the child with `*` and validates received messages on source/origin.
- `localStorage`, cookies, parent DOM, website storage, IndexedDB, and Service Worker access each raised `SecurityError`/were unavailable.
- Popup was blocked; top-level navigation was contained; no download event occurred.
- 214 unique local requests; no external network traffic; no required-resource failures. Three expected console errors were negative probes (blocked popup, blocked top navigation, deliberate error-channel injection); no unexpected console/page errors.
- No account/session bridge or account sync. The candidate shows “Best this session”; reload/close/reopen reset the score. This is the work-order’s opaque-origin/no-persistence option, but the existing preview profile currently says `localBestScore: true` and describes a namespace. That profile mismatch remains unresolved; persistence is not claimed.

The profile at `docs/implementation/WEB_ARCADE_PREVIEW_PROFILE.json` additionally requires a completed real run, Toadal mechanics verifier, Toadal browser witness, and mobile control contract/browser witness. The modified WO-003 cartridge has no evidence for those exact-cartridge acceptance items. Older donor/source evidence in `docs/implementation/ARCADE_PREVIEW_EVIDENCE_2026-09-30.md` records source-level PASS results, but is not commit-bound proof for this modified candidate. The present 16-second run proves real scoring and tongue catches, not run completion or the full listed Toadal mechanics. This is an additional qualification blocker.

For traceability, that older donor-level record names `npm.cmd run verify:toadal-arcade` (registry; frozen assets 13/13; mechanics contract; phase-3 22/22; adversarial 34 cases; regression 18/18), `npm.cmd run qa:browser:toadal-witness` (1/1), `npm.cmd run test:arcade-mobile-control-authority`, and `npm.cmd run qa:browser:arcade-mobile-control-authority`. These are not fresh results for the modified WO-003 cartridge. The authoritative source checkout is sparse (its working tree materializes only `assets/`); those scripts are in Git objects rather than the checkout, and were not run against this audit copy. No exact-candidate Toadal real-run completion result was found.

Evidence screenshots captured by the isolated harness: `arcade-running-desktop-1366x768.png`, `arcade-fullscreen-desktop.png`, and refreshed `arcade-running-mobile-390x844.png`. The mobile capture was visually checked after the delayed “Got it” coach was dismissed. Integrated Play/detail/Home screenshots were not captured because conditional integration did not begin.

## 6. Studio, site regression, route, and export disposition

This WO-003 result was held before Section 10. Studio and website tests were therefore **not rerun** against an unchanged website, and no WO-003 render/export/checkpoint was created. No `TOADAL_PROJECT` was set for an Arcade integration. The inherited WO-002 Studio project was:

`C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\toadal-feast-web-wo002-20260930\studio-project\toadal-feast-website\project.json`

Its accepted Studio 1.4.2 baseline (inherited, not rerun in WO-003) records inspect valid with 0 errors/0 warnings; `npm run validate` PASS; `npm run ai:doctor` 26/26; complete `npm test` 81/81, no skips; and `toadal.qa(level="full")` accessibility 9/9. The nested QA test invocation separately reported Windows `spawnSync npm.cmd EINVAL`; the direct complete `npm test` passed. The accepted WO-002 bridge/checkpoint and export are described in its report; they do not include Arcade.

Not rerun in WO-003 because no site integration occurred: Studio inspect/render/export/checkpoint; `toadal.qa`; `npm test`; WO-001/WO-002 contracts; static links; Pages/base-path rewriting; browser/player regressions; and fresh static ZIP verification. Counts from the accepted WO-002 report remain historical baseline evidence only, not WO-003 results. No claim is made that these checks passed for an Arcade-integrated site.

The CP9 compatibility contract names `/play/wicked-bites/game/`. The accepted WO-002 player route is `/player/wicked-bites/`; the legacy alias is not established. This route compatibility gate is **not resolved or tested in WO-003**; if a future work order passes Arcade package gates and integrates, add/preserve a deterministic base-path-safe alias and verify it then. No compatibility mutation is included in this HOLD.

No new static file count/bytes/ZIP SHA are applicable: a fresh WO-003 website export was intentionally not produced. The last accepted ZIP remains the WO-002 artifact in Section 1. CLAW remains launch-held and the accepted website’s PUBLIC browser-game count remains zero.

## 7. Release boundary, unchanged state, and final disposition

- Tracked `dist/` is unchanged; there are no WO-003 diffs under `dist/`.
- The accepted WO-002 branch and website `main` were not edited. All WO-003 work is on the dedicated branch and within WO-003 evidence/scripts/audit-copy scope.
- The authoritative mobile/game source checkout remained clean on `main` at commit `6daedca1eb6aa5c953e53a538561e9c42ff9cb3c`; no Android/iOS source or packaging was edited.
- No GitHub Pages deployment, production release, DNS/configuration change, or push occurred.
- No Studio build/history state was generated by this WO-003 turn or added to Git. The candidate is under the audit/reference tree, outside published routes.
- **STAGING INDEXING POLICY — OPEN RELEASE GATE.** No production deployment is authorized. Before any crawler-accessible public staging, require host access control or `noindex,nofollow` across the entire staging export, including every standalone cartridge HTML file; production must not accidentally inherit staging noindex.
- Local WO-003 commit and bundle details are recorded in the post-commit receipt at `C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\wo003-final-20260930\WO003_FINAL_RECEIPT.md`. That receipt is generated after the commit so its commit/bundle identities are not self-referential. The branch must be clean after commit. No push is required or authorized by this work order.

**Final qualification: ARCADE HOLD.** Do not authorize WO-001/another website integration step from this evidence. A future, separately authorized continuation must first resolve the profile persistence choice, run exact-candidate Toadal mechanics/browser/mobile witnesses and a completed real Toadal run, close the unresolved runtime references, and produce a smallest-faithful package with a complete persisted provenance/size ledger. Only after those pass should it consider the conditional route integration, Wicked Bites compatibility alias, site regressions, fresh export, and integrated screenshots.
