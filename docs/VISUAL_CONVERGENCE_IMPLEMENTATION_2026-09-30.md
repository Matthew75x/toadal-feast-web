# Visual Convergence Implementation — 2026-09-30

## Goal

Advance the website while WO-003 Arcade qualification proceeds independently.

## Implemented product decisions

1. TOADAL FEAST is the dominant identity; TOADAL GAMES remains supporting publisher identity.
2. Global shell uses the approved warm cream / chocolate / pink / gold direction.
3. Home prioritizes game identity, Play, world/characters, Feast Pass, then app conversion.
4. Play reserves a qualified Arcade integration slot instead of duplicating WO-003.
5. World and Stories launch with curated content; exhaustive lore is not required for beta.
6. Feast Pass is presented as playful progression, not account administration.
7. Bottom-right helper is contextual on pointer hover and keyboard focus.
8. Missing final artwork is represented by explicit approved-art slots rather than invented art.
9. Mobile layout is first-class, including navigation and single-column card fallbacks.
10. Reduced-motion preferences are respected.

## Merge boundary

Safe donor areas:
- shell/nav/footer;
- visual tokens;
- Home presentation;
- World;
- Stories;
- Media;
- Feast Pass;
- News;
- Support;
- contextual helper.

Do not overwrite:
- qualified Arcade runtime;
- WO-003 player message/security logic;
- WO-003 persistence implementation;
- WO-003 control/input internals.

## Acceptance

This branch is useful implementation work, not release authority. It should be visually reviewed and then selectively integrated into the local canonical website lineage once ASSIGNATOR is available.
