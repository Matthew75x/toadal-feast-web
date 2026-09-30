# WO-001 — Approved Home Visual Parity Review
**Date:** 2026-09-30  
**Reference authority:** `TOADAL_APPROVED_HOME_VISUAL_AUTHORITY.png`  
**Current implementation reviewed:** `work/WO-001-global-shell-home` at `b56ce4fd5e64da246a51b09e9f8e7c04cdaf15b3`

## Disposition

**STRUCTURE / TRUTH / ACCESSIBILITY: strong.**  
**VISUAL PARITY: FIX REQUIRED.**

The current Home is technically coherent and product-truthful, but it does not yet resemble the approved Home closely enough to be accepted as the intended final visual direction.

This is no longer an "approved mockup unavailable" blocker. The approved Home authority is available and has been independently compared against the final WO-001 screenshots.

## What the current implementation gets right

Keep these:
- chocolate/cream/pink/gold palette family;
- approved Home information order;
- food-fantasy environment;
- canonical Toadal source rather than a generated replacement;
- truthful Preview/Coming Soon/disabled states;
- contextual/minimizable Toadal behavior;
- six-viewport responsive evidence;
- keyboard/focus/reduced-motion behavior;
- 404 and project-base-path correctness;
- no fabricated store/account/game claims.

Do not throw away the current technical foundation.

## Major visual gaps

### 1. Header / franchise identity — FIX
**Approved:** strong TOADAL FEAST franchise logo at upper-left, active Home pill, compact icon-rich navigation, right-side utilities.

**Current:** plain text `TOADAL FEAST` plus plain text navigation on a flat chocolate bar.

Required remediation:
- stronger branded wordmark treatment in the brand slot;
- Home/current-route pill treatment;
- tighter nav rhythm and playful icon accents without harming accessibility;
- retain mobile Menu behavior;
- do not use the Android app icon as the website wordmark.

### 2. Hero composition — MAJOR FIX
**Approved:** bright, saturated Feast World panorama with:
- large headline left;
- huge canonical Toadal as the central focal point;
- environment visible on both sides;
- pink Play CTA + cream App CTA;
- compact benefit row;
- playful signboard/details on the right.

**Current:** heavy dark scrim, very large empty dark area, small Toadal near the lower-right edge, and a large disabled search control dominates the lower hero.

Required remediation:
- reduce visual darkness/scrim;
- make the environment a primary visual, not a background texture;
- enlarge canonical Toadal substantially and move him toward the center/right focal area;
- keep headline/CTAs left;
- compress the search surface so it does not compete with the hero;
- preserve search truthfulness but treat it as a utility, not the primary hero object;
- shorten hero vertical footprint on desktop.

### 3. Browser games + Feast Pass composition — MAJOR FIX
**Approved:** immediate dense row:
- browser-game panel across most width;
- Feast Pass summary sidecar on the same visual band;
- five compact game cards visible quickly.

**Current:** games and Feast Pass are separate full-width sections; Feast Pass appears much later and consumes a large dark band.

Required remediation:
- compose Games + Feast Pass as one desktop band;
- four current Home cards can remain during WO-001, but reserve a visual slot for the later Arcade candidate;
- Feast Pass remains truthfully PLANNED until WO-005;
- preserve compact card density instead of large editorial cards.

### 4. Page density / vertical rhythm — MAJOR FIX
**Approved:** dense game portal that fits hero, games/pass, discovery, app conversion and future-state content in a compact desktop viewport.

**Current:** long editorial landing page with substantial vertical whitespace and large full-width sections.

Required remediation:
- reduce desktop section padding;
- convert Today into a compact ribbon/current-adventure surface rather than a large standalone panel;
- tighten card padding and gaps;
- favor grouped dashboard-like bands over article-style vertical stacking.

### 5. Discovery lane — FIX
**Approved:** Characters, Explore the World, Stories & Media are three equally intentional visual modules with rich thumbnails.

**Current:** the three-column structure exists, but Stories & Media is mostly a text placeholder and the overall treatment is visually sparse.

Required remediation:
- keep canonical character art;
- strengthen the World thumbnail cluster;
- use an honest illustrated placeholder/approved art treatment for Stories & Media rather than a mostly empty text card;
- never fabricate published chapters/media.

### 6. App conversion + What's Next — MAJOR FIX
**Approved:** App conversion and What's Next occupy the same lower desktop band.

**Current:** large full-width App section followed by large full-width What's Next section.

Required remediation:
- pair them side-by-side on desktop;
- App conversion should feel like a premium illustrated banner;
- future-state cards remain clearly Coming Soon/Planned;
- store buttons remain disabled until real destinations are approved.

### 7. Companion — FIX
**Approved:** expressive bottom-right Toadal, speech bubble and route/contextual presence integrated into the composition.

**Current:** large "field notes" card plus a separate pink toggle with tiny Toadal.

Required remediation:
- make canonical Toadal itself the visible companion control;
- speech bubble stays compact and contextual;
- minimize control remains available;
- companion should feel like a character, not an admin note panel.

## Product-truth reconciliation

### Browser games
Independent CP9 donor reconciliation proves:
- Wicked Bites 5.5 has a qualified/deployed staging cartridge;
- CLAW: Feed Gulper 2.5.1 has a qualified/deployed staging cartridge;
- both current hosted entry artifacts still return HTTP 200 and byte/hash-match their CP9 manifests.

However WO-001 still intentionally withholds launch routing until WO-002 integrates the current player shell.

Therefore public copy should say:
> Qualified browser previews exist; playable launch routing is being integrated.

Do **not** say:
> no real playable browser build exists.

### Hero headline
The approved final headline is:
**Play the Feast World for Free.**

For a staging build where current Home has no launch route yet, use either:
- a state-aware headline: **Explore the Feast World for Free.**
- or retain approved headline only if the adjacent copy clearly says playable previews are being integrated and no current Home CTA falsely launches.

Once WO-002 exposes at least one qualified player route, restore the exact approved **Play** headline.

### Feast Pass
Central product authority says guest-local Feast Pass becomes public in WO-005.

Therefore WO-001 should show a **planned visual summary only**, not fake XP/Sparks/Treats/streak values.

This is a deliberate truthful deviation from the mockup until WO-005, not an implementation failure.

## Acceptance target

WO-001 visual acceptance should require:
1. the current technical/QA foundation remains green;
2. desktop Home composition visibly matches the approved dense portal hierarchy;
3. mobile remains readable and responsive;
4. canonical Toadal identity remains intact;
5. truthful feature states remain intact;
6. final screenshots are compared side-by-side to the approved Home authority.

## Bottom line

Do **not** merge/deploy the current Home as the final approved visual.

Do **not** restart the website from scratch.

Use the existing Studio 1.4.2 implementation as the foundation and perform a targeted visual-composition remediation pass.
