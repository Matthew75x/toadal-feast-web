# TOADAL FEAST — Parallel Closure File Ownership

Date: 2026-10-02
Branch: `work/manifest-complete-v1-20261002`

## Core rule

Feature agents own route-local files. The integrator owns shared registries, shared runtime, CSS, generated output, and final QA. If a feature agent needs a shared-file change, document the required hook/patch for the integrator instead of racing another agent.

## Integrator-only final ownership

- `studio-project/toadal-feast-website/pages/index.json`
- `studio-project/toadal-feast-website/collections/navigation.json`
- `studio-project/toadal-feast-website/collections/advanced-code.json`
- `studio-project/toadal-feast-website/reference/assets/css/site.css`
- `studio-project/toadal-feast-website/assets/index.json`
- `studio-project/toadal-feast-website/content/registry.json`
- generated `dist/**`
- final manifest ledger
- staging deployment

Do not let multiple agents commit independently rendered `dist/`.

## Lane A — audit

Read-only product/manifest reconciliation. Record status, donor and acceptance gaps. No product-code edits.

## Lane B — editorial/discovery

Own route-local:
- `pages/media.json`
- `pages/news.json`
- new Devlog page
- new Roadmap page
- `pages/support.json`
- Search only if a real non-regressive manifest gap requires it

Hand page-index, registry, nav/search projection and shared-CSS changes to integrator.

## Lane C — Play / Leaderboards

Own:
- `pages/play.json`
- `pages/game-wicked-bites.json`
- `pages/player-wicked-bites.json`
- new `pages/leaderboards.json`

Use existing cartridge protocol, game leaderboard donor and Froggy future seam.

Do not scrape game saves.

Hand player-host score hook, route registration, nav and shared CSS to integrator.

## Lane D — Feast Pass / progression

Own:
- `pages/feast-pass.json`
- `pages/quests.json`
- `pages/rewards.json`
- `pages/profile.json`
- `reference/assets/js/guest-progression.js`
- `reference/assets/js/progression-definitions.js`
- progression tests

Lane D owns the website-local score persistence API/state. Lane C consumes it. Do not create two score stores.

## Lane E — World / characters / stories

Own:
- `pages/world.json`
- `pages/characters.json`
- `pages/toadal-profile.json`
- `pages/stories.json`
- `pages/manga-series.json`
- `pages/comic-reader.json`

Preserve current publishing/reader runtime unless an acceptance gap truly requires a change. No invented canon.

## Lane F — App / gated ecosystem

Own:
- `pages/app.json`
- `pages/account.json`
- `pages/community.json`
- `pages/store.json`
- `pages/contact.json`
- `pages/about.json`
- `pages/coming-soon.json`
- `pages/legal.json`
- `pages/404.json`

Priority: Infinite mode, Community/feed/guidelines structure, Store update path, About depth, Coming Soon truth fix. No backend rebuild.

## Lane G — visual review

Read all implementation lanes. Propose consolidated visual changes; do not independently rewrite shared `site.css`.

Use:
- current visual authority
- Home donor reconciliation
- Batch‑1 module map
- asset reuse map

## Lane H — integrator

Own shared files and final closure:
1. integrate route-local work;
2. settle score/progression contract;
3. apply shared CSS;
4. add shared advanced-code hooks;
5. register routes/nav/discovery;
6. register any verified asset imports;
7. run source-only final gate;
8. fix all buildable failures;
9. render/export;
10. run full final gate/browser matrix;
11. update final ledger;
12. stage exact passing SHA.

## Shared score contract

- Lane C: score events + Leaderboards UI.
- Lane D: local score persistence under website namespace.
- Integrator: connect validated `game:complete` to Lane D API.
- Profile/Leaderboards/Play read the same source.
- Never read/write private mobile/full-game saves.

## Shared companion contract

Feature lanes add semantic companion context in route-local markup.

Integrator owns global companion runtime/mapping changes.

## Shared CSS contract

Feature lanes reuse existing classes when possible and hand new class requirements to integrator. Integrator consolidates selectors and responsive behavior.

## Recommended merge order

E → B → F → D → C → G → H.

This minimizes conflicts while allowing most work to proceed concurrently.
