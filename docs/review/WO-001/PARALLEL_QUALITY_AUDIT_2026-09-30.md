# WO-001 Parallel Quality Audit — 2026-09-30

Base audited: `b56ce4fd5e64da246a51b09e9f8e7c04cdaf15b3`

This lane is intentionally separate from the active WO-001 closure work. It does not deploy or start WO-002.

## What was independently re-verified

### CP9 / V13 donor integrity
The exact recovered donor is available on ASSIGNATOR.

- archive: `C:\ASSIGNATOR\TOADAL_FEAST_V13_CHECKPOINT_IX_PUBLIC_POLISH (2).zip`
- SHA-256: `ebbd2b7631268e39522a2f63eb7377ce2cd6571b86cb88947c597b0b1376e7a4`
- extracted root: `C:\ASSIGNATOR\TOADAL_V13_CP9\TOADAL_FEAST_V13_CHECKPOINT_IX_PUBLIC_POLISH`
- static output: 236 files / 6,605,121 bytes
- key pinned witnesses: 15
- aggregate verifier witnesses: 17
- failures: 0

`node scripts/verify-cp9-donor.mjs .` -> PASS.

The CP9 donor therefore should not remain classified as “unavailable” on a machine that can access these paths.

## Visual comparison

The current Studio Home and CP9 serve different useful purposes.

### Current WO-001 Home strengths
- stronger Feast World/environment identity above the fold;
- canonical golden Toadal is clearly separated from the environment art;
- chocolate / cream / pink / gold direction matches the approved visual language;
- mobile 390×844 composition reads as an intentional phone layout rather than a shrunk desktop;
- product truth is materially safer than CP9: preview games are not disguised as runnable;
- Feast Pass, store links, Community and account sync are visibly non-live rather than fabricated;
- contextual Toadal is genuinely stateful and reacts to pointer/focus context.

### CP9 strengths worth salvaging
- more mature Play/player/fullscreen/cartridge architecture;
- compact global-utility treatment;
- stronger evidence of game-card variety and acquisition funnel thinking;
- qualified Wicked Bites and CLAW donor packages;
- useful route/player contracts that should not be reimplemented from scratch.

### Current visual watch items
1. The quality candidate now uses **“Explore the Feast World for Free.”** while zero browser games are PUBLIC/playable. The archived `b56ce4f` screenshots still show the previous “Play…” headline, so final Studio/browser evidence must be regenerated before acceptance.
2. Two preview cards currently reuse generic Feast-world scenery. That is truthful, but visually repetitive. Replace with source-qualified game-specific art later rather than using unverified decorative art simply for variety.
3. The 1920×1080 hero capture remains visually coherent. No forced hero-art swap is justified by the current witness.
4. The companion occupies significant fixed desktop space, but current interaction/accessibility evidence shows it can be minimized and does not create a technical obstruction. Preserve the compact/minimizable behavior.
## Reuse architecture finding

The prior reusable-component gate was too literal: it required every named reusable concept to exist as a Studio **symbol**, even though the project deliberately implements some reusable concepts through the correct shared Studio/site architecture.

Examples:
- SiteHeader / SiteFooter / RouteShell are shared site/navigation/page-shell configuration.
- PrimaryButton / SecondaryButton are real symbols.
- CreamPanel / DarkFeaturePanel / SectionHeading / StatusChip / CategoryTabs / SearchField are reusable visual/interaction primitives expressed through shared token-backed CSS plus structured Studio markup.
- ToadalCompanion is a structured Home component backed by global advanced-code behavior and persistent state.

The old verifier also normalized actual symbol names to lowercase but compared them against mixed-case required names for the gate, making the boolean stricter than its own displayed count.

The quality branch replaces that single “all must be symbols” test with architecture-aware evidence.

After adding the missing shared `.status-chip` styling, the effective reusable architecture result is:

**11 / 11 PASS**

This avoids two bad outcomes:
1. leaving a false blocker open;
2. creating unused/fake symbols merely to satisfy a name list.

## Status-chip polish

The Home already used `status-chip` markup for Preview / Coming Soon / Planned states, but no shared CSS definition existed.

A restrained token-backed status-chip system was added:
- base chip;
- Preview = gold;
- Coming Soon = pink outline;
- Planned = navy/cream.

This improves visual hierarchy and makes the existing structured status markup a genuine reusable primitive.

## Contrast audit

`node scripts/audit-design-contrast.mjs .` checks nine core semantic foreground/background pairs from the live design tokens.

Result:
- 9 tested
- 9 WCAG AA normal-text PASS
- 0 failures

Examples:
- cream on chocolate: 18.18:1
- cream on primary pink: 5.06:1
- chocolate on gold: 13.06:1
- navy on cream: 16.02:1
- muted body text on cream: 5.56:1

## Recommendation

For WO-001 closure:
- keep the current overall visual direction;
- reconcile the headline with the current zero-playable state;
- keep Feast Pass planned until WO-005;
- treat CP9 as verified donor/reference, not missing;
- judge reuse by real shared architecture rather than forcing every concept into an unused symbol record;
- do not start a broad redesign after the final closure pass.

This branch is a QA/polish candidate only. Final Studio 1.4.2 validation and the official acceptance receipt still control release of WO-001.

## Public-copy polish

A second pass found internal/operator wording leaking into the player-facing Home:

- “work order”
- “AUDIT REQUIRED”
- “Candidate only”
- “Package audit”
- “website QA”
- “app-store URLs”
- “approved product screenshots”

Those phrases are useful in engineering evidence but make the public page feel unfinished.

The quality candidate replaces them with player-facing truth such as:
- “later update”
- “IN DEVELOPMENT”
- “A limited browser preview is still being prepared”
- “download links and app screenshots are not published on this site yet”

Internal feature-state attributes remain unchanged, so product-truth machinery still knows the real engineering state.

`node scripts/audit-public-copy.mjs .` -> **PASS**
- hard operator jargon: 0
- softer implementation jargon: 0

## Structural / asset audits

`node scripts/audit-home-assets.mjs .` -> **PASS**
- 12 image references inspected
- 8 unique local image files
- 386,664 unique image bytes (~0.37 MiB)
- 0 missing files
- hero/world and hero Toadal remain eager/high-priority
- below-fold imagery remains lazy-loaded

`node scripts/audit-home-integrity.mjs .` -> **PASS**
- 22 unique structural/anchor IDs after accounting for Studio-generated anchors
- 13 internal anchor references
- exactly 1 H1
- 12 images with alt attributes
- 6 buttons with names
- 2 live regions
- 0 failures
- 0 warnings


## Product-truth reconciliation candidate

The parallel candidate now applies the same bounded authority corrections requested for final WO-001 closure:

- Hero authority: **Explore the Feast World for Free.**
- The stronger **Play the Feast World for Free** wording is retained only in archived pre-Studio evidence and may return after at least one browser game is actually certified playable.
- Feast Pass in WO-001 is explicitly **PLANNED**. Real guest-local progression remains `PUBLIC_AFTER_WO005`.
- The Home prep registry now routes the current primary discovery action to `/#browser-games` instead of implying a live `/play` route.
- Player-facing operator jargon has been removed without weakening internal feature-state gates.

Pure repository-level requalification after these changes:

- CP9 donor verification: PASS
- Home visual/source contract: **21/21 PASS**
- architecture-aware reusable coverage: **11/11 PASS**
- design contrast: **9/9 AA PASS**
- public-copy audit: PASS, 0 hard / 0 soft jargon findings
- Home asset audit: PASS
- Home structural integrity: PASS
- navigation truth: **14 targets / 0 unresolved**
- Pages/base-path tests: **8/8 PASS**
- `git diff --check`: PASS

These checks are intentionally supplemental. A fresh Studio 1.4.2 render/export/browser run is still required before the active WO-001 branch can claim final acceptance, because the archived `b56ce4f` artifact hashes/screenshots predate these text/CSS/authority changes.
