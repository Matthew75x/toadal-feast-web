# WO-001 — Global Shell + Home
**Status:** HOLD until WO-000 PASS

## Goal
Implement the reusable global shell and Home page from the approved TOADAL FEAST visual authority without inventing a new visual direction.

## Branch
work/WO-001-global-shell-home

## Read first
- docs/design/DESIGN_SYSTEM_SPEC.md
- docs/implementation/PUBLIC_TRUTH_RULES.md
- owner-supplied approved Home visual and canonical brand/Toadal assets

## In scope
Global shell:
- SiteHeader / SiteFooter
- route shell and layout tokens
- base typography plumbing
- buttons, CreamPanel, DarkFeaturePanel, SectionHeading, StatusChip, CategoryTabs
- responsive navigation
- ToadalCompanion frame/state plumbing

Home hierarchy:
1. Play the Feast World for Free hero
2. immediate browser-game discovery
3. guest Feast Pass summary
4. today's adventure / daily reward surface
5. character/world/story/media discovery
6. app conversion
7. truthful future/Coming Soon surface
8. contextual companion

Use structured data/config instead of duplicated card markup.

## Assets
Use supplied canonical TOADAL FEAST logo/Toadal assets and supplied Home environment.
If a final asset is unavailable, use an explicit neutral placeholder; do not invent a fake product screenshot.
Do not generate art.

## Responsive checks
390x844, 430x932, 768x1024, 1366x768, 1600x900, 1920x1080.

## Accessibility
Keyboard, visible focus, semantic landmarks, clear labels, reduced motion, no color-only meaning.

## Visual targets
Chocolate nav, cream/gold game-like panels, vivid pink CTA, navy headings,
world art visible around content, dense but organized first viewport, premium playful—not SaaS.

## Out of scope
Other routes, account/leaderboard/community/store backends, production deployment,
design rethinking, new character art, final Feast Pass economy.

## Evidence
Studio validation, static export, Home link check, accessibility smoke check, console check,
required viewport screenshots in docs/review/WO-001/, exact diff/stat, final branch commit.

## Stop
STOP after Global Shell + Home are implemented/tested/committed.
Do not merge main, deploy Pages, or start Play.
