# WO-003 Continuation Result — 2026-09-30

## Final disposition

**ARCADE HOLD** — the conditional website integration gate did not pass. No website route, WO-002 product source, production `dist/`, deployment, or mobile/release source was changed. WO-004 is not started. The accepted starting audit commit is `b1f2cd6f52e16c6e80f76e313386156373fee94b` on `work/WO-003-arcade-isolation-20260930`; the donor remains pinned to `6daedca1eb6aa5c953e53a538561e9c42ff9cb3c`.

The live candidate stayed isolated at `studio-project/toadal-feast-website/reference/audit/arcade-standard-6daedca1`. It was not integrated or presented as the full game.

## Work completed in this continuation

- Preserved the host-owned preview state under `toadal:game:toadal-feast-arcade-preview:v1:state` while retaining an opaque-origin iframe (`sandbox="allow-scripts allow-pointer-lock"`, fullscreen permission; no `allow-same-origin`). Smoke21 verified origin `null`, child storage denial, the namespaced host fields, and state survival across reload. This only proves reload persistence; browser close/reopen and progression persistence remain unqualified.
- Corrected the test probe to read Zen pacing from `GAME_BALANCE.zen` and to capture actual FMF setup/tick functions. The candidate reported Zen speed `0.58`, spawn interval `1.60`, and FMF's 300-second initialization with a decreasing runtime clock.
- Added ten Chomper/Princess runtime images directly from the pinned donor blobs after runtime requests exposed them. Their combined size is 7,357,438 bytes; all ten candidate Git blob IDs match the donor. See [profile-asset-additions.json](profile-asset-additions.json). This delta is not a final package inventory.
- Traced the earlier ORB noise to the local Python 3.7.4 server being unable to serve several assets through the checkout's long Windows path. A short temporary junction to the same candidate returned HTTP 200 for representative previously failing assets. The post-fix SMOKE19 pass recorded zero failed requests, zero external requests, and zero page errors for the exercised Toadal/FMF/Zen profiles. The junction changed no candidate bytes.
- Added a bounded qualification runner and strengthened its Standard completion gate: a natural completion must follow at least 60 seconds of active play unless the run progresses beyond level 1. This avoids repeating the false qualification of the explicitly rejected ~16-second level-1 smoke.

## Runtime evidence and qualification gaps

The latest concise candidate report is [smoke21-headed/runtime-qualification.json](smoke21-headed/runtime-qualification.json): 19 checks, 8 failed. The opaque-origin, host persistence/reload, FMF/Chomper, Zen/Princess, and no-external-network checks passed. FMF/Zen produced live scores (80 and 33 in this run); Princess used the current approved `lilly_*` sprite family, and Zen tuning was `0.58`/`1.60`. Two console 404 messages were both the local harness's missing `/favicon.ico`; there were zero uncaught page errors and zero failed runtime requests in that report.

The bounded longer attempt is [smoke20-headed-145s/runtime-qualification.json](smoke20-headed-145s/runtime-qualification.json). Despite a 145-second requested active window, Standard naturally ended after **14.31 seconds active / 14.35 seconds elapsed** at **score 173, level 1, lives 0** (three lives lost; end cause `miss`). It recorded six tongue catches, zero direct-body catches, one charged hop, and zero Golden Throw/Block charge spends or food catches. The host recorded one completed Standard run, best score 173, and unlocked Classic; the state survived reload. That score/completion is not enough to qualify gameplay: the short level-1 result is materially the same class as the previous rejected ~16-second witness. The tightened smoke21 gate correctly rejects it. The runner also had intermittent sustained `blur`/`document.hasFocus() === false` lifecycle pauses; a headed FMF/Zen run played and scored, but the Standard session did not provide a stable 2–4-minute witness.

Standard/Classic launch was reached after the real first-run unlock in smoke20, but it is not qualified: it requested three absent Classic images (`walk_12f.png`, `catch_open_10f.png`, `idle_blink_16f_256.png`). Gully/Pelican was not reached; after one run at 173, it correctly remained locked under the configured `>=600` best-score or three-completed-run rule. Current-candidate realistic touch/mobile behavior (drag, simultaneous action, cancellation, portrait/landscape), full pause/resume/restart/fullscreen/exit behavior across modes, and message-spoof rejection were not qualified. The earlier 38/38 result predates this candidate and is supporting history only.

A separate static host/bridge review found an additional **local progression-integrity blocker**: the host authenticates the iframe `WindowProxy` and opaque `"null"` origin, but does not bind `game:started`/`game:complete` to a host-pending start or run-specific capability. If the document in that same frame is replaced, it can still post through the same browsing context and potentially advance only the preview's local completion/unlock counters. The reviewer did not execute an exploit. No mobile-save access was found. This is not parent-DOM access, but it needs a navigation/message-integrity fix and a negative runtime witness before integration.

The recent short-run records and diagnostics are preserved in the `smoke14`, `smoke16`, `smoke17`, `smoke18-headed`, `smoke19-headed`, `smoke20-headed-145s`, and `smoke21-headed` directories. Earlier smoke attempts are exploratory and are not counted as passes.

## Static/runtime closure classification

The pinned source static closure report has **101 unresolved entries**. Exact Git-tree classification gives:

| Class | Entries |
|---|---:|
| Directory references (21 references, 20 distinct targets) | 21 |
| Template expressions | 6 |
| Wildcard (`themes/source/*.theme.json`) | 1 |
| Unresolved fixed-file literals | 73 |
| **Total** | **101** |

The 73 fixed-file literals are not 73 missing required runtime files. Three Golden tongue-rig files are conditionally runtime-reachable and relevant to the requested Golden mechanic witnesses, but no blob exists at those paths in the pinned donor commit: `golden_shaft.png`, `golden_stages.png`, and `golden_tip.png`. Two unresolved music files (`menu.ogg`, `arcade.ogg`) are marked optional by the audio manager. The other 68 are off-scope/optional mode audio, other-character rig sources, example theme data, master/source artwork, or unrelated mode/food references; they are not evidence that those files must ship.

The host-alias transport correction removed the long-path false positives for the current tested profiles, but package closure is still open. In addition to the ten exact-source additions above, the donor-present approved profile families are incomplete in the candidate: five Classic images, twelve Gully files, the Chomper manifest, six Princess animation/manifest files, and the Princess runtime-select image are absent. Smoke20's three Classic asset failures are direct runtime evidence. Gully has not been exercised. No smallest-faithful runtime package was sealed; no final package file count, byte total, per-file SHA ledger, entry hash, or package-manifest hash is claimed.

## Integration and safety decision

Sections 3–8 have not passed together: meaningful Standard play/mechanics remain unproven, mobile input is untested on these exact bytes, Classic/Gully/Chomper/Princess asset coverage and complete reachability are open, and the package is not sealed. The local progression-integrity issue is also unresolved and the spoof probe is untested. Therefore Section 9's condition is false. No Arcade sampler was added to the accepted WO-002 site; Wicked Bites compatibility checks, website regression checks, and a fresh Studio export were not run because integration was not authorized. No Pages workflow, deployment, merge to `main`, DNS action, mobile-release-source change, or production operation occurred. Tracked `dist/` was not changed.

**WO-001 / conditional website integration remains blocked by this WO-003 HOLD.**
