# Actionable website quest journey

## Implemented scope

This increment completes the existing local quest navigation/claim presentation loop. It adds All / Active / Ready to claim / Claimed views to Quests, with counts, category labels, valid activity links and persistent URL filter selection. Feast Pass has a native Studio-authored Your next step card derived from the current configured quests and existing browser-local state.

Next-step order is ready rewards, reachable incomplete exploration activities, the existing daily control, then an honest all-current-activities-claimed/configuration-empty state with a catalogue link. Opening an activity or the ready-rewards view does not claim rewards. World and Stories visits retain route-visit semantics; a Stories visit is not chapter reading. Treat collection still uses the existing Home candies and Golden Block. Daily remains one configured UTC-day claim, not a second quest payout.

The existing store, four storage keys, reward amounts, targets, quest IDs and claim functions are unchanged. Destination metadata was added only to the already-existing Treat quest. The projection is read-only. Claims call the existing store and report the operation result after rendering; failed persistence is not announced as success. Future/unreadable data produces unavailable states rather than false empty counts. Page-only memory is not advertised as a persistent multi-page journey. Reset/cross-tab refresh and unrelated game records retain their existing boundaries.

Quest cards use stable DOM nodes so normal refresh preserves controls; a claim that leaves its active filter returns focus to a visible filter button. Native page objects preserve owner editing of the containers, headings and navigation. There is no new backend, economy, game-result admission or account synchronization.

## Source and preservation

Starting staging: `c45db8167a85d71f49c6f29dea7ffc0907c5e2c5`, including website PRs 15?20. No other worker checkout, game source, TCS/Publisher, DNS or production toadalfeast.com state is edited. The final static output is generated through the existing pinned Studio export command, not hand-edited.

Visual inspection of the first browser pass caught an automatic mobile companion tip over a new quest heading. A one-selector compatibility extension includes the complete `.quest-board` (including its explanatory note) and `.quest-next` in the existing automatic mobile tip avoidance/suppression path. Manual positioning, minimized/drag persistence, artwork and other placement logic are unchanged.

## Before/after evidence and reproduction

The baseline exported Quests page exposed only the daily-check-in link, zero status filters, and Feast Pass had zero next-step cards. Baseline runtime SHA-256: `786a38d3008b637660fffc58efc9eac103fa224426a85ae53284a8c8f2546ef7`.

Working-source checks: 122 focused cases pass (36 new quest cases plus existing progression/reset/refresh/game-record/search/leaderboard checks). The initial six actual browser journeys passed before the small companion selector extension; their screenshots are retained as pre-final evidence. Exact committed-source tests/export/browser results are recorded separately in the PR closeout, not inherited from that first pass.

```text
node --test scripts/guest-progression.test.mjs scripts/guest-reset-recovery.test.mjs scripts/guest-progress-refresh.test.mjs scripts/feast-pass-game-records.test.mjs scripts/quest-journey.test.mjs scripts/leaderboard-refresh.test.mjs scripts/site-search-state.test.mjs
node scripts/quest-journey-browser.mjs <REPORT_DIRECTORY>
node --no-warnings --experimental-strip-types scripts/export-staging-candidate.mjs <PINNED_STUDIO_ROOT> --verify-only
```

`PLAYWRIGHT_MODULE` and `CHROME_PATH` can select existing installed browser tooling. The runner owns temporary contexts and an ephemeral loopback server, and closes both. It covers desktop/390px/320px actual page journeys, reward claims, all Home Treat controls, reload, filters, keyboard focus, companion intersection, cross-tab reset and controlled persistence failures. Phone dimensions are Chromium emulation, not physical-device acceptance. No native or cartridge game is launched.

Delivery target is established GitHub Pages staging only. A merged PR or passing test is not by itself a deployment claim; exact live readback belongs in the separate closure receipt.
