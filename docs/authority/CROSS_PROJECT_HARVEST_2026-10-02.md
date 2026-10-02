# TOADAL FEAST — Cross-Project Harvest for Final Website Closure

**Date:** 2026-10-02  
**Target branch:** `work/manifest-complete-v1-20261002`  
**Purpose:** harvest proven patterns from existing projects without importing product-specific baggage.

## Principle

The remaining website work should be assembly and adaptation.

Use another project's code only when it solves a concrete manifest need and can be adapted without importing its product semantics, branding, authority, or unnecessary complexity.

## 1. Grove Focus Pal — useful patterns

Source:
`Matthew75x/grove-focus-pal@36ea39cecb8c73512d5cd1d882f20ce7d74d6556`

### A. Accessibility contract — USE

Relevant:
- `focus-pal-v1.9.2-source/docs/ACCESSIBILITY.md`
- `src/accessibility/focus-dialog-accessibility.js`
- `src/accessibility/motion-preference.js`
- `grove-deadline-engine-v3.4.0/a11y.js`

Reusable rules:
- Escape closes dialogs and returns focus.
- Tab stays inside active modal/dialog.
- Enter/Space support where interaction is non-native.
- feedback can mirror into an `aria-live` region.
- reduced motion changes presentation, not capability.
- dragging cannot be the only way to perform an essential action.

Use for:
- construction/unavailable-state dialog or companion panel,
- leaderboard scope controls,
- Roadmap tabs,
- future Account/Store modals if any,
- any new modal-like UI.

Do NOT import Grove-specific calendar/pet logic.

### B. Save migration discipline — PRINCIPLE ONLY

Relevant:
- `focus-pal-v1.9.2-source/docs/MIGRATIONS.md`
- `src/core/save-schema.js`

Useful principles:
- version persisted state,
- reject unknown future schemas instead of guessing,
- deterministic migrations,
- validate before runtime,
- back up/retain original data when migrating if practical.

Current TOADAL guest progression already has safer namespaced/versioned state. Do not replace it. If final closure adds a new stored field that requires structural migration, follow this discipline rather than ad-hoc mutation.

### C. Companion adapter boundaries — PRINCIPLE ONLY

Relevant:
- `src/integration/companion-adapter.js`

Useful pattern:
- companion receives semantic events through a narrow adapter/bus,
- host capabilities are explicit,
- payloads are sanitized,
- companion failure must not break core app behavior.

The current TOADAL companion already has its own authority. Do not replace it with Focus Pal. Use this pattern only to keep new construction/reward/search events semantic and decoupled.

### D. Resilience containment — SELECTIVE USE

Relevant:
- `grove-deadline-engine-v3.4.0/resilience.js`

Useful pattern:
- one failed optional feature should not make the whole page look dead,
- repair/diagnostic behavior is isolated,
- optional UI failures fail soft,
- readable status replaces blank failure.

Apply selectively to:
- connected leaderboard fetch,
- future account/store service adapters,
- optional media embeds.

Do not import a giant generic error framework into the static site.

### E. Accessible dialog kit — USE AS REFERENCE

Relevant:
- `grove-deadline-engine-v3.4.0/dialog-kit.js`

Useful behavior:
- focus trap,
- Escape cancel,
- focus restoration,
- inline validation,
- context-preserving modal instead of browser `prompt()`.

If a modal is required for final closure, adapt these semantics; do not copy Grove styling.

## 2. Growth Control Plane — useful presentation patterns

Canonical role remains internal analytics/management. Its visual/data-state patterns are reusable; its authority is not.

Snapshot inspected through:
`Matthew75x/toadal-feast-publisher-stack/vendor/growth-control-plane/`

### A. Table semantics — USE FOR LEADERBOARDS

Relevant:
`dashboard/views/content.js`

Useful pattern:
- real `<table>`,
- caption for screen readers,
- `scope="col"`,
- aligned numeric columns,
- explicit empty state instead of blank rows.

Use for manifest row 17.

### B. Tabs keyboard model — USE

Relevant:
`dashboard/app.js`

Useful pattern:
- `aria-selected`,
- active tab gets `tabIndex=0`,
- other tabs `-1`,
- ArrowLeft/ArrowRight/Home/End navigation.

Use where tabs genuinely improve:
- Leaderboard scope/game/time controls,
- Roadmap status lanes if implemented as tabs on narrow screens,
- Media/category filtering if already consistent with current site.

Do not create tabs merely for decoration.

### C. Loading / empty / error / retry states — USE

Relevant:
`dashboard/app.js`

Useful pattern:
- explicit loading skeleton/status,
- clear disconnected/empty state,
- error state with a useful retry action,
- `aria-busy` while asynchronous work is pending.

Use for any future connected leaderboard/account adapter.

Current V1 should still work locally when backend is unavailable.

### D. Contrast discipline — USE AS QA REFERENCE

Relevant:
`vendor/growth-control-plane/docs/ACCESSIBILITY.md`

Useful rules:
- small text >= AA contrast,
- visible focus ring >= UI contrast threshold,
- critical state not color-only,
- reduced-motion support remains.

Do not import the GCP palette.

## 3. Publisher stack — useful platform patterns

Source:
`Matthew75x/toadal-feast-publisher-stack@6c0c0362e46328d0452aa7e373fe790754734246`

### A. Authority separation — KEEP

Public site, playable game, account/API, Growth and owner/admin surfaces are separate trust boundaries.

For website closure:
- public shell can link/adapt to services,
- public shell never becomes database/account/economy authority,
- Growth stays private/internal,
- account/leaderboard connected features use Froggy boundaries when actually activated.

### B. Runtime-derived surface URLs — FUTURE ACTIVATION DONOR

Relevant:
`sites/marketing/shell.js`

Useful when real account/play subdomains are activated:
- derive related surface URL from current host instead of hard-coding local/prod assumptions.

Do not force this into V1 unless actual production topology requires it.

### C. Offline/PWA shell — DEFER

Publisher-stack marketing shell proves a static/offline-tolerant pattern and service-worker seam.

Current TOADAL Studio project has PWA disabled. Do not make PWA work a manifest-closure blocker.

## 4. Current TOADAL Studio usage audit

Current project:
`studio-project/toadal-feast-website/project.json`

Positive:
- page index,
- game index,
- navigation collection,
- assets,
- publishing,
- CMS/advanced-code/integrations/pattern collections,
- generated rendering,
- shared symbol collection,
- reusable page-pattern collection.

However, current closure is not getting maximum leverage from it.

### Component catalog already names the correct primitives

`docs/design/COMPONENT_CATALOG.md` includes:

Global:
- SiteHeader
- SiteFooter
- RouteShell
- HeroBand
- ToadalCompanion

Surfaces:
- CreamPanel
- DarkFeaturePanel
- SectionHeading
- StatusChip
- CategoryTabs
- EmptyState
- ComingSoonState

Actions/forms:
- PrimaryButton
- SecondaryButton
- FormField
- SearchField

Cards:
- GameCard
- CharacterCard
- WorldCard
- StorySeriesCard
- MediaCard
- NewsCard
- QuestCard
- RewardCard

Data/progression:
- ProgressBar
- FeastPassSummary
- LeaderboardTable
- SearchResultGroup
- ProductEvidenceGallery
- LegalToc

### But the Studio reusable registries are thin

Observed:
- `collections/symbols.json` only materializes a subset.
- `collections/behavior-presets.json` is empty.
- `variables/core.json` is empty.
- `animations/index.json` is empty.
- `mechanics/core.json` is empty.
- most non-Home pages are currently a single `core.rich-text` block.

This explains why Studio has behaved more like a structured renderer than a true assembly accelerator.

## 5. Final-closure Studio strategy

Do NOT refactor the whole site into a new component architecture tonight.

Instead:

1. Reuse current CSS and current route markup.
2. Create a shared Studio pattern/symbol only when at least two final-manifest surfaces need the same structure.
3. Prefer existing catalog names instead of inventing synonyms.
4. Keep final page HTML thin enough to remain maintainable.
5. After closure, a V1.1 refactor may convert more one-off rich-text blocks into true reusable Studio symbols.

Recommended reusable patterns for closure:

### `LeaderboardTable`
Use for:
- Leaderboards,
- optional game-detail score preview.

Contains:
- semantic table,
- rank,
- player/character,
- score,
- context/scope,
- empty state.

### `TruthfulFutureState`
Use for:
- Account,
- Community,
- Store,
- unpublished story/media,
- unavailable App store destination.

Contains:
- status chip,
- concise explanation,
- companion action hook,
- one working alternative CTA.

### `ProgressionPanel`
Use for:
- Feast Pass,
- Profile,
- Quests,
- Rewards.

Contains:
- stat grid,
- progress bar,
- status/ownership note,
- action area.

### `EditorialHero + EditorialBody`
Use for:
- Devlog article,
- News,
- Roadmap supporting article.

### `RoadmapBoard`
Use for:
- Roadmap,
- compact Home What's Next reuse if needed.

Statuses:
- Available Now
- In Development
- Coming Soon
- Exploring

### `FilterTabs`
Use for:
- Leaderboards,
- Play,
- Media,
- Search where appropriate.

Accessibility behavior should follow the GCP tab model.

## 6. High-value rules for Codex

- Do not port Focus Pal visual branding.
- Do not port GCP's internal dashboard look into the public Feast site.
- Do port their accessibility, state, fallback and interaction patterns where directly useful.
- Do not build new storage if current guest progression can hold the state.
- Do not build new service APIs where Froggy already owns the boundary.
- Do not create a whole new component framework when the existing Studio catalog names the needed primitives.
- Do not block final closure on PWA/offline/refactor work.

The highest-value outcome is a polished TOADAL FEAST site whose public shell is cohesive while proven infrastructure remains behind explicit adapters and truthful states.
