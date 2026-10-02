# Studio 1.4.2 graph reference accounting

The final bridge report contains exactly four identical dangling edges: `component.home.games -> game.card`, kind `uses-game`. These are unchanged Studio graph-classification false positives, not broken game IDs.

Studio's `packages/reference-graph/src/graph.ts:3` recursively scans every string in component props, classifying any string beginning `game.` as an entity reference. Each of the four Home card records has the component discriminator `type: game.card`; the scanner therefore incorrectly treats that type name as a game ID. The actual `props.gameId` values are separately emitted and all resolve:

| Occurrence | Nested Home card | Actual registered game ID | Status |
|---|---|---|---|
| 1 | Wicked Bites | `game.wicked-bites` | Resolved; card and detail route verified |
| 2 | TOADAL Tower Defense | `game.toadal-tower-defense` | Resolved; truthful preview card and detail route verified |
| 3 | Froggy Fruity Bash | `game.froggy-fruity-bash` | Resolved; truthful preview card and detail route verified |
| 4 | CLAW: Feed Gulper | `game.claw-feed-gulper` | Resolved; held preview remains held |

Evidence: `pages/home.json` four nested records; registered `games/index.json`; final `studio-flow.json` (172 nodes, 111 edges, four dangling type strings), navigation/static-link verifiers and complete 83-case browser matrix. No Studio source or game records were patched to silence this diagnostic. No other dangling edges are present.
