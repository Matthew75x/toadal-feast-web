# WO-001 Home Asset / Loading Audit

Date: 2026-09-30

Command:

`node scripts/audit-home-assets.mjs <repo>`

Result against the parallel WO-001 gap-fix candidate:

- 17 Home image tags inspected
- 9 unique local image files
- 2,138,015 unique image bytes (2.04 MiB)
- 0 missing assets
- 0 missing `alt` attributes
- 0 incorrect hero lazy-loading findings
- 0 below-fold lazy-loading findings after treating the fixed Toadal companion as immediate UI
- hero background correctly uses `fetchpriority="high"`

This audit deliberately treats byte counts as measurements, **not a universal eligibility cap**.

## Current image inventory

| Asset | Bytes | Dimensions | Role |
|---|---:|---:|---|
| hero-world.webp | 404,450 | 900×1500 | Hero + world/card reuse |
| world-waterfalls.webp | 401,802 | 900×1500 | Below-fold world/app art |
| toadal-victory.png | 335,410 | 611×640 | Hero + companion |
| gulper.png | 285,668 | 512×512 | CLAW / character |
| princess-lily.png | 265,113 | 512×512 | Character |
| world-candy.webp | 183,348 | 1424×750 | Preview/world art |
| arcade-preview.webp | 119,900 | 700×400 | Arcade candidate |
| gully.png | 84,641 | 256×256 | Character |
| toadal-portrait.png | 57,683 | 256×256 | Character/app accent |
## Visual-resolution watch item

The current Hero background is only 900 px wide even though required desktop evidence includes 1600×900 and 1920×1080. CSS uses `object-fit: cover`, so the Hero can upscale on large desktop screens.

This is **not an automatic failure**: the 1600-wide Chrome witness remains visually coherent. It is a specific item to inspect at 1920 during the final Studio evidence pass.

Canonical game-source alternatives already exist on ASSIGNATOR:

- `candyland-scenic-calm.webp` — 1424×750, 189,272 bytes
- `candy-forest-owner-v1.webp` — 1536×1024, 358,294 bytes
- `forest-portal.webp` — 1424×750, 78,302 bytes

Do not swap the Hero merely because those files are wider. The approved mockup/composition still controls. If the 1920 witness looks soft, compare approved-crop quality and use a source-qualified wider derivative rather than simply increasing file size.

## Loading behavior

The current Home is already behaving sensibly:

- Hero world: eager + high priority.
- Hero Toadal: eager.
- Fixed contextual Toadal companion: eager because it is immediate UI on desktop.
- Game/world/character/app art below the fold: lazy.
- No full Android asset tree is copied into the Home bundle.

Recommendation: keep this selective approach. Optimize based on actual visual/loading evidence, not an arbitrary small global cap.
