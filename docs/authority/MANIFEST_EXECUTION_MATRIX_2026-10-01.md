# TOADAL FEAST Website - Manifest-First Execution Matrix

**Date:** 2026-10-01
**Current integrated review candidate:** `integration/manifest-home-characters-progression-20261001@945c7ea1b0bc417cbbf2b7b6b3ca3b366114a9da`

This matrix ranks work by original-manifest impact, available evidence/donors, and dependency. It does not rank work by which task is easiest to automate.

## Candidate state already achieved

- Rows **1, 6, 7, 14, 15, 16, 20** are now `PARTIAL_CANDIDATE` on the integrated review branch.
- Home is still `LOCK_VISUAL`; automated PASS does not equal owner visual acceptance.
- Characters/Toadal remain preview-bounded; progression starter values are explicitly non-canonical.
- No staging or production deployment has occurred.

| Rank | Lane | Manifest rows | Why now | Done condition |
|---:|---|---|---|---|
| 1 | **Integrated candidate visual acceptance / staging gate** | 1, 6, 7, 14, 15, 16, 20 | Core candidate is implemented and verified; owner review is the gating dependency. | Home direction is owner-accepted, integrated bounded review passes, rollback ref exists, then staging promotion can occur. |
| 2 | **Stories publishing stack** | 8, 9, 10 | Manga Series and Reader are absent; Batch-1 references already exist. | Truthful data model, Manga route, Reader shell, and bookmark/resume plumbing exist without fake chapters. |
| 3 | **Editorial/discovery utilities** | 11, 12, 13, 23, 24, 25 | Media/News/Support are partial and article/search/roadmap are missing. | Structured records/templates, local search, roadmap, and support depth exist with publication states enforced. |
| 4 | **Truthful gated ecosystem routes** | 19, 21, 22, 26, 27, 28, 29 | These families are missing but can be represented truthfully without fake services. | Polished preview/Coming Soon/legal/contact/about routes exist while endpoint/content blockers stay explicit. |
| 5 | **App conversion evidence closure** | 18 | App route exists, but genuine screenshots and verified store destinations are unavailable. | Approved current screenshots and verified store URLs are wired; otherwise actions remain disabled. |
| 6 | **Play depth / additional browser-game integration** | 2, 3, 4, 17 | Play depth matters, but Arcade HOLD must not consume the website roadmap. | Only bounded integration QA is used; qualified game behavior is not re-certified without a relevant integration change. |

## Parallelization

- Stories stack can proceed while the integrated candidate is awaiting owner visual review.
- Editorial/discovery utilities can proceed in parallel with Stories when files/routes do not overlap.
- Gated ecosystem routes can proceed in a separate route/template lane.
- Do not start another broad Arcade qualification lane.

## Resource-use rule

Use working donor behavior/templates when compatible with current authority. Do not import superseded branding, hard-coded economy, fabricated content, or obsolete deployment assumptions.

## Credit-control rule

Do not spend significant QA/agent budget proving behavior that an integration did not change. Website integration QA is bounded to the surfaces actually affected: load, route/base-path, input where relevant, persistence boundary, missing assets/errors, responsive containment, focus/accessibility, and wrapper/bridge behavior.
