# Page and navigation requirements

The [route registry](../implementation/ROUTE_REGISTRY.json) is the planned 30-family sitemap. The actual current routes come from `studio-project/toadal-feast-website/pages/index.json`. These have different purposes and must not be treated as interchangeable acceptance lists.

| Family | Persistent requirement | Current staging |
|---|---|---|
| Home | Approved dense portal: hero, games/pass band, discovery, app/future band, contextual companion | Present; partial visual/content/companion closure |
| Play, game detail, player | Registry-driven availability, real evidence, static detail/player paths and truthful launch controls | Play and four details; Wicked Bites preview player only |
| World, Characters, Toadal profile | World/location discovery and canonical cast/relationships | World preview; character/profile routes absent |
| Stories, series, reader | Real Series → Volume/Arc → Chapter → Page records, accessible reader, bookmarks/resume | Empty Stories preview; series/reader absent |
| Media | Approved structured artwork/gallery/video entries with provenance | Empty preview |
| News, article/devlog | Real dated published records and readable details | Empty News preview; articles absent |
| Feast Pass, quests, rewards, leaderboards, profile | Guest-local XP/level/Sparks/Treats/streak/quests/discoveries, reading/local score references and future migration | Planned explanatory page; no live progression |
| App | Full flagship adventure, genuine approved screenshots and verified store destinations | Informational page; disabled store buttons |
| Account | Truthful authentication state; future sync/migration | Deferred; no authentication |
| Community, Store | Curated discovery only when approved; posting/checkout require real services | Coming Soon cards on Home; standalone routes absent |
| Search | Local search over approved published content with meaningful empty/results states | Disabled utility; search route absent |
| Roadmap | Owner-approved public items/status; no fabricated dates | Truthful compact What's Next cards; dedicated route absent |
| Support, Contact, About | Real help content, approved contact destination and subordinate studio information | Support explainer only; contact/about absent |
| Coming Soon, Legal, 404 | Honest reusable states, approved legal text, branded recovery | 404 present; dedicated Coming Soon/Legal absent |

## Navigation reconciliation

Verified staging exposes nine primary/footer destinations: Home, Play, World, Stories, Media, Feast Pass, News, App and Support. The original Home navigation specifies Home, Play, World, Stories, Media, Feast Pass, App, Community and Store, plus utilities such as search/account. The staging-restoration task requested the currently visible nine-route set. This is a temporary operational set, not owner cancellation of Community, Store or utility requirements.

Desktop links and mobile Menu must provide accessible labels, current-route state, keyboard operation, Escape focus restoration, touch usability and no overflow. Route presence does not establish content completeness. Legal/contact requirements remain pending approved content/destinations; do not invent them.

Original route examples use `/play/:gameId/` and nested player paths. Accepted implementation uses `/games/:gameId/` and `/player/:gameId/`; preserve this as a documented route implementation difference, not a silent rewrite of the original sitemap. See [routing contract](../implementation/GITHUB_PAGES_ROUTING_CONTRACT.md) and [CP9 compatibility](../implementation/CP9_ROUTE_COMPATIBILITY.md).

## Content and feature gates

All 30 page families remain requirements. Missing published stories/media/news need explicit evidence-backed editorial decisions; a placeholder is not a finished content page. Connected accounts, sync, global leaderboards, posting, checkout and notifications remain intentionally deferred until their services exist. Guest-local progression is separately implementable; its historical WO-005 scheduling does not remove it from the product.

See [publication rules](../content/PUBLICATION_RULES.md), [content/backend boundaries](../implementation/CONTENT_AND_BACKEND_BOUNDARIES.md), [progression contract](../implementation/PROGRESSION_STATE_CONTRACT.md) and [app evidence gate](../implementation/APP_CONVERSION_EVIDENCE_GATE.md).
