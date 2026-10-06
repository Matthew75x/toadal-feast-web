# Core website finishing pass — 2026-10-05

This continuation advances the Support FAQ/discovery requirement, the News editorial filter/publication-state requirement, and shared core-page visual consistency. It starts from current staging `02569d8f177e0e82ca232e4121a6802c5e0eed95`, retaining the owner-authoring lineage, the previous core-page visual completion, mobile controls and the newer verified guest-reset repair.

Support now has six native, editable FAQ disclosures. Questions remain headings inside keyboard-operable summaries; answers and destination links remain native Studio objects. Search opens matching answers and restores prior reader disclosure choices when cleared. Topic links clear an incompatible search, reveal/open their destination and retain normal fragment navigation. Keyboard activation focuses the summary after the browser completes its native fragment jump. Direct and history fragments also reveal the topic. No new support service or contact endpoint is implied.

News now shows and announces one empty/result status. An unpublished library retains the authored publication message; a published library with no filter matches has a distinct actionable explanation. Five category buttons are editable native source objects whose labels and order survive adapter initialization. Reinitialization removes old listeners before binding new ones. No articles or publication records were invented.

Play journey-card headings and the separate App donor-module headings use the established display family. Body and controls retain the existing UI sans. Mobile navigation links and search suggestion controls meet the existing 44px touch-target convention. Final font selection remains the existing owner-authority TBD; no new font selection or artwork is introduced.

The final static candidate was regenerated with the pinned Studio export API. Studio source validation has no warnings, all 33 registered routes pass source/output freshness, base-path/links/staging-robots checks pass, and all three protected game artifacts match. Export leaves authored inputs unchanged. The checked-in output changes only the shared CSS, two website adapters and News/Support HTML.

Qualification: 74 affected source/runtime checks, eight actual exported-page browser cases (Support at 320/390/1440, News at 390/1440, Play/App/Media at 390) and five existing mobile touch/dock/fullscreen cases all pass. The checks cover native keyboard disclosure, search-state restore, hidden-target navigation, one News empty message, preserved native category objects, heading fonts and Media filtering. These support this bounded implementation; they do not assert overall 30-page product acceptance.

Re-export using `node --no-warnings --experimental-strip-types scripts/export-staging-candidate.mjs <PINNED_STUDIO_ROOT>`. The export receipt and compact browser/mobile reports are alongside this record. Publication is verified separately from local qualification.
