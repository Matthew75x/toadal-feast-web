# TOADAL FEAST — Home Implementation Spec
**Status:** implementation authority after WO-000 PASS
**Visual authority:** approved direction and repository visual-authority documents, reviewed against the retained CP9/V13 desktop and mobile captures. The original mockup PNGs are unavailable; do not claim pixel-perfect mockup parity.

## Purpose
The first viewport must communicate:
1. the Feast World is available to explore, while browser-game cards are previews until a playable build is certified;
2. TOADAL FEAST is a larger world of characters, places and stories;
3. the mobile app is the full flagship adventure.

The Home page is a game-world portal, not a corporate landing page.

## Section contract

### Header
Navigation:
`Home · Play · World · Stories · Media · Feast Pass · App · Community · Store`

TOADAL FEAST dominates.
TOADAL GAMES stays subordinate.
Temporary clean text branding is acceptable if the final web wordmark asset is not yet supplied.

### Hero
Headline:
**Explore the Feast World for Free.**

Required:
- food-fantasy environment;
- canonical Toadal as separate overlay;
- primary discovery CTA routed to `/#browser-games`; it must not imply that a Preview game is runnable;
- secondary App CTA;
- concise copy that distinguishes world discovery and browser previews from the full app.

“Play the Feast World for Free.” may return only after WO-002 certifies at least one actual playable browser experience.

No critical text or CTA baked into art.

### Browser games
Show the four currently approved browser-game concepts as previews; no game is currently public/playable. TOADAL FEAST Arcade remains an audit-required candidate and is not a Home game card. A wider future catalog is data-driven; a visual card never implies `PUBLIC`.

Intended family:
- Wicked Bites
- TOADAL Tower Defense / Feast Defense
- Froggy Fruity Bash
- CLAW: Feed Gulper

These four are the complete current Home set and remain `PREVIEW`. TOADAL FEAST Arcade remains an audit-required candidate and is not displayed as a Home game card. Availability is data-driven; a visual card does not imply `PUBLIC`.

### Feast Pass
WO-001 shows a planned/preview summary only. No guest-local state, progress fields, persistence, or live rewards are implemented here. WO-005 owns the real guest-local Feast Pass behavior and its qualification. Account sync stays Planned until implemented.

### Discovery
Three major lanes:
- Characters
- World
- Stories & Media

Use canonical character assets and real/approved content.
Generated mockup identities do not define canon.

### App conversion
Strong lower-page conversion surface.
Use real screenshots and real store destinations only.

### What's Next
Compact truthful status cards only.
No invented launch dates.

### Toadal companion
Desktop: bottom-right, contextual, non-blocking. Studio 1.4.2 represents its markup as a rich-text component enhanced by the project's advanced-code behavior; symbols do not provide typed slots/parameters for this custom structure.
No cursor-following.
Persist minimize state.
Reduced motion suppresses motion but retains semantic reaction/state.

### Footer
TOADAL GAMES subordinate studio identity plus real support/legal/contact links.

## Responsive
- phone hero stacks cleanly;
- game cards become scrollable or 1–2 columns;
- Feast Pass becomes full-width;
- companion may auto-minimize;
- safe areas respected.

## Performance
- responsive hero art;
- optimized transparent character derivatives;
- below-fold images lazy-loaded;
- no raw masters in normal bundle.

## Visual failure conditions
Reject if:
- mascot identity drifts;
- layout becomes generic SaaS;
- environment disappears behind huge flat panels;
- fake product evidence appears;
- mobile becomes a shrunken desktop screenshot.
