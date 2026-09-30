# WO-007 — Responsive / Accessibility / Performance Closure
**Status:** HOLD until WO-006 PASS

## Goal
Cross-site quality closure. No new product features.

## Required
- phone/tablet/desktop layout checks;
- game/reader safe-area and orientation checks;
- keyboard/focus;
- reduced motion;
- semantic landmarks/labels;
- broken link/content integrity;
- loading/error/empty states;
- image optimization/lazy loading;
- console/network cleanup;
- critical-route performance review;
- GitHub Pages base-path validation.

## Automated closure
Run against final static export:
- `node scripts/verify-pages-basepath.mjs dist /toadal-feast-web/`
- `node scripts/verify-static-links.mjs dist /toadal-feast-web/`
- `node scripts/verify-staging-robots.mjs dist staging`

Any failure is a closure blocker unless explicitly explained and accepted.

## Required viewport evidence
At minimum:
- 390×844
- 430×932
- 768×1024
- 1366×768
- 1600×900
- 1920×1080

Add landscape/orientation cases for player/reader routes.

## Performance
Do not optimize by removing meaningful product functionality or visual identity.

Prioritize:
- unnecessary asset transfer;
- raw/master assets accidentally shipped;
- oversized images lacking derivatives;
- scripts/styles unused on route;
- loading critical hero/above-fold assets appropriately.

## Out of scope
- new features
- visual redesign
- new backend systems
- production deployment

## Stop
Produce closure report with PASS or exact remaining blockers.
Do not start WO-008 unless accepted.
