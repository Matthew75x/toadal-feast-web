# Website audit and obvious fixes — 2026-10-05

The audit covered all 33 current website routes at 320px phone and 1440px desktop widths, plus focused interaction/failure-state checks. The source is the native Studio project. This advances current website behavior and does not upgrade the full product manifest or invent missing services/content.

| Confirmed issue | Implemented correction |
| --- | --- |
| Manga artwork/caption clipped outside a 320px screen | Bound the existing native artwork figure to its grid width. |
| Leaderboards select clipped; controls were unstyled and 23px tall | Group each native label/select into an editable field; use contained responsive 48px selects and a stacked phone heading. |
| Search index failure turned into false no-results after input/filter/suggestion actions | Preserve loading/ready/unavailable state; genuine no-results remains distinct. |
| Account stayed on Checking indefinitely on healthy storage | Native initial status now states current browser-local/no-sync behavior; runtime warnings still replace it when needed. |
| Open Leaderboards retained stale best/table after another tab saved or reset scores | Coalesce read-only repaints after existing guest storage/focus/visibility/cache-return handlers rehydrate state. Guest runtime and score admission remain unchanged by this audit. |
| Automatic docked Toadal tip covered hero text and interactive FAQ summaries | Protect hero text and native summaries; defer only passive minimized tips when no control-free rectangle exists, then restore them. Explicit expansion/manual placement and persisted preferences remain. |
| Play filters, reader controls and character-filter labels had small phone targets | Minimum 44px targets; native labels remain the hit area for radios/checkboxes. |
| Play implied builds existed for concept-only listings; repeated/technical empty-state copy | Clarified concepts versus playable previews and simplified Media, Stories, App and Contact copy without inventing releases, chapters, stores or endpoints. |

The branch began at staging 5cba988 and integrates newer staging 51e91da (Feast Pass sourced game records, PR #19) before publication. The guest reset, open-view refresh, new Feast Pass read model, accepted assets, routes, native game payloads and Studio source editability are retained.

Final combined source was exported through the existing pinned Studio export API. Source validation, 33-route source/output freshness, Pages base path, static links and staging robots pass; all three protected game artifacts match and authored input is unchanged during export. Final qualification passes 126 source/runtime tests, 66 route/width audit cases with no clipping, broken images/fragments, duplicate IDs, unnamed controls or runtime exceptions, 11 focused browser cases, five real two-tab score cases, six companion-tip cases and five existing mobile hide/drag/dock/fullscreen cases. Phone checks are Chromium emulation, with actual touch events where noted; they are not physical-device certification.

The audit's changes remain native source objects, existing website adapters and scoped CSS. Reader's changed Stories runtime reference binds exact canonical-LF bytes; validation was not relaxed. The new regression/browser scripts address reproduced failures. Supporting reports and export receipt are alongside this record. Publication is verified separately on the PR/deployment receipt.
