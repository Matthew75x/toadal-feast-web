# TOADAL FEAST — Final Asset / Performance Guardrails

**Date:** 2026-10-02  
**Scope:** final manifest-completion visual work

## Proven current asset pattern

The repository intentionally carries two classes of companion art:

1. **full-size owner/master authority files** for provenance, review and future derivative generation;
2. **optimized runtime derivatives** for live browser use.

Examples from `manifests/companion-runtime-v2.json`:

| State | Master bytes | Runtime WebP bytes |
|---|---:|---:|
| reward | 1,733,730 | 92,288 |
| maintenance / construction | 1,663,323 | 83,230 |
| news / devlog | 1,527,629 | 63,378 |
| community | 1,480,074 | 86,698 |
| merch | 1,457,991 | 69,188 |
| search | 1,335,024 | 70,556 |
| privacy | 1,338,522 | 62,336 |
| account | 1,271,387 | 54,002 |

The large PNG masters are not waste merely because they are large: they preserve approved source authority.

The performance mistake would be to use those masters directly in normal page/runtime delivery when the optimized derivative exists.

## Final implementation rule

For every companion/contextual art use:

- preserve the approved master/source record;
- render the runtime WebP derivative when one exists;
- do not point route-local markup at `master-v2-selected/*.png` or `production-pack-v2/*.png` unless a deliberate exception is documented and measured;
- keep semantic state and provenance separate from transport format.

## Existing optimized authorities

Use current runtime derivatives:
- `runtime-v2/settings.webp`
- `runtime-v2/search.webp`
- `runtime-v2/contact.webp`
- `runtime-v2/news.webp`
- `runtime-v2/maintenance.webp`
- `runtime-v2/privacy.webp`
- `runtime-v2/account.webp`
- `runtime-v2/notifications.webp`
- `runtime-v2/mute.webp`
- `runtime-v2/register.webp`
- `runtime-v2/delete-account.webp`
- `runtime-v2/rating.webp`
- `runtime-v2/survey.webp`
- `runtime-v2/thumbs-up.webp`
- `runtime-v2/thumbs-down.webp`
- `runtime-v2/ai-disclosure.webp`
- `runtime-v2/partnership.webp`
- `runtime-v2/community.webp`
- `runtime-v2/merch.webp`
- `runtime-v2/reward.webp`
- `runtime-v2/download.webp`

Existing runtime-v1 context derivatives remain valid for:
- World map guide
- Support
- App/mobile
- Stories/Media thinking

## New donor imports

Do not copy entire game or asset-library directories.

For any new asset such as an Infinite mode visual:

1. identify the exact authoritative source/ref;
2. copy only the required source/derivative;
3. record provenance/hash;
4. create a web-optimized derivative when needed;
5. register the asset;
6. label concept/mode art correctly;
7. do not describe mode art as a gameplay screenshot.

There is no arbitrary universal asset-size cap.

Reject unnecessary bytes, duplicate delivery, or an unoptimized master in the runtime path—not a file merely because it exceeds a made-up threshold.

## Current real gameplay assets are already compact

Current App gameplay WebPs are approximately:
- Arcade: 63 KB
- Puzzle: 43 KB
- Feastfall: 35 KB

Wicked Bites preview art is ~35 KB.
CLAW preview art is ~21 KB.

Prefer these real optimized captures to heavier decorative substitutes.

## World imagery

Current major world images are roughly:
- Candy Kingdom: 183 KB
- Candyland calm: 177 KB
- Forest portal: 73 KB
- Candy Kingdom mobile crop: 69 KB

Reuse these before introducing another large environment with the same semantic role.

## Final visual-lane performance acceptance

After route work is integrated:

- inspect initial network payload for Home, Play, World, Media, App and Feast Pass;
- verify no master companion PNG is first-load requested when a runtime WebP exists;
- verify responsive/mobile images use intended derivatives/crops;
- verify new decorative sections do not eagerly load below-fold media without reason;
- compare final cold Home payload with the already-qualified V1 release baseline;
- record any material regression and its justification.

The goal is richer product structure with disciplined delivery, not visual austerity.
