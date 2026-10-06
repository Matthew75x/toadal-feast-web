# Website branch snapshot — 2026-10-06

This is an informational hygiene snapshot, not a deletion authorization.

Immediately before the additive documentation/tooling lane `docs/cartridge-hardening-standard-v1-20261006` was created, GitHub reported:

- remote branches returned: **74**
- open pull requests: **0**
- `main`: `9ce82e1188eb1c28fb79f3b4cef5bfdab1cbf75a`
- `staging/live-visual`: `939f0d8a751d8fc1b1362796a0204c23c9eb7a09`
- owner-authoring: `164491d847fd4c21d737e86ae5bba2aa5abf8283`

Relevant October 6 retained work heads observed at that checkpoint included:

- `work/feast-pass-game-records-20261006` — `4a67275e7ac18bfc4cbf50ced7f1f80e6d00b886`
- `work/guest-showcase-20261006` — `fdf4308897a25bfb83236414ee9b3afa63622b79`
- `work/play-catalogue-20261006` — `d5ec3136f6544025abd7e046b91b512cc0a139c0`
- `work/staging-artifact-closure-20261006` — `b2a0a3ff860c9106d2d4675256d7025b21b08da7`
- `work/toadal-nav-visibility-20261006` — `fa24f0070a8354d9740fed04904ea7c8a781eaa6`

No branch in this list is authorized for deletion merely because its corresponding change reached staging. A later hygiene pass should classify each branch as MERGED, SUPERSEDED, ARCHIVED, or RETAINED, verify unique commits/evidence, and only then delete safe refs.

The current docs/tooling branch is temporary and should be deleted after merge or otherwise explicitly disposed.


## Ancestry-verified merged candidates

A direct compare against staging `939f0d8a751d8fc1b1362796a0204c23c9eb7a09` shows each branch below is fully reachable from staging: staging is ahead and the branch is **0 commits ahead of staging**.

| Branch | Staging commits ahead | Branch commits ahead |
|---|---:|---:|
| `work/feast-pass-game-records-20261006` | 18 | 0 |
| `work/guest-showcase-20261006` | 8 | 0 |
| `work/play-catalogue-20261006` | 6 | 0 |
| `work/quest-journey-20261006` | 10 | 0 |
| `work/staging-artifact-closure-20261006` | 3 | 0 |
| `work/toadal-nav-visibility-20261006` | 1 | 0 |

These are **merge-safe deletion candidates by ancestry only**. They are not deleted in this lane because an active progression-contract operation is still in flight and may reference one of these names/worktrees operationally. Delete only after confirming the active lane no longer depends on them.
