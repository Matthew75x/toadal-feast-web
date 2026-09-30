# CP9 → Studio Route Compatibility Audit

Date: 2026-09-30

The CP9 static donor exposes 29 index routes. The new route registry is cleaner, but several CP9 paths change names. Preserve compatibility intentionally instead of silently breaking working URLs.

## High-confidence aliases

| CP9 path | Current canonical destination | Action |
|---|---|---|
| `/games/` | `/play/` | redirect/alias after Play exists |
| `/download/` | `/app/` | redirect/alias after App exists |
| `/quests/` | `/feast-pass/quests/` | redirect/alias after WO-005 |
| `/rewards/` | `/feast-pass/rewards/` | redirect/alias after WO-005 |
| `/toadal/` | `/characters/toadal/` | redirect/alias after WO-003 |
| `/updates/` | `/news/` | redirect/alias after WO-006 |
| `/privacy/` | legal/privacy destination | preserve address or redirect once legal structure is final |
| `/terms/` | legal/terms destination | preserve address or redirect once legal structure is final |
| `/eula/` | legal/EULA destination | preserve address or redirect once legal structure is final |

## Player-path compatibility

CP9 qualified players use:
- `/play/wicked-bites/game/`
- `/play/feed-gulper/game/`

The new registry currently specifies:
- `/play/:gameId/player/`

Do not break qualified/bookmarked `/game/` URLs merely because the canonical spelling changed. WO-002 should either retain `/game/` as a compatibility alias or deliberately preserve the CP9 path.
## Route-registry gap to resolve in WO-002

The current canonical registry contains an explicit Wicked Bites detail route plus a dynamic player route, but no generic `/play/:gameId/` detail route and no explicit CLAW detail route.

Because WO-002 calls for a reusable Game Detail template and multiple game records, resolve this before Play closure:
- add a generic game-detail route contract, or
- explicitly enumerate every supported game-detail route.

Do not leave routing dependent on undocumented special cases.

## Routes requiring content-owner review

These CP9 routes do not map one-to-one to the current registry and should not be deleted casually:
- `/beta/`
- `/status/`
- `/games/castle-vassals/`
- `/games/lily-pad-leap/`
- `/games/starship-engineer/`
- `/games/stick-rebel/`
- `/games/toadal-feast/`

For each, decide: canonical redirect, archived informational page, or intentional removal with 404. Do not invent destination mappings merely to make the list disappear.

## Deployment rule

Compatibility redirects/alias pages must be base-path safe for GitHub Pages and compatible with the final Netlify routing layer.

Never add a redirect to a target that is not actually implemented yet.
