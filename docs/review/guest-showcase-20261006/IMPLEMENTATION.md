# Guest-local reward showcase

Profile and Rewards now complete the existing claim, display or hide, and reload journey for website-local badges and titles. This is not the native FEAST TITLES system, an account/public profile or a new reward economy.

## Implementation

Both pages contain Studio-native Your showcase sections with labelled selects, explicit Save badge / Save title controls, current selections, earned-only options and clear storage feedback. No badge/title displayed removes only the selected field, not the earned reward. Existing first-title auto-selection remains unchanged. No reward definitions, thresholds, amounts, schema versions or storage keys changed.

Selection rereads the existing pass/profile records, checks claimed IDs, marker ownership and timestamps against the current configuration, and writes only the selected field and updatedAt in the raw profile object. Unknown same-schema fields, scores and the other stored records are preserved. Unknown saved selections are not rendered as earned markers and can be removed without deleting rewards.

Malformed/future ownership data is unavailable, not an empty collection. Failed or silent writes cannot claim successful persistence. Prewrite comparison detects observed intervening changes, and postwrite readback verifies the saved bytes. These are best-effort stale-state checks, not atomic cross-tab localStorage transactions or tamper-proof achievements. There is no rollback over another tab's newer write or reset.

The static controls retain their nodes and valid unsaved choices during unrelated read-only refresh. External changes/reset refresh their selections without adding writes. Profile's existing title statistic uses the same ownership-aware projection. Reward-claim feedback follows rendering so a failed save is not hidden by generic status copy.

Source changes are limited to the existing guest progression runtime, native Profile/Rewards records, scoped styling, Home resource pin, generated Studio export and the existing Pages regression command. Companion behavior, protected games, catalogue access, quest/reward definitions, native source, production/DNS, providers, accounts and telemetry remain unchanged.

## Reproduce focused checks

    node --test scripts/guest-showcase.test.mjs
    node --test scripts/guest-progression.test.mjs scripts/guest-reset-recovery.test.mjs scripts/guest-progress-refresh.test.mjs scripts/feast-pass-game-records.test.mjs scripts/quest-journey.test.mjs scripts/leaderboard-refresh.test.mjs scripts/site-search-state.test.mjs scripts/guest-showcase.test.mjs
    node scripts/guest-showcase-browser.mjs REPORT_DIRECTORY

Export/reproducibility uses scripts/export-staging-candidate.mjs with the existing pinned Studio checkout and --verify-only. Browser checks use the installed Playwright/Chrome through PLAYWRIGHT_MODULE and CHROME_PATH; SHOWCASE_TEST_TIMEOUT_MS is bounded to 20–60 seconds. The runner closes its own contexts and loopback server normally.

Ten browser cases cover actual reward claims, desktop/390px/320px selection, keyboard saving, reload, two-tab updates/reset, denied and silent writes, unreadable/future profiles, unknown saved titles and unavailable browser storage. The title case advances an injected clock through twenty existing 5-XP daily controls to reach the unchanged level-two threshold; this is accelerated functional evidence, not twenty real days or physical-device acceptance. Score/failure fixtures are controlled inputs. No game is launched.

## Delivery scope

Selected base: staging/live-visual at 22b1e5aca53ccdd6122f6aedb876dd1a57656f84, retaining website PRs 15–21. Baseline browser inspection observed no showcase panels and no selection method in the old exported runtime. Exact committed-source results, Studio equality, merge/deployment and independent live hashes are recorded in the PR closure, not assumed here. This increment targets the established GitHub Pages staging site only.
