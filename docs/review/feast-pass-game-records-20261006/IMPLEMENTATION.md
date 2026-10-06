# Feast Pass: source-labelled game records

## Implemented capability

The Feast Pass landing page now has an owner-editable **Your games** section. It connects the existing website-local game score record to the central visitor journey without importing native game saves, awarding progression or declaring a cartridge qualified.

Four native Studio cards reuse the current public catalogue identities: Wicked Bites, CLAW: Feed Gulper, Froggy Fruity Bash and TOADAL Tower Defense. Names, descriptions and next-action links remain native component fields, not injected raw HTML. Unavailable feeds have explicit unsupported states and link only to existing information pages; the cards do not grant launch capability. The nonpublic native Arcade candidate is not added to public discovery.

Wicked Bites reads `profile.localScores['wicked-bites']` through the existing guest store. It shows personal best within this browser record, latest result, bounded recent-result count and recording timestamp in UTC. A recorded zero is zero; absent, corrupt, unreadable or future data is not a zero score or 0% completion. The existing records do not carry authoritative build provenance, so no current-build result is asserted. Client-reported scores are not verified accomplishments, global ranks or reward instructions.

`gameRecordView()` is a pure read model. `renderGameRecords()` updates only native text slots and read-state attributes. It never starts a game session, writes storage, grants XP/Sparks/Treats or infers completion. Non-persisted store metadata adds read-only key identities and browser/page-only scope; persisted keys and schemas are unchanged. Unreadable profile data withholds game metrics; a valid read restores the actual saved values.

Existing storage/focus/page-return refresh updates the cards without replacing their nodes or links. Reset removes the read model without recreating records. Memory-only state makes no persistence promise. The recent list retains at most 50 records, not lifetime plays. Independent games are not summed into one completion percentage.

## Scope boundaries

This is the **website-local game-record presentation** increment, not completion of the full game-to-Feast-Pass programme. Native FEAST BOOK/FINISH/Titles import, account reconciliation, TCS positive qualification, public cartridge activation and physical-device acceptance remain separate. The older bridge-contract branch provides schema guidance, not a live importer to replace.

No game payload, catalogue status, other-game save, private account, Publisher/TCS system, production DNS, analytics or spending configuration is modified. Existing website improvements are retained. `dist` is generated through the pinned Studio exporter, never hand-edited.

## Verification

The selected base contains no `data-game-record` cards in Feast Pass; this feature adds four. Focused tests cover missing versus zero results, best versus latest, the 50-result limit, data isolation, unknown IDs, read failure/recovery, future/corrupt state preservation, memory-only state, reset, pure rendering and native catalogue/route consistency.

```text
node --test scripts/guest-progression.test.mjs scripts/guest-reset-recovery.test.mjs scripts/guest-progress-refresh.test.mjs scripts/feast-pass-game-records.test.mjs
node scripts/feast-pass-game-records-browser.mjs <REPORT_DIRECTORY>
```

The browser script can use installed tooling selected by `PLAYWRIGHT_MODULE` and `CHROME_PATH`. It starts an ephemeral loopback server, blocks external requests, opens new contexts and closes them afterward. Journeys use actual exported Feast Pass/Profile pages, current information/history links, cross-tab refresh, actual reload and reset. They verify no additional writes from the receiving page, stable card/link identity and no horizontal overflow.

Score inputs use the existing store API as **controlled fixtures**; read denial and future schemas are deliberately injected. Phone sizes are desktop Chromium emulation. No new real-game witness, physical-device qualification or release approval is claimed.

The Pages workflow includes the new focused tests. Studio validation, exact resource pins, public projection, base-path/link/robots checks and protected game-file verification remain required. The PR closeout binds final results, fresh-checkout export, screenshots and delivery status to the exact commit; tests alone do not establish deployment.
