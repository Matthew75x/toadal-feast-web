# TOADAL FEAST Website — Beta Finish-Line Master Plan

Date: 2026-09-30  
Status: planning/coordination authority; no production deployment is authorized by this document.

## Goal

Stop the website program from feeling open-ended.

The near-term finish line is a **polished public web beta** that lets a visitor:

1. understand TOADAL FEAST quickly;
2. play a real browser game;
3. play the bounded TOADAL FEAST Arcade sampler;
4. meet the core world/characters;
5. understand that the mobile app is the larger experience;
6. find support/legal/recovery routes;
7. use the site comfortably on phone, tablet and desktop.

The beta does not need every future system before it can launch.

## Current state

- Home/global-shell work: accepted in later local WO-002 evidence.
- Play/game-detail/player architecture: accepted in later local WO-002 evidence.
- Wicked Bites: isolated PREVIEW player exists in the accepted WO-002 evidence.
- Arcade cartridge: currently **ARCADE HOLD** / ARC-QUAL-01.
- Production deployment: not authorized.
- Public account/backend: not required for this beta.
- Full Feast Pass, full Stories reader, and broad editorial expansion remain later product work.

## Immediate critical path

### Gate B1 — ARC-QUAL-01

Close the current Arcade HOLD.

Required:
- meaningful Standard gameplay witness;
- Toadal mechanic witnesses;
- realistic mobile input witness;
- explicit persistence contract;
- Standard roster qualification;
- 5 Minute Feast / Chomper qualification;
- Zen / Princess Lily qualification;
- dependency classification;
- justified minimum package;
- exact-byte requalification.

Output:
- ARCADE QUALIFIED — PACKAGE ONLY
  or
- ARCADE HOLD

No website integration before a qualified package exists.

### Gate B2 — ARC-INTEGRATE-01

After a qualified package exists:

- integrate Arcade as PREVIEW;
- expose Standard / 5 Minute Feast / Zen;
- expose Toadal / Classic / Gully only inside Standard;
- preserve opaque isolation;
- add host-owned Standard preview persistence;
- close Wicked Bites legacy route compatibility;
- rerun site regressions;
- produce fresh static export and hashes.

Output:
- integrated preview candidate, still not production.

### Gate B3 — Beta navigation/content minimum

Before public beta, ensure there is a coherent non-game journey around the playable content.

Required public-beta route families:
- Home
- Play
- Wicked Bites detail/player
- TOADAL FEAST Arcade Preview detail/player
- World hub
- Characters hub
- Toadal profile
- App / Get the Game
- Support
- Legal / Privacy
- 404/recovery

Other roadmap families may remain clearly PREVIEW / COMING SOON for the first beta.

### Gate B4 — App conversion truth

- verified store destinations only;
- disabled/coming-soon treatment for unavailable store destinations;
- no fabricated account/download claims;
- QR/share attribution routing remains compatible with the Android contract;
- mobile app is framed as the full experience without insulting/devaluing the web sampler.

### Gate B5 — Public-beta quality closure

Run site-wide:
- responsive viewport matrix;
- keyboard/focus;
- reduced motion;
- mobile safe area/orientation;
- player exit/fullscreen;
- broken links;
- console/network cleanup;
- image/performance review;
- static-link/base-path checks;
- staging indexing policy;
- analytics-event sanity.

### Gate B6 — Release candidate

Produce one exact beta RC:
- Git SHA/tree;
- static file count/bytes;
- static manifest/per-file SHA-256;
- ZIP hash;
- build environment;
- evidence screenshots;
- known limitations;
- rollback source;
- staging review.

Only owner acceptance may advance the RC to production.

## What is deliberately NOT required for beta 1

The following can continue after a useful public beta exists:

- full Stories/Manga/Reader implementation;
- full Feast Pass / Quests / Rewards;
- registered-account backend;
- cross-device sync;
- global/friends leaderboards;
- community backend;
- full Store;
- all future browser mini-games;
- every planned editorial route;
- production commerce.

Do not hold the first useful beta indefinitely for these.

## Post-beta roadmap

After Beta 1 is stable, return to the canonical numbered roadmap:

- WO-003 — World + Characters expansion beyond the beta minimum
- WO-004 — Stories + Manga + Reader
- WO-005 — Feast Pass / local progression
- WO-006 — Editorial + App + Search + utilities
- WO-007 — final cross-site quality closure
- WO-008 — mature website release-candidate closure

Where the beta minimum already implements part of a later work order, that work becomes a bounded delta rather than a rebuild.

## Operational rule

Do not create another broad parallel website implementation branch while ARC-QUAL-01 is active.

Parallel work should be:
- planning authority;
- source/provenance review;
- copy/content preparation;
- visual authority;
- release checklists;
- independent QA;
- branch/PR hygiene.

Runtime implementation should remain single-authority until the accepted candidate is preserved remotely or by verified bundle.

## Definition of a successful beta

A first-time visitor can:

- understand the product;
- play Wicked Bites;
- play the TOADAL FEAST Arcade sampler;
- discover Toadal and the core world;
- reach the app-download funnel;
- recover from navigation/errors;
- use the experience on a normal phone or desktop without obvious breakage.

That is the finish line for the first public web beta.
