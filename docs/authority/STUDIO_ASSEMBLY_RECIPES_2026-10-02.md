# TOADAL FEAST — Studio Assembly Recipes for Manifest Closure

**Date:** 2026-10-02  
**Purpose:** finish missing/thin manifest pages quickly with consistent compositions instead of route-specific reinvention.

## Rule

Use the existing component vocabulary from `docs/design/COMPONENT_CATALOG.md`. Do not create a new design language.

The following recipes are implementation guidance, not new product authority.

## Recipe A — Standard discovery/content page

Use for:
- World
- Characters
- Media
- News
- Support
- About

Composition:
1. RouteShell
2. HeroBand
3. SectionHeading + StatusChip
4. CategoryTabs only when filtering is useful
5. responsive card/grid content using the existing matching card type
6. EmptyState / ComingSoonState for unavailable content
7. one clear CTA row
8. ToadalCompanion

Behavior:
- no dead CTA,
- responsive grid collapses naturally,
- cards remain keyboard reachable,
- publication/feature state visibly distinct.

## Recipe B — Progression page

Use for:
- Feast Pass
- Quests
- Rewards
- Player Profile

Composition:
1. HeroBand with guest/local truth note
2. compact stat grid: Level / XP / Sparks / Treats / Streak
3. ProgressBar / FeastPassSummary
4. contextual section cards
5. reward/quest/discovery lists
6. account-future callout
7. clear local-storage/reset language where appropriate

Data:
- use current `guest-progression.js`
- use current `progression-definitions.js`
- port only donor presentation/behavior that fits the modern state contract

Do not create a second progression store.

## Recipe C — Leaderboards

Use for:
- dedicated Leaderboards route
- optional compact game-detail score module

Composition:
1. HeroBand
2. Game selector
3. Mode/ruleset/scope FilterTabs
4. personal-best summary
5. LeaderboardTable
6. challenge/Play CTA
7. connected-global future-state callout when service inactive

Data priority:
1. actual local game score model
2. local adapter
3. Froggy connected service only when configured

Never display fake competitors or fake global ranks.

Accessibility:
- semantic `table`
- screen-reader caption
- column scopes
- tab controls follow arrow/Home/End keyboard pattern
- empty state says "No scores yet" and points to Play

## Recipe D — Editorial article/devlog

Use for:
- News Article / Devlog

Composition:
1. breadcrumb
2. article HeroBand
3. factual status/date/byline only when sourced
4. article body with media slots
5. pull quote slot
6. related content
7. previous/next concept
8. Roadmap CTA
9. companion context

The template may exist with no published article records.

Do not invent publication dates, author names or devlog claims.

## Recipe E — Roadmap

Use for:
- dedicated What's Next / Roadmap

Composition:
1. HeroBand
2. public-status explanation
3. four RoadmapBoard groups:
   - Available Now
   - In Development
   - Coming Soon
   - Exploring
4. each item links to a real related route when one exists
5. related Devlog/News section
6. no dates unless owner-approved/factual
7. companion construction reaction for future items

Data:
- source from content registry `roadmapItems`
- internal work orders are not automatically public roadmap entries

## Recipe F — Truthful future-state page

Use for:
- Account when backend inactive
- Community
- Store
- unavailable app-store destination
- unpublished story/chapter
- future service surfaces

Composition:
1. attractive hero
2. StatusChip
3. "what this will do" explanation
4. what works now
5. what is not yet available
6. working alternative CTA
7. companion construction/context reaction

This should feel like a deliberate product state, not a broken placeholder.

## Recipe G — Game detail

Use for:
- Wicked Bites and future game details

Composition:
1. genuine key art/media
2. feature state
3. description
4. mechanics/controls
5. genuine screenshots
6. challenge/progression links
7. score/leaderboard preview
8. characters
9. rewards/achievements
10. related games
11. Play CTA
12. App CTA

Do not fabricate game capabilities.

## Recipe H — Browser player

Preserve current qualified wrapper.

Only add shell-level elements when the cartridge exposes truthful data:
- score
- timer
- challenge
- XP/reward result

Game viewport remains dominant.

Do not turn the player into a dashboard.

## Recipe I — Search/result family

Preserve current Search.

Reusable result pattern:
- grouped heading
- count/status
- result title/type/status
- short description
- direct route link

No-results state should:
- restate the query,
- suggest Play/World/Characters/Stories,
- optionally invoke contextual companion help.

## Recipe J — Support/contact/legal

Support:
- SearchField
- category cards
- popular questions
- Contact/Status shortcuts

Contact:
- existing form structure
- real endpoint if configured
- otherwise explicit unavailable state and alternative path

Legal:
- LegalToc
- readable sections
- only approved body text
- publication/effective-date state must be factual

## Styling constraints

Reuse the current TOADAL FEAST tokens and existing CSS.

Maintain:
- cream/light surfaces
- chocolate framing/navigation
- pink primary CTA
- gold accents
- dark/navy readable headings
- rounded playful cards
- dense-but-readable layout
- canonical art
- generous touch targets
- visible focus

Avoid:
- generic SaaS dashboard appearance
- Grove/Focus Pal branding
- GCP Field Notes styling
- large dead whitespace
- excessive one-off CSS selectors
- unbounded animations

## Studio implementation discipline

For final closure:
- route-level `core.rich-text` is acceptable where refactoring would slow delivery,
- but repeated new structures should use a shared symbol/pattern or shared CSS class,
- do not duplicate the same large HTML fragment across multiple routes,
- keep data/state in registries/runtime modules, not hard-coded separately into each page.

Suggested shared additions only if the renderer supports them cleanly:
- LeaderboardTable
- TruthfulFutureState
- ProgressionPanel
- EditorialArticleShell
- RoadmapBoard
- FilterTabs

Do not stop manifest closure to rebuild TOADAL Studio itself.
