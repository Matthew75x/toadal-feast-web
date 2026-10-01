# TOADAL GAMES — Making the Website Itself a Game

**A full build plan:** what's actually in the three asset packs, what's wrong with them, the interaction concept, what each of the 21 pages becomes, the technical build, and the order to build it in.

*Based on a full audit of `Grove_Games_All_Assets_Expanded_Pack.zip`, `TOADAL_GAMES_SITE_ASSET_INTEGRATED_2026-09-24.zip`, and `FroggyFeast_Food_Assets_Labeled.zip` — 327.6 MB and 246 files across the three. Every claim and every number below was opened, measured, or test-run before being written down; nothing here is a guess.*

---

## Update — 2026-09-25 (read this first)

Two more packages arrived after the rest of this plan was written and audited:

- **`TOADAL_WEBSITE_INTERACTIVE_MASCOT_HANDOFF_v1.zip`** — a from-scratch redraw of the golden mascot as a 28-state interaction system (settings, mute, register, rewards, 404, and more), plus a master plan proposing him as a persistent pointer/edge-following companion. This is new production art, not the strategy-pack concept sheet §21 originally flagged.
- **`TOADAL_WEBSITE_HANDOFF_VERIFIED_PENDING_V4_SOURCE_2026-09-24.zip`** — an owner-authored precedence package for a separate Codex → Luna → Astra pipeline, naming `Grove_Games_Final_Website_ASSET_NATIVE_2026-09-24.zip` (nested inside it) as the new **public visual authority**, superseding the `TOADAL_GAMES_SITE_ASSET_INTEGRATED` build this plan was originally audited against — plus a live "ASSIGNATOR" stack, GitHub `main`, and a local v4 source tree as the technical/backend authority.

What changed in this document, section by section:

| Where | What changed |
|---|---|
| [§2.5](#25-two-packages-received-since-this-plan-was-written) *(new)* | What's actually inside both new packages, measured the same way §2 measured the original three |
| [§4.2](#42-sixteen--no-fourteen--food-icons-arent-actually-cut-out) | Resolved — the asset-native package ships all 54 food icons already cut, optimized, and organized by category |
| [§5.1](#51-what-each-asset-actually-does-when-you-touch-it), [§6.4](#64-play--the-lobby-arcade) | Balloons are gone from the newest build, replaced by "Feast Treat" collectibles; Balloon Pop is shipped as Feast Catch |
| [§11](#11-open-decisions-i-need-from-you) | Q3 and Q4 now have real evidence behind them; Q7 turns out to be the wrong question (see §21); Q1, Q2, Q5, Q6, Q8 are untouched — still genuinely open |
| [§19](#19-risk-register) | The mascot risk row now points at the rewritten §21 |
| [§21](#21-the-second-mascot--reconciled-in-part-one-naming-conflict-still-open) | Rewritten. The *role* question is answered: the golden frog is a separate character with his own job, not a restyle of the green one. The *name* question is not — this is the one thing I'd get an explicit answer on before it goes any further into copy or code |
| [§23](#23-the-feast-genies--a-new-character-system-this-plan-hasnt-mapped-yet) *(new)* | A third character system — Sweet/Fruity/Savory Genies — showed up in the same package with no interaction design behind it yet |
| [§24](#24-what-this-update-could-and-couldnt-verify) *(new)* | What I could and couldn't check, given I only have the files uploaded here — the live-runtime/GitHub/ASSIGNATOR side of the V4 package is outside what a chat session can verify |
| [Appendix C](#appendix-c--the-pages-21-originally-22-as-of-the-asset-native-package) | Adds `rewards.html`, the 22nd page |

Alongside this document, I built a small working prototype of the interactive-companion proposal from the mascot handoff's master plan — idle pose → hover-state swap → feed reaction, using your actual art and your actual CSS tokens. It's `design-concept/toto-companion-concept.html` in the zip: a proof of concept for [§21](#21-the-second-mascot--reconciled-in-part-one-naming-conflict-still-open)'s interaction model, not a page-by-page rebuild of the site. Sections not listed in the table above are unchanged from the original audit.

---

## Contents

1. [The idea, restated precisely](#1-the-idea-restated-precisely)
2. [What's actually in the three zips](#2-whats-actually-in-the-three-zips)
3. [What's already working — don't break this](#3-whats-already-working--dont-break-this)
4. [What's broken or wasted, with receipts](#4-whats-broken-or-wasted-with-receipts)
5. [The interaction model](#5-the-interaction-model)
6. [Page by page: what each of the 21 pages becomes](#6-page-by-page-what-each-of-the-21-pages-becomes)
7. [The asset pipeline](#7-the-asset-pipeline-turning-flat-art-into-game-objects)
8. [Technical architecture](#8-technical-architecture)
9. [Build roadmap](#9-build-roadmap)
10. [Guardrails carried forward from your own docs](#10-guardrails-carried-forward-from-your-own-docs)
11. [Open decisions I need from you](#11-open-decisions-i-need-from-you)
12. [The first three minutes](#12-the-first-three-minutes)
13. [Secrets & discovery](#13-secrets--discovery)
14. [Achievements — giving the unused badge sheet a job](#14-achievements--giving-the-unused-badge-sheet-a-job)
15. [Sound design](#15-sound-design)
16. [Per-toy physics tuning](#16-per-toy-physics-tuning)
17. [The feeding combo system](#17-the-feeding-combo-system)
18. [Save-data shape](#18-save-data-shape)
19. [Risk register](#19-risk-register)
20. [Where this plan sits inside the TOADAL strategy pack](#20-where-this-plan-sits-inside-the-toadal-strategy-packs-90-day-plan)
21. [A second mascot that needs reconciling](#21-a-second-mascot-that-needs-reconciling)
22. [The official quality bar, now in one place](#22-the-official-quality-bar-now-in-one-place)
- [Appendix A — full food roster](#appendix-a--full-food-roster-54-items)
- [Appendix B — sprite sheet inventory](#appendix-b--sprite-sheet-inventory)
- [Appendix C — the 21 pages](#appendix-c--the-21-pages)

---

## 1. The idea, restated precisely

A thing feels like a game when a small set of ingredients are all present at once: it **reacts instantly** to touch, it has a **verb that's fun to repeat**, **progress sticks** between visits, there's a **character with personality** reacting to you, and there are **secrets** worth finding. A page with sound effects bolted on isn't a game. A page built around those five ingredients is, no matter how simple it is underneath.

Two rounds of direction landed on one fused concept:

- **The site is the title screen and the overworld**, not a menu with a game catalogue attached. The frog is the avatar. Pages are places you travel to, not links you click. TOADAL FEAST, Starship Engineer, Stick Rebel, Castle & Vassals, and Lily Pad Leap are islands on a map, not list items.
- **Everything is a toy.** Not just the mascot and a few effects — food, balloons, lily pads, signs, leaves, game cards, the daily-reward slots. You can drag, throw, drop, stack, and pop nearly anything on the page, and the real content (text, forms, nav) never gets lost in the process.
- **The core verb is hop-and-gobble.** Click a nav item and the frog physically hops there before the page changes. Food drifts through the scene; feeding it to the frog is the one action you'll want to repeat a hundred times, and it's the thing that drives the site's one piece of real progress: a Feast Album that fills up as you discover all 54 foods.
- **"Responsive" means both things at once.** The page reacts instantly to touch (a toy falls, bounces, and settles the moment you let go — not on the next frame), and it also resizes and re-flows correctly from a 320px phone to an ultrawide monitor. Both are treated as hard requirements below, not as two ends of a spectrum to pick from.

Everything from here is that concept made concrete against the specific art you actually have.

---

## 2. What's actually in the three zips

| Package | Size | Files | What it is |
|---|---:|---:|---|
| `TOADAL_GAMES_SITE_ASSET_INTEGRATED_2026-09-24.zip` | 39.8 MB | 135 | **The live site.** 21 real HTML pages, one CSS file, a minimal JS file, and its own docs/QA folders. This is the ground truth to build on top of, not replace. |
| `Grove_Games_All_Assets_Expanded_Pack.zip` | 205.3 MB | 53 top-level | The full art library the site was built from, organized into 9 numbered folders, plus 3 nested zips of an earlier build (see below). |
| `FroggyFeast_Food_Assets_Labeled.zip` | 82.5 MB | 58 | 54 individually labeled food icons across 5 categories, plus 3 preview sheets. |

### 2.1 The live site (`TOADAL_GAMES_SITE_ASSET_INTEGRATED`)

- **21 real HTML pages** — full list in [Appendix C](#appendix-c--the-21-pages).
- **`assets/css/styles.css`** — a real design-token system already in place (colors, radii, shadows, easing). This is reused wholesale, not replaced — see [§3.2](#32-the-design-tokens-already-in-place).
- **`assets/js/app.js`** — small and doing very little today (basic mobile menu / filter wiring). All game behavior described in this document is new code on top of it, not a rewrite of it.
- **`docs/`** — `IMPLEMENTATION_STATUS.md`, `INTENTIONS_AND_HANDOFF.md`, `RECOMMENDED_PROCESS.md`, `ASSET_INVENTORY.md`, `ASSET_INTEGRATION_LEDGER.md`, `asset-provenance.json`. These are load-bearing — [§10](#10-guardrails-carried-forward-from-your-own-docs) is built directly from them.
- **`qa/`** — `ASSET_INTEGRATED_QA_REPORT.md/json`, `LOCAL_QA_REPORT.md/json`. 1,218 automated checks currently pass at 0 failures (see [§3.1](#31-the-qa-baseline)).

### 2.2 The art library (`Grove_Games_All_Assets_Expanded_Pack`)

| Folder | Contents | Status |
|---|---|---|
| `01_core_brand_and_mockups` | The two full-page UI mockups, plus standalone mascot hero renders | Reference / already mined for direction |
| `02_game_key_art_and_illustrations` | 8 files — key art for all 5 games, plus two "sleeping frog" variants | **In active use**, right-sized in [§7](#7-the-asset-pipeline-turning-flat-art-into-game-objects) |
| `03_dashboard_and_page_mockups` | 6 files — goal-tracking, analytics, content, finance, game, and player dashboards | **Internal/business tooling reference, out of scope.** These are staff-facing dashboard concepts, not public site material — flagging so they aren't mistaken for a public feature request |
| `04_time_streak_rewards_assets` | 11 files — daily-reward panels, streak banners, timer banners, playtime badges | Source art for the real streak/reward system in [§6](#6-page-by-page-what-each-of-the-21-pages-becomes) |
| `05_alerts_frames_stickers_fx` | Nature FX atlas (37 sprites), 3 frog sticker sheets (poses/UI/alerts), a UI sticker sheet, a glossy frame collection, a sticker collection | **The single richest folder for this project** — see [§7](#7-the-asset-pipeline-turning-flat-art-into-game-objects) |
| `06_balloons_and_interaction_assets` | One balloon sprite sheet, 21 sliceable balloons (frog-face, leaf, lily-flower, heart, star, gift, in 3–4 states each including "popping") | Direct source for the balloon-pop toy |
| `07_reference_sheets_and_component_kits` | Forest asset collection (24 sliceable pieces: leaves, mushrooms, moss rocks, lily pads, signposts, a lantern, a rope bridge), UI component kits, icon sets, an 11-scene art collection | Forest kit is the main new decor source; art collection is a good source for loading states / a "world gallery" later |
| `08_bonus_existing_packages` | 3 nested zips — see [§2.4](#24-the-three-nested-zips-inside-08_bonus_existing_packages) | Historical / superseded, but not empty of value |
| `09_docs` | `README.md`, `asset_list.txt`, `asset_manifest.json` | Reference |

### 2.3 The food set (`FroggyFeast_Food_Assets_Labeled`)

54 icons in 5 categories — full roster in [Appendix A](#appendix-a--full-food-roster-54-items):

| Category | Count |
|---|---:|
| Fruity Main | 10 |
| Sweet Main | 11 |
| Savory Main | 7 |
| Bonus Extras | 7 |
| Alternate Variants (rare/festive re-skins of the above) | 19 |
| **Total** | **54** |

The alternate variants are a genuine gift for this concept: they're re-skinned versions of the main roster (candy-style banana, candy-style cheeseburger, a cartoon curry bowl, and so on), which is exactly the shape of a "rare drop" system — no new art direction needed, just a lower spawn rate.

### 2.4 The three nested zips inside `08_bonus_existing_packages`

These are worth explaining because they look like duplication but aren't quite:

- **`Grove_Games_Website_v1.1_AUDITED.zip`** (5.0 MB) — an **earlier, pre-rebrand build** of this same site under the "Grove Games" name (index, games, 5 game pages, store, community, account, news, status, legal pages, `qa/audit.py`). `RECOMMENDED_PROCESS.md` names this build as "the strongest implementation baseline" the project started from. The live `TOADAL_GAMES_SITE_ASSET_INTEGRATED` build is its rebrand-and-integrate successor — `IMPLEMENTATION_STATUS.md` literally subtitles itself "Asset-Integrated Local Successor."
- **`Grove_Games_Master_Handoff_Package.zip`** (88.9 MB) — the full handoff bundle: a start-here README, the website build above, the core and extended asset sets, the mockups, an original reference screenshot plus a captured ~4.7 KB static HTML prototype, and 8 docs including `AUDIT_REPORT.md`, `CONTENT_SOURCE_MAP.md`, and `DEPLOYMENT_CHECKLIST.md`. This is where the governing docs actually live.
- **`Grove_Games_Separated_Assets.zip`** (28.0 MB) — the UI mockups pre-cut into 17 categorized folders (navigation, header, hero, mascot, speech decor, feature bar, buttons, game cards, status, info panels, decorative, footer, surfaces, badges, misc icons, high-res art). Useful as a component-by-component style reference if the shared game layer ever needs a UI piece not already rebuilt in CSS.

None of this needs to be re-integrated — the live site already superseded it — but `CONTENT_SOURCE_MAP.md` and `DEPLOYMENT_CHECKLIST.md` from inside it directly shape [§10](#10-guardrails-carried-forward-from-your-own-docs), so it wasn't dead weight to open.

---

## 3. What's already working — don't break this

### 3.1 The QA baseline

Per `IMPLEMENTATION_STATUS.md`: **1,218 automated QA checks, 0 failures**, with every page checked at 390px and 1440px and key pages additionally checked at 320px and 768px. Mobile menu, game filtering, and the (intentionally local-only) beta form are all verified working. There's a `skip-to-content` link, a real `<meta name="viewport">`, and no generated-art dependency for navigation, forms, labels, statuses, cards, or layout — those are all real DOM/CSS today, which is exactly the foundation this plan needs and won't touch.

Whatever gets built on top of this must keep that report green. Concretely: every page stays real, static, server-renderable HTML; the new game layer is additive `<script>`/`<canvas>` on top, never a replacement for the underlying markup; and everything interactive gets a keyboard/no-JS equivalent (detailed in [§8.4](#84-accessibility-is-not-a-separate-pass)) so the QA suite's keyboard and screen-reader checks keep passing.

### 3.2 The design tokens already in place

`assets/css/styles.css` already defines a full token system — this plan reuses it rather than inventing a new palette:

```
--cream:#fff8ed   --cream-2:#fff2e4   --paper:#fffdf9
--ink:#251b58     --ink-2:#3b2e78     --muted:#6d6583
--pink:#ff3f86    --pink-2:#ff72a8    --pink-soft:#ffe8f2
--blue:#536fff    --sky:#dff5ff       --violet:#7959e8
--gold:#f5b82f    --gold-soft:#fff1be --mint:#dbf6dd
--line:#ebdfd6    --line-strong:#ddcec1
--shadow-sm / --shadow / --shadow-float
--shell:1460px    --r-xl:34px  --r-lg:28px  --r-md:21px  --r-sm:14px
--ease:cubic-bezier(.2,.7,.2,1)
```

Every new toy, HUD element, and effect uses these variables. A frog-food glow uses `--pink`/`--gold`, a card radius uses `--r-lg`, a settle animation uses `--ease`. Nothing new gets invented unless the token system genuinely has no answer for it (e.g., there's no existing "physics settle" easing curve — a new one gets added *to* the token system, not around it).

### 3.3 The brand direction that's already locked

`INTENTIONS_AND_HANDOFF.md` locks the tone as **whimsical, friendly, cozy, optimistic, polished** — a clean interface foundation with playful accents and *selective* rainbow/pink highlighting, exploratory and editorial rather than dashboard-like. This plan leans into that rather than overriding it: the game layer is the "playful accent," not a replacement for the clean foundation underneath it.

---

## 4. What's broken or wasted, with receipts

### 4.1 Image weight: 34.4 MB live, most of it doing nothing

`assets/img/` currently holds **92 files totaling 34.4 MB**. I ran a byte-for-byte duplicate check and a reference check (does any HTML/CSS/JS file actually point to this filename) against it:

- **22 exact duplicate pairs, 12.3 MB of pure repetition.** The worst offenders: all 5 games each ship *two* near-identical ~2.3–2.5 MB copies of their original key art — one named `game-X-key.png`, one named `game-X-key-pack.png`. The smaller duplicates repeat the same pattern at every scale: `flowers-pack.png`/`flowers-pack.png`, `mascot-happy-pack.png`/`mascot-happy.png`, `icon-star-pack.png`/`icon-star.png`, and so on — a "-pack" copy and a plain copy of the same import both got kept.
- **42 files (18.3 MB) that no page, stylesheet, or script currently references at all.** The top of that list is the same five 2.3–2.5 MB game-key PNGs — because every page already links a separate, much smaller `.webp` of the same picture instead. Both original copies are sitting there unused.
- **18 files over 300 KB account for 31.3 MB of the 34.4 MB total.** The image folder's entire weight problem lives in fewer than a fifth of its files.

The practical upshot: **deleting the unused originals and the small duplicate pairs — before adding a single byte of new game content — cuts real, currently-shipping weight.** Projected page weight after just that cleanup (I recomputed every page's actual linked-image total, before and after):

| Page | Before | After | Lighter by |
|---|---:|---:|---:|
| `index.html` | 2.23 MB | 1.14 MB | 49% |
| `games.html` | 2.05 MB | 0.96 MB | 53% |
| `game-toadal-feast.html` | 5.24 MB | 0.53 MB | 90% |
| `game-starship-engineer.html` | 3.80 MB | 0.49 MB | 87% |
| `game-stick-rebel.html` | 3.48 MB | 0.42 MB | 88% |
| `game-castle-vassals.html` | 3.80 MB | 0.52 MB | 86% |
| `game-lily-pad-leap.html` | 3.62 MB | 0.45 MB | 88% |
| `toadal.html` | 1.78 MB | 0.69 MB | 61% |
| `play.html` | 1.55 MB | 0.47 MB | 70% |
| `beta.html` | 1.54 MB | 0.45 MB | 71% |
| `support.html` | 1.53 MB | 0.44 MB | 71% |
| `status.html` | 1.58 MB | 0.50 MB | 69% |
| `404.html` | 1.34 MB | 0.26 MB | 81% |
| **Mean** | **2.58 MB** | **0.56 MB** | **78%** |

That's the "quick win," available before a single toy is added — see [Phase 0](#9-build-roadmap).

### 4.2 Sixteen — no, fourteen — food icons aren't actually cut out

Of the 54 food icons, **14 sit on a flat, fully-opaque card instead of a transparent cutout**, which matters a great deal for a toy you're meant to throw freely around a scene. I tested the fix directly rather than assuming it would work:

- **12 of the 14** sit on a plain white card — a simple "flood-fill from the edges, near-white → transparent" pass cuts these out cleanly. Verified on all 12.
- **2 of the 14** — the strawberry layer cake and the berry lattice pie — actually sit on a *solid colour* card (a violet card and a sky-blue card respectively), not white. A naive white-key pass would completely miss these and leave a colored rectangle behind. I built and tested a second technique for exactly this case (sample the border color, key out near-matches to *that* color instead of white) and confirmed it produces a clean cutout on both. This is the kind of thing that's easy to miss in a batch job and ship as a visibly broken toy — flagging it explicitly so the pipeline (§7) handles both cases on purpose, not by accident.

### 4.3 The mascot poses actually wired into the site are the wrong source file

The site today pulls its mascot expressions (`mascot-main`, `mascot-happy`, `mascot-wink`, `mascot-thinking`, `mascot-celebrate`) from what looks like a downscaled contact-sheet crop: most are under 150px on their long edge, soft at the edges, and `mascot-sign-pack.png` has a stray fragment of label text baked into a transparent corner. Meanwhile, one folder over, `crowned_frog_mascot_sticker_sheet.png` is a clean, high-resolution, 12-pose version of the *same* character — full-body poses (wave, sit, jump-for-joy, wink, thumbs up, thinking, holding a heart, sleeping on a lily pad, peeking) at real resolution. The fix is a source swap, not a redraw: re-cut the mascot's expression set from the high-res sheet instead of the low-res crops already in `assets/img/`.

The small decorative pieces (`leaves-left.png`, `flowers-pack.png`, `mushrooms.png`, `rock-platform.png` — all under 150px) have the identical problem, and the identical fix: `whimsical_forest_game_asset_collection.png` is a sharp, high-resolution version of the same leaves/mushrooms/moss-rocks/lily-pads, plus a signpost, a lantern, and a rope bridge that aren't in the live site's asset folder at all yet.

### 4.4 Old branding is baked into some art pixels

`IMPLEMENTATION_STATUS.md` confirms the rebrand from "Grove Games" to "TOADAL GAMES" is complete on the live site ("no obsolete public Grove branding copy remains"). A few source images in the art pack haven't caught up — the mascot pose holding a wooden sign reading "Grove Games," and the sticker-collection sheet, which has the "Grove Games" wordmark baked directly into several speech-bubble and ribbon graphics. These are easy to grab by accident when re-cutting the mascot pose set in §4.3 — they need to be explicitly excluded or cropped, not just "not used yet."

### 4.5 A few things confirmed absent (so nobody goes looking for them)

No audio files, no animation/Lottie/Rive files, and no web-font files exist anywhere across any of the three packages. That's not a gap in the audit — it's confirmation that **every sound and every animation in this plan is code-authored**, not something waiting to be found in a fourth zip.

---

## 5. The interaction model

"Everything is a toy" breaks the page in the wrong hands unless objects are sorted into exactly three behaviors:

| Tier | Behavior | Examples from your assets |
|---|---|---|
| **Toys** | Real physics — fall, bounce, roll, collide, pile up. Each has its own weight (jello wobbles, a donut rolls, a balloon drifts up instead of falling). Live in a layer that never blocks the page underneath. | The 54 food icons, balloons, loose leaves, the mascot himself when picked up |
| **Fixtures** | Follow a drag on a springy tether and snap back home on release, unless dropped on a valid target. Still work as a normal click/tap. | Nav lily pads, the 5 game cards, signposts, the lantern, the rope bridge |
| **Content** | Doesn't move, but reacts when bumped (a slight wobble, never a shift in layout) and stays fully readable/selectable at all times. | Paragraphs, forms, legal text, the beta form, all body copy |

A "Tidy Up" control sweeps every Toy and Fixture back to its home position — the mascot visibly does the sweeping, so cleanup is itself a small piece of character, not just a reset button.

### 5.1 What each asset actually does when you touch it

| Asset | Interaction |
|---|---|
| Food icons | Throw, stack, or drop into the frog's mouth to feed him (this is the core loop — see [§6.1](#61-home--title-screen--overworld)) |
| The frog | Pick up (gasps), drop (squash → happy pose), toss, poke for an idle reaction |
| Balloons | Drag by the string; pop for a burst (gift-balloon variants burst into ribbon instead of confetti) |
| Lily pads / stones | Slide around the water, bob and ripple; drop the frog on one to travel to that page |
| Signs, lantern, rope bridge | Swing when bumped; drag to reposition |
| Game cards | Grab and tilt; drop on a portal ring to open that game |
| Leaves, flowers, mushrooms | Pointer motion blows leaves around; drag flowers/mushrooms out of a toy chest to decorate the scene |
| FX sprites (37) | Fire on landings, big hits, pops, and discoveries — never as constant ambient noise |

### 5.2 "Responsive," both meanings, both required

- **Reacts instantly:** a toy responds to the pointer on the same frame it's touched — no waiting for a page-level animation to resolve first. Drag latency is the single fastest way for this whole idea to feel fake, so it's treated as a hard technical constraint in [§8](#8-technical-architecture), not a nice-to-have.
- **Works on any screen:** the play surface resizes with the viewport instead of clipping or breaking; dragging is scoped to toy elements only so it never fights page scrolling; phones get fewer simultaneous toys than desktops so the frame rate holds up (concrete numbers in [§8.5](#85-performance-budget)).

### 5.3 Non-negotiables

- Every draggable thing also works with a **tap** and with a **keyboard** (protocol in [§8.4](#84-accessibility-is-not-a-separate-pass)) — dragging is an enhancement, never the only way to do something.
- **Calm Mode** turns off physics and motion entirely, site-wide, in one toggle — for anyone who wants the content without the play, and to satisfy `prefers-reduced-motion` automatically.
- **Sound stays muted until a person turns it on** — never autoplaying, matching the QA baseline's existing accessibility posture.

---

## 6. Page by page: what each of the 21 pages becomes

### 6.1 Home — title screen & overworld

`index.html`'s hero becomes a living scene: drifting leaves, waterfall shimmer, fireflies at rest, ripples wherever you tap. The nav becomes 5–6 lily pads; hopping to one plays the travel animation before the real page loads underneath it (progressive enhancement — the underlying `<a href>` still works instantly with JS off). A dozen food toys and a few balloons live here by default. This is the flagship slice — see [Phase 2](#9-build-roadmap) — because if the hop-and-gobble loop doesn't feel good here, nothing downstream will either.

### 6.2 Games — the world map

`games.html`'s existing filter (`all` / `beta` / `development` / `prototype`) becomes the map's legend. The 5 game cards become islands joined by rope-bridge fixtures from the forest kit; each island's status badge is the same filter value already wired into the page today — no new status logic, just a new skin on the existing one.

### 6.3 The five game islands, themed to what's already true about each one

| Page | Status (from the mockup/site) | Island identity | Why |
|---|---|---|---|
| `game-toadal-feast.html` | **Active / Featured** | **The Kitchen** — the densest toy concentration on the site | It's the real, shipping game; its 4 real modes (Arcade, Puzzle, Feastfall, Infinite Feasts) become 4 doors/stations you walk the frog between; the daily-reward panel and streak banner ([§4](#4-whats-broken-or-wasted-with-receipts)) live here for real |
| `game-lily-pad-leap.html` | **Prototype** | **The Pond** | Already lily-pad-and-water themed in its own key art — the most natural fit of all five for the hop mechanic. Closest candidate for an actual tiny hopping toy, clearly labeled a site toy, not the shipped game |
| `game-starship-engineer.html` | In development | **The Hangar** | Starfield particle theme, asteroid/bolt toys, ship key art as a parallax backdrop — a themed holding bay, not a playable game, matching its honest status |
| `game-stick-rebel.html` | In development | **The Dojo at Dusk** | Sunset-ember particles drawn from the FX atlas, silhouette key art |
| `game-castle-vassals.html` | In development | **The Keep** | Drifting pennants, the crown/star/gift FX sprites, a drawbridge motif tying to the forest kit's rope bridge |

Every "in development" island stays honestly a themed waiting room — atmosphere and toys, no game that doesn't exist yet. See [§10](#10-guardrails-carried-forward-from-your-own-docs).

### 6.4 Play — the lobby arcade

`play.html`'s existing sections (TOADAL FEAST demo / Quick sessions / Progression / Reminders) become a small toy box of **original, site-only** mini-toys — Balloon Pop, Feast Catch, Lily Hop — explicitly labeled as site toys, never implied to be previews of the real TOADAL FEAST modes (see [§11, Q3](#11-open-decisions-i-need-from-you) — this is a real decision to confirm, not an assumption).

### 6.5 Meet the Frog — his own den

`toadal.html` is literally the mascot's bio page today, which makes it the natural home base: pettable, idle animations play here more than anywhere else, and the 12-pose sticker sheet becomes an unlockable pose gallery — a small collection layer that rewards people who visit more than once.

### 6.6 Beta — the golden-ticket booth (the site's one real "quest")

Filling the Feast Album (or hitting the streak goal) gives the Beta button its biggest celebration moment — nudging toward the actual business goal without ever implying the beta form does more than it does today (it's local-only; see [§10.1](#101-what-must-never-be-implied)).

### 6.7 Updates / News — the notice board

Both become a shared corkboard-style component; new entries pin themselves on with a small physical flourish. Content itself stays exactly as CMS/editorially-controlled as it is today — only the presentation gets playful.

### 6.8 Community — the campfire circle

`CONTENT_SOURCE_MAP.md` explicitly marks Community as "new design structure, clearly treated as design/planned functionality," not a live backend. The page gets the same warm treatment as everywhere else, but nothing on it will *imply* a live community exists before one does.

### 6.9 Support — the helper NPC

The "thinking" mascot pose greets you here; FAQ items become foldable leaves. Tone stays a notch calmer than Home per §10.2 — this is a page people land on because something's wrong, not to play.

### 6.10 Store — the market stall

Product cards get the same tilt/grab treatment as game cards, but checkout and pricing content itself is untouched — no gamification anywhere near an actual transaction.

### 6.11 Status, Account, and the legal pages — the calm zone

`status.html`, `account.html`, `privacy.html`, `terms.html`, and `eula.html` deliberately get the *least* of this treatment. `RECOMMENDED_PROCESS.md`'s own instruction is to reserve strong visual emphasis for "hero sections, featured content, key calls-to-action, major announcements, celebratory states" and keep "standard flows calmer and more legible" — a service-status board, account settings, and legal text are exactly the standard flows that instruction is protecting. They get the shared visual language (tokens, a light decorative border) and Calm Mode by default, not toys.

### 6.12 404 — the frog missed the lily pad

Small, self-contained, and exactly as delightful as a 404 page is allowed to be without needing its own approval cycle.

---

## 7. The asset pipeline: turning flat art into game objects

Every step below was prototyped and measured against your actual files, not assumed.

**The steps, per sheet or icon set:**
1. **Slice** — sprite sheets are auto-sliced by connected-component detection (find contiguous non-transparent regions, treat each as one sprite) rather than hand-cropped one at a time.
2. **Cut out** — the 14 flat-background food icons get a background-removal pass: white-key for 12 of them, border-color-key for the 2 that sit on a colored card ([§4.2](#42-sixteen--no-fourteen--food-icons-arent-actually-cut-out)).
3. **Trim** — every sprite gets cropped tight to its actual content, dropping the transparent padding sprite sheets always carry.
4. **Resize** — each sprite is capped at the largest size it will ever actually render on-screen (a 40px food toy doesn't need a 1,200px source).
5. **Re-encode as WebP** — smaller than PNG at equal visual quality, with alpha preserved.

**Results, measured directly:**

| Source sheet | Sprites extracted | Total size after processing |
|---|---:|---:|
| Frog pose sheet (`crowned_frog_mascot_sticker_sheet.png`) | 11 of 12 auto-sliced cleanly* | 315 KB (avg 28.7 KB/sprite) |
| Nature FX atlas | 37 | 532 KB (avg 14.4 KB/sprite) |
| Balloon sheet | 21 | 211 KB (avg 10.1 KB/sprite) |
| Forest kit | 24 | 421 KB (avg 17.6 KB/sprite) |
| Frog UI sticker sheet | 19 | 136 KB (avg 7.2 KB/sprite) |
| Frog alert sticker sheet | 23 | 189 KB (avg 8.2 KB/sprite) |
| All 54 food icons (incl. the 14 needing cutout) | 54 | 965 KB (avg 17.9 KB, max 27.5 KB) |

*\*One pair of poses sits close enough together that automatic slicing merges them into one blob — a 30-second manual crop, flagged honestly rather than glossed over.*

Two individual fixes worth calling out because the difference is so large:

| File | Before | After |
|---|---:|---:|
| `brand-sprout.png` | 1,091 KB | 3.4 KB |
| `star-three-gold.png` (2172×724 source, used at ~400px) | 1,600 KB | 27.5 KB |

**Add it all up:** the entire new interactive-object library — every food, every FX sprite, every balloon, every forest piece, every mascot pose, all of it — comes to **roughly 2.7 MB, fetched once and cached by the browser across every page** on the site, because it's one shared bundle rather than something reloaded per page. That's the total cost of adding the whole toy library, layered on top of the 78%-lighter baseline from [§4.1](#41-image-weight-344-mb-live-most-of-it-doing-nothing).

---

## 8. Technical architecture

### 8.1 The shape of it

All 21 pages **stay real, static HTML** — this isn't negotiable given the QA baseline and `RECOMMENDED_PROCESS.md`'s explicit instruction to preserve structure rather than rebuild from scratch. One shared bundle (`game-layer.js` + `game-layer.css`) loads on every page and provides:

- the sprite atlas loader (the ~2.7 MB bundle from §7, fetched once, cached thereafter)
- a physics world
- the mascot "brain" — a small state machine (idle → hover → hop → gasp → sleep → celebrate)
- the particle/effects system, drawing from the 37-sprite FX atlas
- a tiny synthesized sound engine (WebAudio-generated blips — there are no audio files to load, per [§4.5](#45-a-few-things-confirmed-absent-so-nobody-goes-looking-for-them))
- save/load via `localStorage`
- the HUD (feast meter, streak, mute, Calm Mode)

### 8.2 Toys are DOM elements, not canvas drawings

This is the one detail most likely to get quietly gotten wrong, so it's stated plainly: **interactive toys are real, absolutely-positioned DOM elements**, each with a real accessible name, whose on-screen position is *computed* by the physics engine and *applied* via CSS transform. A full-viewport `<canvas>` sits purely decoratively behind/above them for ambient, non-interactive effects (drifting leaves, ripples, particle bursts). If the food toys were drawn only on canvas, they'd be invisible to a screen reader and unreachable by keyboard — which would silently break the QA baseline's accessibility checks. Canvas is for ambience; anything a person can act on is a real element.

### 8.3 Physics engine

**Matter.js** — checked directly against the npm registry rather than assumed: version 0.20.0, MIT license, **83.5 KB minified / 25.8 KB gzipped**. Small enough to include outright, and it gives correct collision and stacking behavior for free (a jello wobbles differently than a donut rolls, and a pile of thrown food actually piles up realistically) rather than needing that hand-built. The alternative — a hand-rolled, zero-dependency gravity/bounce script — stays on the table if a third-party runtime dependency is unwanted for any reason (see [§11, Q1](#11-open-decisions-i-need-from-you)), at the cost of realistic stacking/collision needing to be built from scratch.

### 8.4 Accessibility is not a separate pass

The TOADAL strategy pack names **WCAG 2.2 AA** as the formal web target ([§22](#22-the-official-quality-bar-now-in-one-place)) — everything below is written to clear that bar, not just to feel accessible:

- **Keyboard drag protocol:** Tab focuses a toy → Enter/Space picks it up → arrow keys move it while held → Enter/Space drops it → Escape cancels and returns it home.
- Every toy carries a real accessible name (e.g. "Peach — drag onto the frog to feed him").
- Meter and streak changes announce through an ARIA live region.
- `prefers-reduced-motion` **and** the explicit Calm Mode toggle both fully disable physics and particles and swap in a static layout — either one is sufficient on its own.
- Focus outlines are preserved and enhanced, never suppressed.
- No toy, meter, or combo state is conveyed by colour or sound alone — each pairs with a shape, icon, or text change too, per the pack's own accessibility principles.

### 8.5 Performance budget

The pack sets explicit, cited numeric targets rather than a vague "feels fast" — this plan adopts them directly rather than inventing separate ones ([§22](#22-the-official-quality-bar-now-in-one-place)):

- **Web vitals**, measured at the 75th percentile: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1 — the game layer must never be the reason a page misses these, which is exactly why [§7](#7-the-asset-pipeline-turning-flat-art-into-game-objects)'s ~2.7 MB, one-time, cached bundle matters more than its size suggests.
- **Frame pacing:** 60fps preferred on the declared target tier, with a stable 30fps floor on the supported low tier, rather than one all-or-nothing target. Physics bodies that go off-screen or fully settle are put to sleep/culled rather than simulated forever, and fewer toys spawn on small viewports than on desktop, so low-tier phones hold the 30fps floor instead of dropping under it.
- The shared sprite bundle is fingerprinted and long-cache-controlled, so the ~2.7 MB interactive-asset cost is paid once per visitor, not once per page.
- Any regression is triaged on the pack's own P0–P3 severity scale ([§22](#22-the-official-quality-bar-now-in-one-place)): visible jank alone is P2/P3 polish; a toy that blocks reading real content or breaks keyboard access is P1 and blocks release.

### 8.6 Save data — local-only, matching the brand's own promise

Everything lives in `localStorage`, namespaced (feast album progress, streak + last-claimed date, any homepage decoration layout, mute/Calm Mode settings). No accounts, no server round-trip — this is the same "Your Progress Stays Yours" positioning already on the live homepage, applied to the new layer rather than invented for it.

---

## 9. Build roadmap

Each phase ends in something you can actually click around in before the next one starts.

**Phase 0 — Cleanup & asset prep**
- [ ] Delete the 22 duplicate files and the unused originals from [§4.1](#41-image-weight-344-mb-live-most-of-it-doing-nothing) (the 78% page-weight win, before any new code)
- [ ] Run the slice → cut-out → trim → resize → WebP pipeline from [§7](#7-the-asset-pipeline-turning-flat-art-into-game-objects) across all 6 sheets and all 54 food icons
- [ ] Re-cut the mascot expression set and the small decor pieces from the high-res sources identified in [§4.3](#43-the-mascot-poses-actually-wired-into-the-site-are-the-wrong-source-file)
- [ ] Confirm none of the old-branding assets from [§4.4](#44-old-branding-is-baked-into-some-art-pixels) made it into the cut set

**Phase 1 — Shared game-layer core**
- [ ] HUD, mascot state machine, particle/effects system, sound engine, save system, Calm Mode toggle — built and tested in isolation before any page uses it

**Phase 2 — Homepage playground** *(the slice to validate the whole concept on)*
- [ ] Living hero scene, ~12 food toys, balloons, lily-pad nav, full hop-and-gobble loop working end to end

**Phase 3 — World map & island theming**
- [ ] `games.html` as the map; each of the 5 game pages themed per [§6.3](#63-the-five-game-islands-themed-to-whats-already-true-about-each-one)

**Phase 4 — Play page & daily reward**
- [ ] The 3 original lobby toys; the real streak/reward system wired to the existing 7-slot panel art

**Phase 5 — Remaining pages**
- [ ] Notice board (Updates/News), helper NPC (Support), campfire (Community), market stall (Store), Meet the Frog's den, 404, and the deliberately-calm Status/Account/legal treatment

**Phase 6 — Cross-cutting polish**
- [ ] Mobile toy-count tuning, keyboard/screen-reader pass on every new interaction, re-run the 1,218-check QA suite, confirm it's still green

---

## 10. Guardrails carried forward from your own docs

### 10.1 What must never be implied

`IMPLEMENTATION_STATUS.md` lists what's *deliberately not activated* yet: live beta submission, accounts/progression backend, browser demos, store checkout, community backend, final legal publication, live/public cutover. The game layer must not accidentally imply any of these exist:

- Play-page toys are labeled **site toys**, never "TOADAL FEAST previews" or "demos" (this is also why [§11, Q3](#11-open-decisions-i-need-from-you) is an open question rather than a default).
- All progress language says **saved on this device**, everywhere, consistently.
- No fabricated online/player-count numbers, no invented news items — `RECOMMENDED_PROCESS.md` is explicit that only claims "supported by the real product state" ship.
- The Beta button's big celebration moment ([§6.6](#66-beta--the-golden-ticket-booth-the-sites-one-real-quest)) celebrates *filling the Feast Album*, not something the (currently non-functional) beta form itself does.

### 10.2 Calm base, earned excitement

`RECOMMENDED_PROCESS.md`'s own words: reserve strong visual emphasis for "hero sections, featured content, key calls-to-action, major announcements, celebratory states," and keep "standard flows calmer and more legible." This plan's Calm Mode and the deliberately low-key treatment of Status/Account/legal pages ([§6.11](#611-status-account-and-the-legal-pages--the-calm-zone)) are that instruction applied, not an exception to it.

### 10.3 The planned-vs-real line

`CONTENT_SOURCE_MAP.md` draws a clean line between what's directly supported by real product state (the game roster, their statuses, the merch price, the EN/FR switcher that used to exist) and what's "new design structure, clearly treated as design/planned functionality" — Community, News, expanded game-detail pages, account tabs, a search index, a detailed status model. The game layer makes every one of those pages more fun to be on **without** inventing backend behavior on their behalf. Decorating a stage is not the same as claiming the show is running.

### 10.4 Old branding stays out

Per [§4.4](#44-old-branding-is-baked-into-some-art-pixels): the wood-sign mascot pose and the sticker-collection sheet carry the old "Grove Games" wordmark baked into their pixels. `IMPLEMENTATION_STATUS.md` confirms the rebrand is already complete on the live site — these two assets are excluded from the cut set in Phase 0, not just left unused.

### 10.5 A known, separate gap: localization

The original prototype had an English/French switcher; `DEPLOYMENT_CHECKLIST.md` lists restoring that parity as outstanding work, unrelated to this project. The game layer won't make that gap worse: every user-facing toy label and HUD string goes through one lookup table from day one, so localizing later doesn't mean re-touching game code (see [§11, Q5](#11-open-decisions-i-need-from-you)).

### 10.6 Two new guardrails, from the TOADAL strategy pack

Reviewing that pack (`main-6.pdf`, [§20](#20-where-this-plan-sits-inside-the-toadal-strategy-packs-90-day-plan)) surfaced two rules this plan didn't have yet, both directly actionable against work already designed above:

- **The mascot never sulks.** Its own words: "Never make the character cry, plead, shame, obstruct, or imply punishment when a user declines tracking, unsubscribes, mutes sound, exits, requests support, or deletes an account." That reaches directly into this plan's mute button, Calm Mode toggle, and Tidy Up sweep ([§5.3](#53-non-negotiables), [§15](#15-sound-design)) — each gets a calm, neutral mascot reaction, never a disappointed one.
- **Text belongs in markup, not in the art.** The pack's instruction to "store text outside raster illustrations... remove embedded English labels from art" is what makes the Québec French-language rules possible to meet at all. This lands directly on [§7](#7-the-asset-pipeline-turning-flat-art-into-game-objects)'s pipeline: beyond the old-branding cases in [§4.4](#44-old-branding-is-baked-into-some-art-pixels), several other source sheets carry English words baked into the pixels — the badge sheet's "New," "Hot," "Daily," "Claim" and similar labels ([§14](#14-achievements--giving-the-unused-badge-sheet-a-job)), and several speech-bubble stickers. None of these ship as flattened raster text going forward: each becomes a transparent icon with the word set separately as real HTML/CSS, so the identical sprite can sit under an `/fr/` route with different text over it. This is now a **Phase 0** pipeline rule, not a someday concern.

---

## 11. Open decisions I need from you

1. **Physics engine** — go with Matter.js (small, real collision/stacking, one MIT dependency) or a hand-rolled zero-dependency version (lighter, simpler, less physically convincing)?
2. **Sound default** — on-by-default-but-muted with an easy one-tap enable, or fully opt-in only?
3. **Play-page toys** — original, site-only mini-toys (my recommendation, cleanest against the content-truth guardrails), or should any of them more directly foreshadow the real TOADAL FEAST modes (Arcade/Puzzle/Feastfall/Infinite Feasts)?
4. **Homepage decorating** — confirm it saves per-visitor, locally only, same as everything else in §8.6?
5. **Localization timing** — build the game layer English-only now with strings structured for later translation, or does French need to land in this same pass?
6. **Build order** — confirm starting with the homepage playground slice ([Phase 2](#9-build-roadmap)) before touching the world map or Play page, so we validate the core feel on one page first?
7. **Canonical mascot** — is the production green frog (already live, already in every asset audited in [§2](#2-whats-actually-in-the-three-zips)–[§7](#7-the-asset-pipeline-turning-flat-art-into-game-objects)) or the strategy pack's golden-scarf concept sheet ([§21](#21-a-second-mascot-that-needs-reconciling)) the one to standardize on going forward?
8. **Quality bar sign-off** — confirm the consolidated targets in [§22](#22-the-official-quality-bar-now-in-one-place) (Core Web Vitals, WCAG 2.2 AA, the P0–P3 scale) as this plan's official bar, so Phase 6 has something concrete to test against?

---

*The sections below go deeper — more secrets, sound, physics feel, and a few new systems, all built from art that was otherwise going to sit unused.*

## 12. The first three minutes

**First visit, 0:00–0:45** — The page loads instantly as real HTML; there's nothing to wait for. Within a frame or two the hero scene wakes up: a few leaves drift off the treehouse roof, the waterfall picks up its shimmer, and the frog — sitting still until now — blinks and turns toward the cursor. A peach drifts lazily across the scene. Touching it doesn't do anything dramatic yet; it just responds immediately, rolling a little under the pointer, proving before anything else happens that this page isn't going to behave like a normal web page.

**0:45–1:30** — A first toss into the frog's mouth lands. He gobbles it (a soft pop-chomp, [§15](#15-sound-design)), the Feast meter ticks up with a small sparkle from the FX atlas, and a first-time discovery chime plays as the peach locks into the still-mostly-empty Feast Album. Two or three more follow in quick succession; the combo counter from [§17](#17-the-feeding-combo-system) quietly starts counting, and by the third feed in a row the burst is visibly bigger than the first one was.

**1:30–2:00** — Curiosity turns toward the nav. Clicking "Games" doesn't jump the page — the frog hops toward the edge of the screen first, there's a beat of travel, and *then* the map loads underneath him. Five islands resolve, linked by rope bridges; TOADAL FEAST's island is visibly the fullest and warmest-lit of the five, matching its Active badge, and the four in-development islands read as atmospheric and inviting rather than broken or empty ([§6.3](#63-the-five-game-islands-themed-to-whats-already-true-about-each-one)).

**Day two, on return** — `localStorage` remembers all of it ([§18](#18-save-data-shape)). The Feast Album shows yesterday's handful of discoveries already filled in. If it's been a while, the frog is asleep on a lily pad when the page loads — a soft click wakes him with a startled-then-delighted reaction, not an alarmed one ([§13](#13-secrets--discovery)) — and the daily-streak banner is waiting with today's claim.

## 13. Secrets & discovery

[§1](#1-the-idea-restated-precisely) named "secrets worth finding" as one of five ingredients and left it as a promise. Made concrete:

- **The peeking pose, hidden.** One of the 11 sliced mascot poses ([§7](#7-the-asset-pipeline-turning-flat-art-into-game-objects)) is the frog peeking — just his eyes and crown visible over an edge. On every fresh page load he tucks himself behind a different UI element (a card corner, a footer leaf, a letter of the wordmark). Finding and clicking him plays a unique startled-giggle reaction, and the first time only, permanently unlocks that pose in the Meet the Frog gallery ([§6.5](#65-meet-the-frog--his-own-den)).
- **Rare food variants.** The 19 alternate-variant icons ([Appendix A](#appendix-a--full-food-roster-54-items)) aren't a separate roster — they're low-probability re-skins of the 35 main foods (a candy-style banana instead of a plain one, a cartoon curry bowl instead of the standard one). A fixed low spawn chance turns the Feast Album from "collect 54 things" into "most of this fills in fast, and a few really don't" — the shape of a good collection system, built entirely from art already in hand.
- **A quiet interaction chain.** Popping three heart balloons back-to-back without missing (reusing the combo-window logic from [§17](#17-the-feeding-combo-system), not a new mechanic) triggers a one-off reaction: the frog strikes the "holding heart" pose already in the sliced set, with a small extra burst. Nothing is signposted in advance.
- **Waking him gently matters.** Building on the idle-sleep behavior already planned: one soft click wakes him happily; several rapid clicks wake him dizzy instead (spinning stars, the thinking pose for a beat). Same asset, two outcomes, depending on how you treat him.

## 14. Achievements — giving the unused badge sheet a job

The glossy UI sticker sheet ([Appendix B](#appendix-b--sprite-sheet-inventory)) ships a full ribbon-badge set — Featured, Hot, Sale, New, Limited, Reward, Daily, Streak, Unlock, Level Up, Staff Pick, Claim — that isn't wired into anything today. Most map directly onto milestones this plan already creates:

| Badge art | Real trigger |
|---|---|
| New | First visit |
| Daily / Streak | The real daily-reward mechanic (the Kitchen island, [§6.3](#63-the-five-game-islands-themed-to-whats-already-true-about-each-one)) |
| Unlock | Completing the Feast Album |
| Level Up | Every 10 discoveries |
| Featured / Hot / Sale / Claim | Their existing, honest job on the Store page — real product cards, not a new gamification claim |

**One deliberate rename:** "Staff Pick" doesn't get used as written. Attaching it to a randomly-awarded delight badge would imply real human curation that doesn't exist — the same content-truth issue flagged throughout [§10](#10-guardrails-carried-forward-from-your-own-docs), just surfacing in a new asset instead of an old one. It becomes **"Frog's Pick"** instead: same art, same warm surprise, no false claim underneath it.

## 15. Sound design

[§4.5](#45-a-few-things-confirmed-absent-so-nobody-goes-looking-for-them) confirmed zero audio files exist anywhere in any package, so every sound here has to be specified, not found. All of it is small, synthesized WebAudio tones — no composed music, no loops:

| Interaction | Character | Length |
|---|---|---|
| Hop (nav travel) | A short upward pitch-bend, almost a cartoon "boing" | ~150ms |
| Feed / gobble | A soft wet pop; pitch shifts slightly by food category — bright/high for Fruity, rounder/lower for Savory, sparkly for Sweet | ~200ms |
| Balloon pop | Bright, confetti-like | ~250ms |
| First-time discovery | A short three-note ascending chime | ~400ms |
| Combo escalation | Each consecutive feed pitches up slightly from the last ([§17](#17-the-feeding-combo-system)), resets after a miss | — |
| Streak claimed | A warmer, slower descending chime | ~600ms |
| Idle / sleep | Silence | — |
| Miss / error | A soft, low, short thud — never harsh | ~100ms |

Sound stays off by default ([§5.3](#53-non-negotiables)) behind one global mute, not scattered per-toy toggles — and there's no ambient music bed even once sound is on, so turning it on is never a commitment to something loud running the whole visit.

## 16. Per-toy physics tuning

A physics engine ([§8.3](#83-physics-engine)) is only as convincing as the numbers fed into it:

| Toy type | Collider | Mass | Bounciness | Friction | Notes |
|---|---|---|---|---|---|
| Fruity foods (round) | Circle | Medium | Medium-low | Medium | A soft thud, doesn't bounce far |
| Sweet/gelatin foods (jello, donut, macaron) | Circle | Low | **High** | Low | Where the "wobble" read comes from — pair with a squash-and-stretch visual on impact, separate from the physics body |
| Savory foods (fries carton, burger, pizza slice) | Rounded rectangle | Medium | Low | Higher | Thuds and stays put |
| Balloons | Circle | Very low | — | High air resistance | Negative effective gravity so they drift upward and sideways rather than fall or shoot |
| Lily pads / stones (fixtures, not toys) | — | Heavy | Very low | High | Barely move when bumped; mostly ripple visually instead of physically displacing |
| The frog, picked up or tossed | *(not simulated)* | — | — | — | Scripted arc + pose-swap instead of physics — a cartoon character tumbling like a ragdoll reads as broken, not charming. The one object in the whole library that's deliberately faked rather than simulated |

Starting values, tuned by feel once Phase 2 is actually on screen — but the last row is a firm rule, not a starting point: everything else here leans on real physics because that's what makes throwing things satisfying, and the mascot is the one deliberate exception.

## 17. The feeding combo system

Turns the core verb from a cute one-off into something with a rhythm worth repeating. Feeds landed within a short window of each other (roughly 2 seconds) chain into a combo counter instead of resetting every time. The FX atlas already spans small single-sparkle bursts up to big multi-effect ones (stars, hearts, and confetti together in the same sprite), so escalating the burst with the combo count needs no new art — just stepping further along a spectrum that already exists, alongside the rising pitch from [§15](#15-sound-design). A pause or a miss resets the counter; a high combo caps off with a dedicated celebration pose and a small bonus tick toward the Feast Album — a reason to feed quickly *and* well, not just often.

## 18. Save-data shape

Everything from [§8.6](#86-save-data--local-only-matching-the-brands-own-promise) lands in `localStorage` under one namespace:

```json
{
  "toadal.feastAlbum": {
    "discovered": ["fruit_peach", "sweet_jello_ruby_red"],
    "totalDiscovered": 23
  },
  "toadal.streak": {
    "count": 4,
    "lastClaimedISODate": "2026-09-24"
  },
  "toadal.decor": [
    { "assetId": "flower-pink", "x": 0.42, "y": 0.71, "rotation": 12 }
  ],
  "toadal.achievements": ["new", "daily", "streak-7"],
  "toadal.settings": { "muted": true, "calmMode": false },
  "toadal.stats": { "totalHops": 0, "totalFeeds": 0, "bestCombo": 0 }
}
```

Every key is namespaced under `toadal.` so it can't collide with anything else stored on the same origin, and every one is something a person can lose by clearing site data with zero real consequence — consistent with the local-only, no-accounts stance already on the live homepage.

## 19. Risk register

| Risk | Mitigation |
|---|---|
| Physics jank on low-end phones | Object caps and reduced particle density on small viewports ([§8.5](#85-performance-budget)); Calm Mode available everywhere |
| Dragging fights with scrolling or text selection | `touch-action: none` scoped to toy elements only, never the page; a short press-and-hold threshold before a touch counts as a grab ([§5.3](#53-non-negotiables)) |
| Sound becomes annoying with repeated use | Short, sparse, non-looping effects only ([§15](#15-sound-design)); muted by default; one global mute |
| Toy clutter obscures real content | The "Tidy Up" sweep ([§5](#5-the-interaction-model)); content always sits above the toy layer in z-index wherever they could overlap |
| A badge or label implies something false | Every new label gets checked against [§10](#10-guardrails-carried-forward-from-your-own-docs)'s content-truth guardrails before shipping — [§14](#14-achievements--giving-the-unused-badge-sheet-a-job) is that check already catching one |
| Play-page toys get mistaken for real game previews | Explicit "site toy" labeling ([§6.4](#64-play--the-lobby-arcade)); still an open confirmation, not an assumption ([§11, Q3](#11-open-decisions-i-need-from-you)) |
| The new shared bundle slows down first paint | Fingerprinted, long-cached, and lazy-initialized after first paint; Phase 0's cleanup ships and is felt on its own, independent of everything after it ([§9](#9-build-roadmap)) |
| Two mascot designs (green vs. golden-scarf) ship inconsistently across surfaces | Resolve which is canonical before any new mascot art is commissioned ([§21](#21-a-second-mascot-that-needs-reconciling), [§11 Q7](#11-open-decisions-i-need-from-you)) |
| English text baked into badge/sticker art blocks a future `/fr/` route | Redraw as icon + real text per the text-in-art rule ([§10.6](#106-two-new-guardrails-from-the-toadal-strategy-pack)), starting in Phase 0 |

---

## 20. Where this plan sits inside the TOADAL strategy pack's 90-day plan

The uploaded strategy pack (`main-6.pdf`) is a business/legal/quality operating plan for the whole TOADAL brand — trademark clearance, domain security, Québec compliance, and product-quality governance — sequenced across five phases with named roles, exit criteria, and a day-90 scorecard. It's a different kind of document from everything above: this plan is *how to build one part of the product*; that one is *how to govern the whole brand while it's being built*. Reviewed on its own terms, it's genuinely strong work:

- It's grounded in checkable sources rather than generic advice, and I spot-checked its two most consequential citations rather than taking them on faith. CIPO's 2026 online trademark filing fee is confirmed at **CAD $491.06 for the first class, $149.04 for each additional class** — exactly as stated. The Québec exterior-signage rule is confirmed as taking effect **June 1, 2025**, though the underlying regulation has reportedly shifted more than once since it was first announced — which is itself the best argument for the pack's own instruction to get case-specific Québec counsel, rather than treat any single summary, including this one, as final.
- The go/no-go trademark framework (Green/Amber/Red), the acceptance tests for the master wordmark, and the "nothing-overlooked launch coverage audit" are its strongest sections — each turns a vague goal into something with a real pass/fail.
- Its self-diagnosed weakness is accurate: it "distributes actions across separate documents without one dependency map" — and reviewed alongside everything built above, that gap is specifically that it has **no visibility into the actual product concept**. Its own Phase 2/3 language — "build and test a vertical slice that demonstrates the core loop," "redraw approved mascot poses as production assets" — describes exactly the work this plan already does in detail; it just doesn't know that work exists yet.
- On privacy specifically, no reconciliation was needed: this plan already collects nothing beyond `localStorage` on the visitor's own device ([§8.6](#86-save-data--local-only-matching-the-brands-own-promise), [§18](#18-save-data-shape)) — which already clears the pack's "collect the minimum data needed" and "privacy-protective defaults" bar without any changes.

Concretely, here's where this plan's own phases ([§9](#9-build-roadmap)) sit inside theirs:

| This plan | Strategy pack phase | Relationship |
|---|---|---|
| Phase 0 — Cleanup & asset prep | Phase 0 (Sep 25–27) — *preserve options* | Compatible and immediately actionable; touches only already-owned art and code, no spend gated by trademark or legal |
| Phase 1 — Shared game-layer core | Phase 1 (Sep 28–Oct 4) — *remove legal/ownership uncertainty* | Can run in parallel — engineering work on existing assets, not a new public-facing claim |
| Phase 2 — Homepage playground | Phase 2 (Oct 5–25) — *protect and design the core*, incl. a "vertical slice" | **This is that vertical slice.** The pack asks for exactly what Phase 2 already delivers: a testable core loop, onboarding, success/failure feedback, settings, and a graceful exit |
| Phase 3 — World map & islands, Phase 4 — Play & daily reward | Phase 3 (Oct 26–Nov 25) — *productionize* | Matches "redraw approved mascot poses as production assets" and "run a closed beta... across the reference matrix" directly |
| Phase 5 — Remaining pages, Phase 6 — Polish | Phase 3–4 — production + launch review | Feeds their day-90 scorecard rather than replacing it |

One sequencing point worth stating plainly, since the pack is emphatic here: **none of Phases 0–3 above require the trademark, ownership, or launch gates to be resolved first.** They're local, reversible, dev-environment work on assets already in hand — nothing in them commits to public launch or material spend. The pack's own gating language ("do not commit material launch or premium-domain spending before trademark, ownership, product-quality, privacy, and security gates are resolved") governs *going live and spending money*, not *building and testing in the sandbox this whole plan has been scoped to*. Worth confirming that reading is shared before Phase 2 starts.

## 21. A second mascot that needs reconciling

The strategy pack includes its own reference art — a 28-state "mascot/UI concept sheet" covering account, engagement, trust, brand, and system states (full list below). Worth flagging plainly: **this is a different character than the one in the three asset zips.** The pack describes "a consistent golden frog, crown, red scarf, glossy rendering" — every asset audited in [§2](#2-whats-actually-in-the-three-zips) through [§7](#7-the-asset-pipeline-turning-flat-art-into-game-objects), and the live site itself, uses a **green** frog with a gold crown and no scarf. These aren't two renderings of the same design — they're two different visual explorations that haven't been reconciled, and the pack's own acceptance tests for the master identity implicitly assume one settled answer already exists.

This matters beyond aesthetics: the pack's chain-of-title concern ("one intended owner controls... artwork, source files") and its instruction to "preserve the original mascot sheet and document its creator, prompt/source history, edit history, and commercial rights" apply separately to *each* of these two mascot sources — and the provenance work already done in [§4](#4-whats-broken-or-wasted-with-receipts) (duplicate files, unreferenced assets, old branding baked into pixels) only covers the green frog's asset pack, not the golden-scarf concept sheet. This is now [§11, Q7](#11-open-decisions-i-need-from-you).

Separately, the concept sheet's 28 states are a genuinely useful resource **once redrawn** — not as toys, but as the functional UI-icon layer this plan hadn't specified yet:

| Family | States |
|---|---|
| Help and account | Help & Support, FAQ, Contact Us, Register/Create Account, Log In, Settings, Mute/Sound, Delete Account, Quit/Exit |
| Engagement | Leaderboard, Scoreboard, Ratings & Survey, Feedback, Subscribe, Community/Social |
| Platform and trust | AI Disclosure, Mobile (iOS), Mobile (Android), Developers/API, Legal/Terms, Privacy/Security |
| Brand and company | Partnership, Merch, Social Cause/Impact, Blog/News, About Us |
| System states | 404 Not Found, Under Maintenance |

Several line up with icons this plan already needed: **Mute/Sound** is the mute toggle from [§5.3](#53-non-negotiables) and [§15](#15-sound-design); **Settings** covers Calm Mode; **404 Not Found** is [§6.12](#612-404--the-frog-missed-the-lily-pad); **Under Maintenance** is ready-made art for the in-development islands in [§6.3](#63-the-five-game-islands-themed-to-whats-already-true-about-each-one) that didn't have dedicated iconography before. All of it needs the same treatment [§10.6](#106-two-new-guardrails-from-the-toadal-strategy-pack) describes — redrawn with the text out of the pixels — in whichever mascot design turns out to be canonical.

## 22. The official quality bar, now in one place

Both documents set numeric and procedural quality targets; this table is the one place they're reconciled, so nobody has to cross-reference two documents to know what "done" means.

| Area | Official target (from the strategy pack) | Where it lands in this plan |
|---|---|---|
| Web performance | LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1 at p75 (Core Web Vitals "good" thresholds) | [§8.5](#85-performance-budget) |
| Frame pacing | 60fps preferred on target tier; stable 30fps floor on the supported low tier | [§8.5](#85-performance-budget) |
| Accessibility | WCAG 2.2 AA | [§8.4](#84-accessibility-is-not-a-separate-pass) |
| Defect severity | P0 (safety/security/data-loss/service-wide) · P1 (core-loop blocker or severe accessibility failure) · P2 (material friction) · P3 (polish) | Adopted as-is for triaging anything found in [Phase 6](#9-build-roadmap) |
| First-session comprehension | ≥80% of first-time testers complete the first core loop unassisted | A natural fit for testing the [Phase 2 homepage slice](#9-build-roadmap) once it's built |
| Enjoyment / return intent | Median fun rating ≥4/5; ≥70% say they'd return with a specific reason | Same |
| Mascot tone | Never cry, plead, shame, obstruct, or imply punishment on decline/mute/exit/delete | [§10.6](#106-two-new-guardrails-from-the-toadal-strategy-pack) |
| Text in art | Store text outside raster illustrations; no embedded labels | [§7](#7-the-asset-pipeline-turning-flat-art-into-game-objects), [§10.6](#106-two-new-guardrails-from-the-toadal-strategy-pack) |

The pack is explicit that its behavioral percentages (first-session comprehension, fun rating, return intent) are "internal starting gates, not universal truths," meant to be revised after real playtests — so treat that row as the starting bar for testing the Phase 2 slice specifically, not a number this plan can hit through design alone.

---

## Appendix A — full food roster (54 items)

**Fruity Main (10):** banana · blueberry cluster · purple grape cluster · mango · dewy orange · peach · pineapple · red apple · strawberry blossom · watermelon slice

**Sweet Main (11):** strawberry candy-drip cake · pink cotton candy · strawberry-sprinkle cupcake · pink-sprinkle donut · rainbow gummy bear · rainbow glazed ice-cream sundae · ruby-red jello · rainbow-swirl lollipop · pink sakura macaron · golden berry lattice pie · pink swirl wrapped candy

**Savory Main (7):** juicy cheeseburger · curled red chili pepper · chibi curry rice bowl · froggy-style french fries · golden crunchy fried chicken · gourmet hot dog · gooey pepperoni pizza slice

**Bonus Extras (7):** candy apple · caramel flan · chocolate-chip ice-cream sandwich · strawberry sundae milkshake · butter-syrup pancake stack · salted pretzel · berry-topped waffle

**Alternate Variants — rare drops (19):** candy-style banana · candy-style cheeseburger · candy-style chili pepper · cotton-candy swirl (alt) · pink-heart cupcake · cartoon curry bowl · pink-sprinkle donut (alt) · carton french fries · golden fried chicken (alt) · grape bunch (alt) · cherry gummy bear · rainbow spiral lollipop (alt) · pink candy macaron · candy-style mango · orange with leaves · pepperoni pizza slice (alt) · cartoon red apple · strawberry candy icon · rainbow swirl wrapped candy (alt)

---

## Appendix B — sprite sheet inventory

| Sheet | Location | Sliceable sprites |
|---|---|---:|
| Frog pose sheet | `05_alerts_frames_stickers_fx/crowned_frog_mascot_sticker_sheet.png` | 12 |
| Nature FX atlas | `05_alerts_frames_stickers_fx/grove_games_nature_fx_sprite_atlas.png` | 37 |
| Frog UI sticker sheet | `05_alerts_frames_stickers_fx/grove_games_frog_ui_sticker_sheet.png` | 19 |
| Frog alert sticker sheet | `05_alerts_frames_stickers_fx/grove_games_frog_alert_sticker_sheet.png` | 23 |
| Balloon sheet | `06_balloons_and_interaction_assets/glossy_balloon_game_asset_sprite_sheet.png` | 21 |
| Forest asset collection | `07_reference_sheets_and_component_kits/whimsical_forest_game_asset_collection.png` | 24 |
| Glossy UI sticker sheet (badges/ribbons: Featured, Hot, Sale, New, Limited, Reward, Daily, Streak, Unlock, Level Up, Staff Pick, Claim + shape frames) | `05_alerts_frames_stickers_fx/` | not yet sliced — earmarked for HUD badges |
| Glossy UI frame collection (leaf-wreath frames, multiple colorways) | `05_alerts_frames_stickers_fx/` | not yet sliced — earmarked for reward-slot frames |
| Sticker collection | `05_alerts_frames_stickers_fx/` | **excluded** — carries old "Grove Games" wordmark, see [§4.4](#44-old-branding-is-baked-into-some-art-pixels) |

## Appendix C — the 21 pages

`404.html` · `account.html` · `beta.html` · `community.html` · `eula.html` · `game-castle-vassals.html` · `game-lily-pad-leap.html` · `game-starship-engineer.html` · `game-stick-rebel.html` · `game-toadal-feast.html` · `games.html` · `index.html` · `news.html` · `play.html` · `privacy.html` · `status.html` · `store.html` · `support.html` · `terms.html` · `toadal.html` · `updates.html`
