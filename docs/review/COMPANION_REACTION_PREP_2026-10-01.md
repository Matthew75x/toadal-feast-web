# Contextual Toadal Companion — Parallel Implementation Donor

Base: `staging/live-visual@7c17e28135688ace9139918f077a44e3d03d9765`

Branch: `parallel/contextual-companion-prep-20261001`

Purpose: implement the already-approved contextual Toadal behavior without changing staging, main, production, or the browser-game cartridge.

## Exact staging defect

The existing companion runtime already detects hover, focus, touch, current section, action copy, and a `data-companion-reaction` value. It only changed dialogue and wrote the reaction name to the companion root. It never changed `[data-companion-image].src`, so Toadal remained visually static.

## Production asset authority

Source pack: `TOADAL_ASSET_LIBRARY_V2_PRODUCTION_READY_ONLY.zip`

SHA-256: `06275f4803c8c63e141c34dbcf252bb9c9ab0c35edae460c7c940fd2f687a76a`

The implementation uses optimized web derivatives of owner-provided production-ready assets. The default/welcome state preserves the accepted canonical Toadal victory artwork already present in staging.
## Reaction mapping

- Play / browser games / media → excited
- Feast Pass / rewards → proud
- World / adventure → curious
- Stories → thinking
- News / devlog → news
- App / mobile → present
- Support / help → friendly
- Support contact / mail → contact
- Search → search
- Settings / controls → settings
- Privacy / security → privacy
- Account / profile → account
- Coming Soon / roadmap → construction
- Home/default → accepted canonical victory art

The runtime prefers a semantic interactive control under the pointer/focus before falling back to its surrounding page section. This is what allows controls such as Search or future Settings UI to display their own pose instead of merely inheriting the hero/page pose.
## Bounded runtime evidence

Headless Chromium exercised 20 reaction assertions: Home default, Browser Games, Feast Pass, World, Stories/Media, App, What's Next, News nav, Support nav, Search, Play page, World page, Stories page, Media page, Feast Pass page, News page, App page, Support page, Support Contact, and mobile Home. All 20 reaction assertions passed.

No console errors were observed. Fast test navigation produced only aborted image requests during page transitions; no missing reaction assets were observed. At 390x844 the existing mobile companion footprint remained 264x56, preserving the current overlap reduction.

The standalone browser-game cartridge source was explicitly restored after the generated-shell pass so this donor does not alter game internals.

## Integration rule

This branch is a reviewable donor, not authority and not a deployment. Reconcile it with Codex's authority consolidation before promoting it. Do not merge it wholesale if the authority work has changed the same shell files.
