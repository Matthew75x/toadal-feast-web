# Contextual companion reaction authority

The bottom-right Toadal is a contextual, non-blocking feature. A sentence changing is not a visual reaction: acceptance requires a real change to the displayed character artwork when the approved context/state changes.

## Binding behavior

- Keep canonical Toadal identity, compact corner placement, non-blocking behavior, minimized-state persistence, keyboard/focus/touch access, reduced-motion semantics, and safe-area spacing.
- Use route/section/action context, not pointer coordinates. The current identity guardrail forbids cursor-follow behavior; the older proposal in `sources/companion/TOADAL_WEBSITE_INTERACTIVE_MASCOT_MASTER_PLAN.md` is retained as history and is not current authority.
- Context selection may change dialogue and artwork together. Do not claim visual reaction completion from dispatching an event, changing copy, adding files, or catalog registration.
- Keep a canonical fallback whenever no approved/eligible state asset exists. Do not fabricate new states, use a specific maintenance pose as generic unavailable art, or imply unimplemented products/economy/content.

## Asset candidates and context mapping

| Context | Candidate | Source qualification |
|---|---|---|
| World/map discovery | `toadal-adventure-map-guide.png` | Selected from owner-described production-ready-only pack; individual approval metadata is absent. Not a published game map. |
| Support/help | `toadal-support-headset.png` | Candidate only; no support destination is configured. |
| App/mobile | `toadal-mobile-app.png` | Candidate only; not a product screenshot or store proof. |
| Stories/media discovery | `toadal-thinking-seated.png` | Candidate only; does not imply published stories or media. |

All four live under `studio-project/toadal-feast-website/reference/assets/images/characters/companion/production-pack-v2/`. Their exact source entries and hashes are in [`manifests/companion-runtime-assets.json`](../../manifests/companion-runtime-assets.json), and candidate authority is detailed in [`ASSET_AUTHORITY.md`](ASSET_AUTHORITY.md). They are registered in the Studio asset catalog for resolvability, but are not yet bound to runtime states.

The older mascot package remains a donor reference, not binding approval. Its `Home / Welcome` prototype was marked replaceable, and its pointer-follow behavior conflicts with the current guardrail. Existing verified source `initCompanion()` currently changes speech and `data-companion-current-reaction` but leaves the single displayed image unchanged. Therefore visual reactions are currently `MISSING` even though dialogue contexts work.

## Runtime acceptance evidence for future implementation

1. Trigger representative actual route/section/action contexts and observe the image element's effective asset URL/identity change to the mapped candidate, not merely a data attribute or dialogue string.
2. Verify fallback, no cursor-follow, reduce-motion behavior, phone layout, safe-area clearance, minimized persistence, keyboard/focus and touch action behavior.
3. Capture before/after evidence on representative desktop and phone routes. Confirm disabled/preview product states remain truthful and the companion cannot cover primary controls.
4. Update the exact staging-gap row only after those runtime observations. Asset registration alone must leave the row `MISSING`.
