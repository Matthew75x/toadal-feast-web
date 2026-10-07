# Gameplay previews in share cards — design evaluation

Date: 2026-10-07. Scope: evaluate and prototype the user's device-frame/game-preview idea. These are local design examples; screenshot capture, screenshot upload and fair challenge configuration are not implemented by this evaluation.

## Recommendation

Use one genuine preview of the selected game inside a restrained generic device frame. Keep the game name, invitation or challenge headline, score and one call to action readable outside the screen. Preserve gameplay proportions. A phone frame, tablet frame and computer frame are presentation styles; Android is an operating system, not a separate screen shape. Frame selection must not claim unsupported app availability.

Use the existing immutable public-link/static-image service. Add a game presentation registry rather than duplicating services for every game. Recommended dimensions are 1200×630 for the primary link preview, with separately composed square and portrait exports where useful. Do not simply crop the wide card into those alternate formats. The destination app controls its preview presentation and may omit or crop images. Keep the game name and score in link metadata and accompanying share text too.

## How the website montage was made

The editable Studio Home composition has core.image nodes inside figure/container nodes. CSS adds phone bezels, a decorative notch, rounded corners, shadows, rotation and overlapping layers. The two wide supporting panels are landscape screenshot cards, not tablet hardware mockups. It is not a single rendered montage asset.

Source authority: Matthew75x/toadal-feast-web staging/live-visual commit efd528061ddf94fabe3fc3b886c0f66636e29f1a. The five commits since the implementation checkout baseline f53176f0 preserve this montage's Studio source, CSS and artwork; newer exported intrinsic dimensions do not fix its authored proportions.

- Composition: studio-project/toadal-feast-website/pages/home.json, around line 3804.
- Frame CSS: reference/assets/css/site.css, around lines 6333–6459.
- Provenance: assets/index.json, gameplay capture records around line 455.

The Home phone is 116×196 with a 5px border: its inner area is 106×186. Arcade artwork is 360×600, so object-fit:cover preserves proportions but crops approximately 5% horizontally. Supporting panels combine percentage widths and fixed heights, so their crop varies with layout.

Existing sources:

| Game/mode | Existing capture | Content ratio |
| --- | --- | --- |
| Arcade original montage | 360×600 | 3:5 |
| Puzzle / Feastfall original montage | 640×360 | 16:9 |
| Wicked Bites / CLAW qualified browser previews | 844×390 | 422:195 |
| Newer TOADAL owner QA portrait captures | 440×820 | 22:41 |

Newer portrait captures exist in app/convergence-20261001. The Arcade capture contains first-run/DEV QA controls; obtain a clean production capture before using it in a public card. Existing entry captures and diagnostic evidence are not automatically suitable public screenshots.

Use plausible generic device screen shapes independently from content shape: e.g. a tall portrait phone or a 16:10 landscape computer/tablet. Use contain/letterboxing for old captures with different proportions. Better final artwork comes from recapturing the actual game at the intended viewport, not stretching the old image. These illustrative ratios do not represent every physical device.

## Concepts prepared

- Arcade phone invitation: Feast lettering, mascot, one portrait gameplay preview and “You've been invited to the feast.” The existing 3:5 image is contained inside a taller phone screen.
- Wicked Bites computer challenge: large “Can you beat 1,594?” and a computer preview. The score is an example personal result, not verified gameplay or a live challenge.
- Puzzle Astro tablet: a landscape Puzzle preview with the actual Astro v2 score-frame art used as a quiet callout.

All use existing source artwork. No AI-generated gameplay substitutes. These contained concepts adapt for inspection at narrow widths; production export layouts must be separately fixed and reviewed for each output format.

## Resources to reuse

- Web Studio: authored composition, registered game assets and preview workflow.
- HUD Maker: reusable card layout definitions and authoring; compile approved templates into the constrained renderer, rather than accepting arbitrary user templates.
- Astro HUD pack: static themed framing and accents. No animated effects needed for a social image.
- Font/lettering engine: established brand heading art and locally embedded score/text typography.
- Existing share-card service: public metadata, immutable PNGs, expiry, removal and share composer.
- Progression system: optional legitimate earned badge/character if its approved public-result adapter supplies it. Do not make rewards or acquisition depend on tracking a preview request.

## Game presentation registry

Each approved entry should define game identity, game/mode label, launch target, actually available platforms, allowed card types/themes, captured surface and dimensions, device presentation, fallback gameplay asset, score units and comparison direction. A completed result adds run reference, mode/difficulty/modifiers, rules/build version and seed/date if needed. Do not infer those values from an image.

A friendly personal score challenge can link to ordinary play. Claiming an equivalent replay requires supported settings and compatible rules. For Puzzle or Feastfall, use the actual supported result type (completion, moves, time, etc.) instead of inventing a points leaderboard. No live multiplayer room, verified rank or friend relationship is implied by this visual design.

## Automatic player's-run capture

1. The game freezes its actual visible gameplay frame and immutable completed result before reset/replay/menu changes.
2. Include necessary HUD layers that live outside the canvas. Export only game-owned pixels, not the whole display, notifications, chat or browser chrome.
3. Associate image/result/run reference and reject late callbacks from another run. For saved all-time bests, retain the capture that belongs to that best or show a clearly representative preview.
4. Show the player the composed card locally. Upload only when preparing the public share card. Preserve personal/unverified score semantics.
5. Use a separate bounded binary image intake: decode, enforce byte/pixel/dimension limits, strip metadata, re-encode, reject SVG/arbitrary URL fetching and store only the required card derivative. Expiry/removal covers derivative images too.
6. On unsupported/blank/tainted canvas, timeout or mismatch, use the existing score-only/mascot card or clearly representative gameplay image.

Current PR30 accepts scalar fields in small JSON; it has no image intake, capture adapter or configured fair-challenge fields. This needs additional implementation work.

TOADAL native app inspected at c7ba1f978a89f5976cd6f02af4beb1e7dba2f372 is HTML/JS with Capacitor Android. Arcade's completed result already has runId, mode, score and ruleset fields. Its bug recorder has useful exportability/surface-selection checks, but adds diagnostics and can reconstruct DOM, so do not publish its output verbatim. No native Share/screenshot plugin is currently installed.

Wicked Bites uses a portrait canvas plus DOM HUD/result inside an opaque sandboxed iframe. The current host completion adapter receives score only. The host cannot directly read its canvas/DOM. Add a narrowly reviewed capture exporter inside the game and a bounded result-plus-image bridge; preserve the sandbox. Canvas exportability remains unqualified for this game.

## Sequence and checks

First add game-specific fixed promotional preview templates. Next add clean TOADAL mode capture/result adapters. Qualify Wicked Bites separately because its protected cartridge boundary changes. Then add precise challenge configuration where the game can reproduce settings. Compare conversion using an agreed measurement plan after publishing; attractive mockups alone do not establish a download lift.

Visually inspect the final PNG at a small real messaging preview size, confirm game/HUD readability and no distortion, and verify platform/channel behavior before launch. Existing local concept inspection showed loaded assets, no overflow at 320px/736px, working variant switching and no script errors. No production service tests or deployment were performed in this evaluation.

## Primary references

- https://github.com/Matthew75x/toadal-feast-web/blob/efd528061ddf94fabe3fc3b886c0f66636e29f1a/studio-project/toadal-feast-website/pages/home.json#L3804
- https://github.com/Matthew75x/toadal-feast-web/blob/efd528061ddf94fabe3fc3b886c0f66636e29f1a/studio-project/toadal-feast-website/reference/assets/css/site.css#L6333
- https://ogp.me/
- https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob
- https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share
- https://html.spec.whatwg.org/multipage/browsers.html#sandboxing

## Requested revision — Score to beat / iPhone appearance

The Arcade phone concept now uses “Score to beat” above an example personal score and “Can you top it?” below. The Wicked Bites challenge uses the same heading. The portrait frame has an iPhone-inspired silhouette, metallic edge, thin bezel, capsule cutout, side buttons and home indicator. The existing gameplay image remains uncropped, with decorative hardware details kept in its letterbox areas. This is a local design revision; it makes no model, Apple affiliation or iOS release claim.

## Requested revision — Use the card space

Wide concepts now use the 1200×630 composition ratio. The Arcade design aligns its logo, mode, heading, larger score and action on one axis, uses a two-column grid, moves the phone toward the score and places the smaller mascot alongside the phone. The screenshot is still contained without stretching. Narrow previews reflow vertically. This is a visual composition revision, not a production renderer change.

## Requested revision — Standard sizing and food decorations

Sizing was verified against current Meta, Apple and LinkedIn primary documentation. Keep 1200×630; smaller recipient display is controlled by the receiving app. Added matching native strawberry/orange/banana/apple/cookie sprites behind the three concepts. Source hashes are recorded in work/share-decoration-assets/provenance.json. Full-resolution PNG and lighter JPEG design examples are in outputs/. See LINK_PREVIEW_SIZING.md for source guidance, measured file sizes and implementation scope.
