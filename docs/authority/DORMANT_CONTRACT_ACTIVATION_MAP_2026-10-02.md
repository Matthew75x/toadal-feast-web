# TOADAL FEAST — Dormant Contract Activation Map

**Date:** 2026-10-02  
**Target branch:** `work/manifest-complete-v1-20261002`

## Why this exists

Several final-manifest requirements are already specified in the current website repository but are not fully surfaced in the current routes. Treat them as **activation/wiring work**, not new product design.

## 1. Local Leaderboards are already part of the website contract

Evidence:

`docs/work-orders/WO-005-feast-pass-progression.md`
requires:
- durable guest-local progression,
- badges/discoveries/collectibles,
- **local score/profile views**,
- local/demo/planned distinction for online features.

`docs/implementation/PROGRESSION_STATE_CONTRACT.md`
explicitly lists:
- **local game scores**
as supported guest progression.

`docs/implementation/PUBLIC_FEATURE_STATE.json`
already defines:
- `localLeaderboards: PUBLIC_AFTER_WO005_IF_IMPLEMENTED`
- `globalLeaderboards: PLANNED`

Conclusion:
Manifest row 17 was never supposed to require a new global backend for V1. The intended V1 is local-score presentation with future connected/global state.

Use the existing TOADAL game score/leaderboard model and Froggy seam.

## 2. Roadmap data already exists

`studio-project/toadal-feast-website/content/registry.json` already contains `roadmapItems`, including:

- Browser game previews
- Guest Feast Pass
- Community
- Store
- Account sync

Each already has:
- stable ID,
- title,
- public status,
- publication state,
- searchable flag,
- description,
- evidence source,
- route,
- slug.

Conclusion:
Manifest row 24 is primarily a **new route/template over existing structured records**.

Do not hard-code an unrelated Roadmap dataset.

Before publishing a roadmap item, apply `docs/content/PUBLICATION_RULES.md`: internal work orders are not automatically public roadmap items.

## 3. Devlog content model already exists

`docs/content/CONTENT_REGISTRY_CONTRACT.md` defines News / Devlog entities:

- id
- slug
- title
- factual publication date
- real byline only when sourced
- excerpt/body
- hero/media
- tags
- related content

Conclusion:
Manifest row 13 needs a **thin reusable article template** and structured record projection. It does not need a new CMS architecture tonight.

`collections/updates.json` is currently empty, so do not invent articles merely to populate the template.

## 4. Publication states are already formalized

`docs/content/PUBLICATION_RULES.md` defines:

Feature state:
- PUBLIC
- PREVIEW
- PLANNED
- COMING_SOON
- DISABLED

Content state:
- DRAFT
- PREVIEW
- PUBLISHED
- ARCHIVED

These are separate.

Conclusion:
All final future-state UI should use these existing concepts instead of inventing new labels ad hoc.

## 5. Companion reactions are already specified

`docs/authority/sources/mockups/TOADAL_REACTION_STATE_MAP.md` already maps:

- World / roadmap / discovery -> map guide / pointing
- Media / news / devlog -> creator/writing state
- Feast Pass quest -> adventure guide
- Reward earned / collection -> treasure celebration
- Leaderboard / high score -> trophy/victory
- App conversion -> smartphone/download
- Account / signup -> registration
- Search -> magnifier/detective
- Community -> social/open arms
- Store -> merch
- Support -> headset/tablet
- Contact -> clipboard/mail
- Privacy -> shield/padlock
- Construction -> hard hat/tools
- Settings/sound -> gear/bell/mute
- Error/404 -> explorer/map reaction

`docs/implementation/TOADAL_COMPANION_STATE_MAP.json` further requires:
- semantic state priority,
- action state,
- focus/hover/touch parity,
- persisted minimize state,
- reduced motion removes movement but preserves semantic reaction.

Conclusion:
Do not design companion semantics from scratch.

### Current art caveat

The current asset catalog contains many semantic Master V2 states but does **not** expose a clearly named hard-hat/tools construction asset. The existing `maintenance` asset is tagged maintenance-only.

Do not silently treat maintenance as generic Coming Soon if the visual semantics are wrong.

For final closure:
- preserve construction reaction semantics/copy,
- use an approved existing semantic image if one truthfully fits,
- otherwise use canonical Toadal with construction UI/copy until a dedicated approved construction asset is supplied.
- Do not generate/reinterpret the character merely to fill this gap.

## 6. Form/provider boundaries already exist

`studio-project/toadal-feast-website/collections/integrations.json` already lists form provider modes:

- disabled
- mailto
- webhook
- Formspree / compatible POST

Conclusion:
Contact does not need a new form architecture.

If no verified endpoint/mailbox is configured, keep it intentionally disabled/future-state.

If a verified endpoint later exists, connect through the existing provider seam.

## 7. Local state namespaces already exist

`docs/implementation/LOCAL_STATE_NAMESPACE.md` reserves:

- `toadal:web:v1:guest-id`
- `toadal:web:v1:feast-pass`
- `toadal:web:v1:quests`
- `toadal:web:v1:discoveries`
- `toadal:web:v1:reader-progress`
- `toadal:web:v1:companion-minimized`
- `toadal:web:v1:recent-searches`
- `toadal:web:v1:preferences`

Conclusion:
Do not create random new localStorage keys for final closure if one of these domains applies.

If local score state requires a website-owned adapter/cache, document it within the existing namespace contract rather than reusing mobile/game save keys.

## 8. Release A backend boundary already permits launch

`docs/implementation/CONTENT_AND_BACKEND_BOUNDARIES.md` explicitly says Release A works without backend-heavy systems.

Can be public without connected account backend:
- browser games that work,
- World/Characters/Stories/Media/News,
- comics/reader,
- guest-local Feast Pass,
- local quests/rewards,
- App conversion,
- local search,
- Support/Contact/About/Legal,
- Roadmap/Coming Soon/404.

Future connected:
- auth/sync,
- registered profile,
- global/friends leaderboard,
- community posting,
- checkout,
- live notifications.

Conclusion:
Do not let future connected infrastructure delay manifest-complete public presentation.

## 9. Analytics contract already exists

`docs/implementation/ANALYTICS_EVENT_CONTRACT.md` defines vendor-neutral events such as:

- page_view
- nav_select
- game_card_view/select
- game_launch_attempt/success
- app_cta_select
- feast_pass_open
- quest_open
- story/chapter_open
- search_submit/result_select
- companion_interaction
- coming_soon_select

Conclusion:
If analytics wiring is touched, call one internal adapter and fail silently when unavailable.

Do not wire Growth Control Plane directly into page components.

## Final activation rule

Before Codex creates a new concept, ask:

1. Is it already in a current contract?
2. Is structured data already in the content registry?
3. Is the behavior already in current JS?
4. Does the game runtime already own it?
5. Does Froggy already own the service boundary?
6. Does a historical donor already prove the UX?

Only after all six are negative should the feature be treated as genuinely new.
