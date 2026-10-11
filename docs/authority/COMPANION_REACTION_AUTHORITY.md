# Contextual companion reaction authority

The bottom-right Toadal is a contextual, non-blocking website companion. A dialogue change by itself is not a visual reaction: when an eligible semantic context has production artwork, the displayed character artwork must change too.

## Binding behavior

- Keep canonical Toadal identity, compact corner placement, minimized-state persistence, keyboard/focus/touch access, reduced-motion semantics and safe-area spacing.
- Use route/section/control semantics. Do **not** implement cursor-follow or pointer-coordinate animation.
- Context priority is action → keyboard focus while keyboard input is active → semantic hover while non-touch pointer input is active → touch context while touch input is active → current section → hero/default. A fresh pointer hover supersedes retained keyboard focus, and active touch context is not masked by a previous mouse hover.
- If an interactive control has no dedicated companion copy, its artwork may react while dialogue falls back to the current section rather than replacing useful copy with generic text.
- Keep the canonical victory Toadal as fallback whenever no production-qualified state exists.
- A production pose never proves the associated product/service is live. Product truth remains separate.

## Source authority

The owner re-supplied the complete Master V2 library and the original interactive mascot handoff on 2026-10-01. Their exact archive hashes and classification rules are recorded in [OWNER_ASSET_RECOVERY_2026-10-01.md](OWNER_ASSET_RECOVERY_2026-10-01.md).

The Master V2 classification is binding for art quality:

- `01_PRODUCTION_READY_FULL_SIZE` — eligible production source.
- `02_SPRITE_SHEETS_AND_COMPOSITES` — reference only.
- `03_USER_REFERENCES` — quality/pose reference only.
- `04_ALTERNATES_AND_DRAFTS` — not selected by default.
- `05_NEEDS_REGENERATION` — do not ship as final art.

The interactive handoff is binding for semantic intent where it does not conflict with the non-blocking/no-cursor-follow website guardrails. It explicitly includes Settings → gear, Support → support, Contact → mail, Privacy → security, notifications → bell, mute → mute, account states, ratings/survey/feedback, mobile, partnership, community, blog/news, maintenance and other states.

## Runtime mapping

Already-live v1 bindings:
- World/map discovery → map-guide Toadal.
- Support/help → headset Toadal.
- App/mobile → smartphone Toadal.
- Stories/Media → thinking Toadal.

Master V2 integration adds production-qualified mappings for:
- News/Blog → writing/devlog Toadal.
- Search/Discovery → magnifier Toadal.
- Support Contact/Mail → mail-carrier Toadal.
- Genuine Maintenance / Home What's Next → construction-worker Toadal.
- Settings → gear/control Toadal.
- Mute/Sound → open-eyed mute Toadal.
- Notifications → bell Toadal.
- Privacy/Security → shield Toadal.
- Account/Login fallback → account/profile Toadal.
- Register → signup Toadal.
- Delete account → thoughtful deletion Toadal.
- Ratings → five-star Toadal.
- Survey → checklist Toadal.
- Positive/negative feedback → dedicated thumbs-up/thumbs-down Toadal.
- AI disclosure → robot-handshake Toadal.
- Partnership/Licensing → contract-handshake Toadal.
- Community/Social → open-arms social Toadal.
- Merch → merch Toadal.
- Download → folder/download Toadal.
- Reward/Achievement → treasure/reward Toadal, but only for an actual earned reward.

Feast Pass remains on the canonical fallback unless a real earned-reward event exists; the mere existence of Feast Pass planning must not imply a live economy.

## States that remain non-final

The handoff contains useful older concepts for FAQ, Scoreboard, 404, Quit/Exit, Developers/API, Legal, Social Impact and food/eating reactions. Those are not automatically deployable final art. In particular, Master V2 puts the old Quit/Exit goodbye-door wink in `05_NEEDS_REGENERATION`; sprite/composite art is reference-only.

The separate labeled food library is valid source material for future food interactions, but it does not by itself supply a final production Toadal food-tracking/eating pose.

## Direct owner quality references

The owner directly re-supplied a polished construction-worker image and a polished headset/question-mark Support image during this review. Their hashes and relationship to Master V2 are recorded in the owner recovery document. The construction reference matches the Master V2 maintenance concept visually; the Support image is retained as a quality reference and is not silently substituted for a different Master support asset.

## Acceptance

A reaction is accepted only when browser evidence observes the effective image URL/identity change for the intended route/section/control, with fallback, mobile containment, minimize persistence and keyboard/pointer/touch behavior preserved. Runtime manifests must identify the exact source entry and web derivative hash.

The current crosswalk is machine-readable in `manifests/owner-asset-recovery-v2.json` and `manifests/companion-runtime-v2.json`.
