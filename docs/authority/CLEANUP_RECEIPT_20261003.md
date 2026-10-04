# Website Cleanup Receipt — 2026-10-03

## Pull requests

Archived and closed:
- #1 QR attribution/campaign routing scaffold
- #10 web Arcade sampler product profile

Archive pointers:
- `archive/qr-routing-scaffold-3371afa-20261003`
- `archive/web-arcade-profile-c7a4632-20261003`

Original draft head branches were deleted after the archive pointers were created.

Current open web PR count: **0**.

Merged authority-document PRs:
- #12 — current website authority consolidation
- #13 — default-branch README authority pointer

Their merged documentation head refs are delete-safe once the normal branch-deletion path is available; they are not active website authority.

## Current website authority archive

Created:

`archive/owner-native-authority-20261003`

This preserves the current owner-native lineage before branch cleanup.

## Fully merged branch deletion

A remote ancestry audit identified branches whose heads were already fully reachable from the preserved owner-native authority.

Deleted after recording exact branch/SHA/date manifest:

**31 remote branches**

Manifest retained on ASSIGNATOR:

`E:\.codex\workspace-control\WEB_MERGED_BRANCH_DELETE_CANDIDATES_20261003.json`

Deleted branches included superseded integration, owner-preview, manifest, Stories, visual-convergence, authority-consolidation, and work-order branches.

No active owner-native, staging, main, archive, or backup branch was deleted.

## Current branch count

Later informational branch snapshot after authority-doc merges:

**58**

This count is informational and can move as active work/merged documentation refs change. It remains substantially lower than before the cleanup pass.

Remaining branches are intentionally left for a second disposition pass because some are divergent historical design/planning/QA lines rather than simple ancestors of current authority.

## Current control documents

Current concise website control:
- `docs/authority/CURRENT_STATE_20261003.md`
- `docs/authority/WEB_BRANCH_HYGIENE_20261003.md`

Updated:
- `docs/authority/WEB_PRODUCT_AUTHORITY.md` now points to current state.
- `TOADAL_STUDIO_LIVE_STATE_20261002.md` is explicitly marked as a historical chronology rather than current-state authority.

## Safety result

No production/staging deployment was performed.
No owner-native source authority was rewritten.
No unique archive/backup branch was removed.
