# TOADAL FEAST — Final Website Dependency Cutline

**Date:** 2026-10-02  
**Target:** `work/manifest-complete-v1-20261002`

## Purpose

Prevent two opposite mistakes during final closure:

1. leaving a website surface unfinished because an external service/content item is unavailable; or
2. wasting final-closure time building external infrastructure that already belongs to another system or genuinely depends on owner/provider input.

A missing external dependency does **not** excuse an unfinished public shell.

## A. Does NOT block manifest-complete website engineering

These may remain truthful Preview / Planned / Coming Soon states when the corresponding external activation is not real.

### Account authentication / cross-device sync
External/service owner:
- Froggy Locker deployment and production configuration.

Website must still finish:
- guest status,
- benefits,
- account/signup/login presentation,
- privacy boundary,
- continue-as-guest path,
- companion reaction,
- useful Feast Pass/Profile links.

Do not build a second auth backend.

### Global / friends / connected leaderboards
External/service owner:
- Froggy Locker + authenticated identity + hosted service.

Website must still finish:
- local leaderboard,
- personal best,
- ranking presentation,
- connected/global future state,
- Play/Profile/Feast Pass integration.

### Community posting/uploads/feed backend
External/service owner:
- future moderated community service.

Website must still finish:
- creator spotlight structure,
- fan-art structure,
- event structure,
- curated-feed preview,
- guidelines/feedback paths,
- clear posting-unavailable state.

### Store catalog / cart / checkout
External/service owner:
- approved products + Froggy commerce/entitlement/provider activation.

Website must still finish:
- merchandise category presentation,
- digital-goodies presentation,
- update/notify path,
- no-checkout truth,
- merch companion state.

Do not invent SKUs, prices, inventory, cart or checkout.

### Official App Store / Google Play URLs
External dependency:
- real published/approved store destinations.

Website must still finish:
- full app presentation,
- Arcade/Puzzle/Feastfall/Infinite,
- benefits/comparison,
- genuine gameplay evidence,
- disabled/construction-aware store controls.

### Public contact / support mailbox or form endpoint
External dependency:
- verified public mailbox or configured form provider.

Website must still finish:
- complete form UX,
- categories/fields,
- attachment/device-info structure,
- disabled submit truth,
- support/business/privacy alternatives.

### Approved legal documents
Content/legal dependency:
- owner/legal-approved Privacy Policy and Terms.

Website must still finish:
- legal document template,
- TOC,
- publication state,
- related docs/contact,
- truthful "approved copy not published" state.

Do not generate legal text and present it as approved policy.

### Published stories / manga pages
Content dependency:
- approved authored story/series/chapter/page assets.

Website must still finish:
- Stories hub,
- Manga series template,
- Reader,
- publication states,
- progress/bookmark behavior,
- related World/Characters/Media links.

No fake chapter needed.

### Published news/devlog articles
Content dependency:
- factual article body/date/byline/media.

Website must still finish:
- News hub structure,
- reusable Devlog/article page family,
- empty/publication state,
- Roadmap linkage.

### Merchandise art / product photography
Content/commerce dependency:
- approved product assets.

Website must not fabricate merchandise imagery.

### Production host/domain cutover
Release dependency:
- authenticated control of the real production target and/or domain route.

This is **not manifest implementation work**.

Finish and certify the manifest candidate on staging first.

## B. DOES block manifest-complete website engineering

These are under our control and cannot be deferred behind "Coming Soon":

- a required manifest page family/route is absent;
- required page structure is omitted even though a future-state treatment is possible;
- a dead CTA has no explanation or escape;
- a future action accidentally looks live;
- local Search does not work;
- browser-playable preview that is advertised does not launch;
- local Feast Pass persistence regresses;
- Treat/quest/reward UI is disconnected from available local state;
- local Leaderboards page is absent even though score infrastructure exists;
- App page omits a real current mode;
- Roadmap page is absent even though structured Roadmap records exist;
- Devlog template is absent even though no published article is required;
- companion semantics are absent where required;
- responsive/keyboard/reduced-motion behavior breaks;
- missing/broken local assets;
- false gameplay/content/product claims;
- manifest navigation does not expose the completed surface.

## C. Content quality vs website completion

A finished website may have intentionally empty editorial catalogs if there is no approved content.

A finished empty state must:
- look designed,
- explain why it is empty,
- not invent data,
- provide a useful next action,
- preserve the intended future structure.

Therefore:
- "0 published manga chapters" can be complete website behavior.
- "No approved Devlog posts yet" can be complete website behavior.
- an absent Manga/Devlog route is not complete website behavior.

## D. Final report categories

Any remaining item after final qualification must be placed in exactly one category:

### EXTERNAL ACTIVATION
Examples:
- Froggy hosted account/global leaderboard endpoint
- store destinations
- commerce provider
- production host/domain

### CONTENT / OWNER INPUT
Examples:
- manga pages
- real news article
- approved legal copy
- approved merchandise

### WEBSITE BUG / BUILDABLE GAP
Anything Codex can implement from current authority/donors.

A final status may say:

`MANIFEST V1 ENGINEERING COMPLETE — ONLY EXTERNAL ACTIVATION/CONTENT DEPENDENCIES REMAIN`

only when **WEBSITE BUG / BUILDABLE GAP is empty**.
