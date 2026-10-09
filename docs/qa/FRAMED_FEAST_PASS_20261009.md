# Framed Feast Pass successor

Local candidate based on PR38 head `96a0414f85800ab348e0ae45ed25c6a195566847`. PR38 is unchanged; no merge or deployment.

## Scope

Home and `/feast-pass/` use a matching navy/gold/cyan frame with the approved Astro title-frame image and TOADAL v2 lettering. Existing semantic headings, every existing component ID, metrics, local storage runtime, claims, reset and navigation are retained. No sharing service, reward rules, account sync, header/crown or game artifact changes.

## Editable source

- Headings remain unlocked native `core.text`: Copy, base text size and mobile typography are ordinary Studio controls.
- The title frame is unlocked native `core.image`: Replace image, fit, focal point and responsive image controls remain available.
- The title container is native `layout.container`: padding, layout width/max width and responsive layout controls remain available.
- The decorative canvas is created only by the existing supported website `advanced-code` runtime extension. It never owns source text or progress values. No SDK/editor changes, raw HTML editing, guard bypass or second lettering renderer.
- The rainbow/gloss/outline preset and outer card CSS are project code, not newly invented no-code controls. Native text color/font choices describe the semantic fallback; the enhanced lettering uses the fixed packaged alphabet/preset. Strings over 32 characters or outside the bounded alphabet use visible native text.
- The semantic text stays selectable. The canvas is aria-hidden and pointer-transparent. Failed font loading, failed paint and hidden geometry preserve visible fallback; a loaded expected FontFace and successful renderer return are required. Delayed paints use current settings.

## Provenance

- Lettering: owner-approved `TOADAL_Lettering_v2.0.0.zip`, SHA256 `02c9d4630788ef716b3edd48b7da7fb915d103a7d5d044aec2d6528d859553ce`.
- Exact standalone runtime SHA256 `7188d0199bcb2c4e37d46254059f1d7b759b183e2088f7df83bc5bd44eb4721b`; NOTICE and Lilita One OFL redistributed. Full donor HUD HTML was not imported.
- Frame: website commit `c912c44a7333e143761fc3a1617da64adb07e633`, `services/share-cards/assets/astro-score-frame.png`; managed asset catalog carries provenance. Donor HUD JSON/source and frame pixels were reviewed; flattened donor lettering was not used.

## Proof so far

- Native validation and canonical source/export freshness pass; base-path, static links and staging robots pass.
- Protected game artifact hashes pass. Progression runtime, definitions and navigation are byte-identical to baseline.
- All 60 focused framed-Pass/state/protected/projection tests pass. The six new tests cover exact provenance, editable native structure, fallback/failure and delayed-current-text behavior.
- Actual Studio UI on a disposable project: heading changed to `My Feast Pass`, base32/mobile24; saved, reloaded and reopened with exact values. Frame changed to an existing approved image, contain/focal37; saved/reloaded. Container padding23/max480 saved/reloaded. UI Export Website produced a valid ZIP containing those exact changes plus runtime/licenses. These witness values are absent from candidate source.
- Full repository test suite has seven existing failures also reproduced from exact baseline: Media fixture, Contact fixture, registered-runtime fixtures (two), freshness fixture and historical renderer dependency tests (two). The baseline archive additionally lacks history needed by its Gully check; that check passes in the actual successor worktree.

## Independent browser acceptance: conditional

PASS: actual frame/lettering on Home and full Pass at desktop1180×757 and exact390×505/320×432 CSS widths; no horizontal overflow. Ordinary browser resize/zoom was used, not device emulation. Native semantic headings remain accessible; canvases are decorative. Actual existing check-in changed Home to Level1/XP5/Sparks1/Treats0/next95, matching full page and reload. Existing reset returned both to1/0/0/0/next100. Enter/Space show/hide, hidden-state reload, hidden-summary progress update and visible focus passed.

A full-page native fallback contrast specificity issue was found and fixed. Final independent desktop check confirms cream native fallback color, transparent enhanced text-fill and a visible canvas. The final change was a color rule only; all prior HTML differences are the derived CSS hash reference. Exact narrow journeys were not repeated after that color-only correction.

PASS, supplemental disposable fixtures: a separate copied-export origin with visible controls seeded large values (Level12345678902, XP1234567890123, Sparks9876543210123), a long native heading and long XP labels. Home/full at desktop and exact320/390 CSS widths wrapped without horizontal overflow, preserved route/reload values, and displayed cream native fallback with hidden canvas for long text. The existing reset preserved a seeded unrelated synthetic game record and preference. Fixture cleanup was verified. Production source/runtime and real user storage were not altered.

OPEN: runtime reduced-motion media-state verification. Supported evaluator is read-only; native DevTools was explicitly organization-blocked. The ordinary XFCE Accessibility app was inspected and exposes no reduced-motion control. No setting changed and no bypass was attempted. Source reduced-motion CSS and fixed bounce0 are evidence, not a runtime media-state PASS.

The floating companion can overlap narrow header/copy in both unchanged baseline and candidate. It was not changed in this bounded task. No complete zero-console-error, physical-device, touch, mobile-browser or release qualification claim.

### Screenshots and edit proof

Evidence is under [evidence/framed-feast-pass-20261009](../../evidence/framed-feast-pass-20261009/):
- Home: [before desktop](../../evidence/framed-feast-pass-20261009/baseline-home-desktop.jpg), [after desktop](../../evidence/framed-feast-pass-20261009/candidate-home-desktop-frame.jpg)
- Full Pass: [before desktop](../../evidence/framed-feast-pass-20261009/baseline-full-desktop.jpg), [final after desktop](../../evidence/framed-feast-pass-20261009/candidate-full-desktop-final.jpg)
- Exact320/390 before/after images are named by route and CSS width in that same directory; extra metric scroll positions are included.
- Native editor reopened heading/frame/layout screenshots, UI export proof JSON, large/long fixture screenshots, reset-preservation/cleanup evidence and the accessibility-settings limitation are included.

Studio editor save/reload/export is proved, but its embedded preview has the prior client resource-loading limitation; source/export evidence is not substituted for preview pixel acceptance. Node24 is reproduction-only, not required Node22 qualification. No full-engine certification is claimed.
