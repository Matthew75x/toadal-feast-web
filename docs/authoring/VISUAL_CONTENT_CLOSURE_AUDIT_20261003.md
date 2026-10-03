# TOADAL FEAST — Visual and Content Closure Audit

**Date:** 2026-10-03  
**Branch:** `audit/visual-content-closure-20261003`  
**Basis:** public GitHub Pages staging at `https://matthew75x.github.io/toadal-feast-web/`, plus the current owner-native authoring authority and acceptance documents on `work/owner-native-authoring-20261002`.

## Purpose

This is a complementary closure lane. It does **not** redesign the site, modify Studio, merge to `staging/live-visual`, deploy, or touch production. Its job is to identify the remaining owner-facing presentation work now that the non-coding authoring foundation is substantially proven.

The working rule is:

**preserve the approved TOADAL FEAST composition; fix visible defects and visitor-facing roughness before adding more systems.**

## Evidence captured

Fresh 2026-10-03 browser captures were taken from public staging at 1440×1200 and 390×844 for:

- Home
- Play
- World
- Stories
- Characters
- App

Additional 390×844 captures were taken for Characters and Stories.

The captures are preserved on ASSIGNATOR under:

`C:\Users\iu\Documents\Codex\2026-10-03\website-audit\`

This audit does not claim the exact deployed staging commit SHA; it judges the public staging response actually rendered on 2026-10-03.

## Current assessment

The site is structurally coherent and visually recognizable as TOADAL FEAST. The strongest surfaces are World and App: both have a clear hero, strong canonical imagery, understandable hierarchy, and an obvious next action.

The remaining work is no longer primarily infrastructure. The main gap is **visual/content closure**: mobile composition, image framing, visitor-friendly language, consistency of cards/CTAs, and reduction of repeated preview/debug-style messaging.

## P0 — fix before any visual-lock or public-promotion decision

### 1. Mobile hero composition is not closed

The 390px Home, Play, and Characters captures show content being visually cut or pushed beyond the comfortable viewport composition.

Observed examples:

- Home: the secondary hero CTA is visibly truncated at the right edge, and Toadal is partially pushed outside the composition.
- Play: hero copy and the Preview-only statistics card extend into a composition that reads cropped rather than intentionally stacked.
- Characters: long hero copy runs into the character overlay and right-side crop.

Required closure:

- At narrow widths, stack hero CTAs vertically or allow full-width wrapping; no CTA label may be cut.
- Keep headline, body, CTA, and character art inside deliberate safe zones.
- Character/environment cropping may be dramatic, but no important face, CTA, or text may look accidentally clipped.
- Re-test at 390px and at least one narrower/safe-area width after correction.

### 2. Remove internal QA/staging language from the visitor presentation layer

Public-facing copy currently exposes implementation terminology such as:

- “session-only staging preview”
- “origin-safety requalification”
- “package connected”
- “staging candidate”
- “none is PUBLIC”
- “website package”

That language is technically honest but reads like an internal test dashboard rather than a finished franchise portal.

Keep the truthful product state, but translate it into visitor language. Examples:

- “Preview build available”
- “Web preview coming soon”
- “Temporarily unavailable while we prepare the web version”
- “Play a limited browser preview”
- “The full experience is available in the app” when factually appropriate

Do not fabricate launch dates, public availability, connected accounts, cloud saves, scores, rewards, or store destinations.

### 3. Character-card presentation needs one consistent visual system

The Characters Hub is functional, but the card row still reads unfinished.

Observed:

- Several portraits are cropped aggressively at the top/bottom of their media box.
- The “Discover this character artwork” controls look materially different from the approved pill/button language around the rest of the site.
- Card text density and image treatment vary enough that the row feels assembled rather than art-directed.

Required closure:

- Use intentional per-asset framing rather than one crop rule for every character.
- Preserve full faces/crowns/identity-defining features unless the approved crop intentionally says otherwise.
- Normalize the small secondary action to the site’s existing button/link visual language.
- Keep future/unpublished character states truthful without making the entire card feel disabled or broken.

## P1 — polish after P0

### 4. Stories has too many simultaneous negative/empty-state messages

The Stories page truthfully states that content is not published, but the first viewport repeats this through multiple surfaces:

- “Publishing preview · no published stories”
- “Nothing published yet”
- “There is nothing to resume yet”
- “No latest chapter”
- additional explanatory copy

This is accurate, but the cumulative effect is absence rather than anticipation.

Recommended treatment:

- Keep one strong hero-level publication state.
- Turn the remaining sections into finished future-state cards with positive next actions: explore the world, meet the cast, preview the reader shell, view manga structure, or return to Home.
- Keep the current Stories/Reader machinery and publication safeguards; this is presentation cleanup, not a fabricated content launch.

### 5. Home is strong but still reads too operational in places

Home has the right ingredients: world art, Toadal, Play/App paths, browser-game discovery, Feast Pass, daily interaction and discovery modules. The issue is density and technical wording.

Closure target:

- First screen: franchise promise + Play/App choices.
- Second visual beat: browser games + Feast Pass.
- Later beats: daily/discovery/characters/world/stories.
- Reduce explanatory prose where the UI itself already communicates the state.
- Keep the bottom-right companion non-blocking.

### 6. Play should distinguish “playable preview,” “concept,” and “unavailable” with simpler semantics

The current catalog is truthful but label-heavy.

Use one consistent state system, for example:

- **Play Preview** — runnable browser build
- **Preview** — detail/media only
- **Coming Soon** — no runnable package

The exact wording can vary, but visitors should not have to understand package/integration terminology.

### 7. Mobile navigation discoverability requires an explicit owner check

The captured narrow headers show the brand and companion artwork but not the normal desktop navigation. This may be intentional responsive behavior, but this audit did not verify the interaction that exposes the full menu.

Acceptance requirement:

- At 390px, an ordinary visitor must be able to discover Home, Play, World, Stories, Media, Feast Pass, News, App and Support without guessing.
- Keyboard/focus/touch behavior must remain intact.
- Do not call this a defect until the actual mobile nav interaction is exercised; do not call it complete from screenshots alone.

## P2 — owner decisions / secondary refinement

### 8. Companion overlap remains a deliberate tradeoff

Existing project evidence already flags lower-right overlap on some desktop/tablet layouts. Preserve the contextual companion architecture, but owner acceptance should decide whether its current footprint is worth the occasional occlusion.

A safe rule is: the companion may overlap decorative space; it should not cover essential CTA text, form controls, critical card copy, or required navigation.

### 9. App page is close to visual closure

The App page currently has one of the strongest page compositions. Preserve:

- real gameplay imagery
- clear “full adventure” framing
- truthful disabled store state
- browser/world fallbacks

Do not redesign it merely for novelty. The meaningful remaining dependency is real store destinations when those become available.

### 10. World page is also near closure

The World page has a strong hero and clean environment/cast framing. Its main work is content expansion when approved world structure exists, not visual reinvention. Do not invent locations or lore to make the page look fuller.

## Public-copy translation rule

Before public promotion, run a wording pass over staging and classify each sentence:

1. **Visitor copy** — keep.
2. **Truthful future-state explanation** — keep, simplify.
3. **Internal implementation/QA language** — rewrite for visitors.
4. **Unsupported product claim** — remove or gate.

Technical evidence can remain in docs and QA receipts; it does not need to appear in the public page copy.

## Closure order

1. Fix mobile hero/CTA composition on Home, Play and Characters.
2. Normalize character-card framing and secondary action styling.
3. Replace visitor-visible internal QA terminology across Home/Play/detail pages.
4. Consolidate Stories empty states into a finished publication-preview experience.
5. Verify mobile navigation discoverability and keyboard/touch behavior.
6. Re-run a proportional visual pass at 1440, tablet, 390 and one narrow safe-area width.
7. Owner reviews Home/Play/Characters/Stories/App/World before any `LOCK_VISUAL` decision.
8. Only after owner acceptance should the selected source/export be promoted separately to `staging/live-visual`.

## Decision thresholds

### DO NOT PROMOTE

Any of the following remains:

- clipped CTA or essential text
- broken/accidental character crop
- unreachable mobile navigation
- dead CTA
- fabricated availability/account/store claim
- obvious internal QA/debug language on a public-facing surface

### ITERATE

P0 is clear, but there are still presentation issues such as excessive prose, repeated empty-state messaging, inconsistent minor controls, or companion overlap that the owner has not accepted.

### VISUAL-LOCK CANDIDATE

All P0 items are closed; major page families are coherent on desktop/tablet/mobile; public copy reads like a franchise website rather than a QA dashboard; truthful unavailable states remain useful; and the owner explicitly accepts the visual result.

## Do not broaden this lane

This audit is **not** permission to:

- rebuild Studio
- alter Stories registry/Reader publishing architecture
- add arbitrary game upload
- replace canonical character identities or world art
- prune frozen assets without reachability proof
- invent lore, release dates, economy values, accounts, scores or store links
- deploy to staging or production

The next implementation tranche should be a bounded visual/content closure pass against the items above, using the existing Studio/source model and proportional tests.
