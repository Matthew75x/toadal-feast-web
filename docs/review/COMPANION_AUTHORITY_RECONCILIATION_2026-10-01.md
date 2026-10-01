# Companion donor vs. authority reconciliation — 2026-10-01

The authority branch `ops/web-authority-consolidation-20261001` appeared after this isolated runtime donor was prepared. It is two commits ahead of the same staging base `7c17e28135688ace9139918f077a44e3d03d9765`.

## Safe reuse

The image-switching mechanism itself is useful evidence: the existing staging runtime already selects semantic reaction states, and a bounded browser run proved that changing the image source can work without disturbing minimize behavior or the mobile footprint.

Do **not** merge this donor wholesale. Reconcile runtime artwork selection against `docs/authority/COMPANION_REACTION_AUTHORITY.md` first.

## Current authority differences

The authority branch currently registers four runtime candidates: World/map, Support/help, App/mobile, and Stories/media. It explicitly rejects using maintenance/construction artwork as generic Coming Soon imagery and rejects a rewards/treasure pose where it could imply a live economy. Those restrictions override the broader experimental mapping in the first donor commit.

The recovered interaction-state source still explicitly contains a Settings state, and the owner specifically described Settings as an example that should show the gear/control pose. The production-ready pack contains `TOADAL_SETTINGS_GEAR_CONTROLS_v03.png`, but the current authority runtime manifest has not selected that file. Resolve that omission explicitly rather than silently dropping the owner-directed behavior.

## Authority audit finding

`docs/authority/ASSET_AUTHORITY.md` contains a transcription error in the production-pack SHA-256. The correct verified SHA-256 is:

`06275f4803c8c63e141c34dbcf252bb9c9ab0c35edae460c7c940fd2f687a76a`

The machine-readable companion manifest has the correct hash. Correct the prose authority file before treating consolidation as closed.
