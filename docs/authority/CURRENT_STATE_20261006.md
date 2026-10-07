> **Navigation clarification (2026-10-07):** This document preserves the October 6 observations below; its dated SHA values are historical evidence. Operational deployment authority is `Matthew75x/toadal-feast-web` / `staging/live-visual`, resolved live before consequential operations. The [machine ledger](../../manifests/manifest-compliance-ledger.json) records separate dated readbacks. This navigation note does not update or replace the preserved qualification, closure or status facts.

# TOADAL Website — Current Authority

**Date:** 2026-10-06

This is the day-to-day current-state pointer for the website lane. It supersedes `CURRENT_STATE_20261003.md` for operational status only. It does **not** replace `WEB_PRODUCT_AUTHORITY.md`, owner-approved creative/product requirements, or separate Studio / Publisher / TCS / native-game authorities.

## Exact website repository state

Repository: `Matthew75x/toadal-feast-web`

- deployment lane: `staging/live-visual`
- current staging head at this authority refresh: `d4b3287670bb56e6e61efa9b033a0ff3b8c92d4c`
- default `main` baseline: `9ce82e1188eb1c28fb79f3b4cef5bfdab1cbf75a`
- preserved owner-native authoring source: `work/owner-native-authoring-20261002` at `164491d847fd4c21d737e86ae5bba2aa5abf8283`
- preserved owner-authority archive: `archive/owner-native-authority-20261003`

`staging/live-visual` remains the only website deployment lane. `main` is not the deployment target. Production hosting, DNS and provider changes remain separate explicit-authority operations.

The October 6 operational delta is recorded in [OPERATIONAL_UPDATE_20261006.md](OPERATIONAL_UPDATE_20261006.md). Historical dated current-state and cleanup documents remain provenance, not current operational authority.

## Website posture

The website/Studio foundation is now late-stage staging infrastructure rather than an unassembled page collection.

Recent staging closures include:

- sourced local game records on Feast Pass;
- audited mobile/layout interaction fixes;
- actionable local quest journey;
- earned guest badge/title showcase;
- availability-aware Play catalogue search/filtering;
- exact staging-artifact sealing with preserved protected game bytes;
- complete desktop/mobile Toadal Show/Hide lifecycle;
- sourced per-game progress read model for Feast Pass;
- browser-game cartridge hardening standard and reusable hardener tooling.

The per-game progress read model is a **read-only website projection contract**. It does not qualify executable game bytes, invent trusted achievements, authorize account/cloud sync, or convert local records into server authority.

The staging merge that added cartridge hardening, `d4b3287670bb56e6e61efa9b033a0ff3b8c92d4c`, passed both the dedicated Cartridge Hardener Self-Test workflow and the ordinary GitHub Pages deployment workflow.

## Studio boundary and HOLD posture

Separate Studio repository: `Matthew75x/toadal-studio`.

Current V5 integration authority observed at this refresh:

`integration/studio-builder-v5-20261003` → `ffebf68559c0866e8e68b3de1470fa89ee654013`

That head includes Studio PR #1, **promote qualified Studio owner tools**. The Studio repository had no open PRs at this snapshot.

[OWNER_SAFETY_CLOSURE_20261004.md](../authoring/OWNER_SAFETY_CLOSURE_20261004.md) records the bounded owner-safety closure: the full suite reported 554/554 PASS with focused browser pilots, while explicit limitations such as missing social-share preview remain visible.

Disposition: **use Studio first; keep feature development on HOLD unless a real owner workflow is blocked or the owner explicitly reopens it.**

Website authority must not treat Studio HOLD as proof that every optional convenience exists.

## Browser cartridge authority

The existing [Browser Game Cartridge Contract](../implementation/BROWSER_GAME_CARTRIDGE_CONTRACT.md) remains binding.

The stronger [Browser Game Cartridge Hardening Standard v1](../implementation/BROWSER_GAME_CARTRIDGE_HARDENING_STANDARD_V1.md) defines the reusable CHL-0 → CHL-6 intake/hardening/admission sequence.

### Croaker King Defense

Current recorded candidate: **Croaker King Defense 2.0.0**, two-mode restored build.

Qualification record:

[CROAKER_KING_DEFENSE_CARTRIDGE_QUALIFICATION_20261006.md](../review/CROAKER_KING_DEFENSE_CARTRIDGE_QUALIFICATION_20261006.md)

Current local result:

- CHL-4 / QA-QUALIFIED;
- public state remains `PREVIEW`;
- restored entry SHA-256: `f09be56a38792beae7ac435762b80e38bc345dcfa8c3f3272f7b955254cf53cd`;
- runtime ledger SHA-256: `dd44c1dbd822e1f6d722838b2e77e450866ea964d8fb0534084462e0276a2afc`;
- deterministic cartridge ZIP SHA-256: `488f8b66e204b7d2a725a3a43040b3de0b2fd2b4a132a01ff9f0a6ee39f42933`;
- package carries separate website `cartridge.json` and TCS `tcs1.json` metadata.

The TCS manifest is intake metadata only. It is **not** TCS bridge/security qualification and does not create a positive TCS authority decision.

Still required for this exact candidate:

1. trusted positive TCS qualification of the exact bytes;
2. real TOADAL website-player / iframe acceptance (CHL-5);
3. physical-device acceptance/performance;
4. separate owner/release authority before any `PUBLIC` decision.

## Publisher / TCS boundary

Publisher repository: `Matthew75x/toadal-feast-publisher-stack`.

Current Publisher `main` at this refresh:

`99d28e20a0d49d65968e1d71a2cf90bdd6cd2e0d`

Publisher PR #33 merged support for safe coexistence of website `cartridge.json` and one explicit TCS-1 manifest. Publisher continues to bind promotion to exact immutable bytes and a trusted positive TCS qualification envelope.

That compatibility work does **not** weaken TCS. Ordinary positive TCS authority remains a separate security gate. Local/synthetic/test receipts, negative measured receipts, or Publisher-side metadata cannot substitute for an authorized positive TCS decision.

Public discovery, production deployment and website installation remain separate from hidden Publisher staging.

## Native game boundary

Native TOADAL FEAST 1.2.9 remains a separate repository/release authority. Website completion, browser-game hardening and Publisher cartridge work must not silently redefine the native RC or mobile certification state.

Do not treat website PREVIEW acceptance as Android/iOS release certification.

## Current critical path

In order of dependency:

1. preserve/qualify the trusted TCS authority path without bypassing its isolation/security gates;
2. run the exact Croaker cartridge through that authority and remediate only evidence-backed failures;
3. admit the same qualified bytes through the real TOADAL website player and prove host lifecycle;
4. capture physical-device acceptance/performance;
5. only then consider `PUBLIC` promotion;
6. account-backed/durable progression remains a later deliberate migration from the current truthful guest/local read model.

## Authority hierarchy

1. owner-approved product/creative requirements;
2. approved authority manifests/assets/mockups;
3. implementation contracts and qualified evidence;
4. current implementation/staging.

A newer branch or a passing test does not silently override a higher-level requirement.

## Branch discipline

Use short-lived `work/`, `fix/`, `qa/` and `docs/` branches. Preserve historical heads only when they carry unique evidence or authority.

The latest branch snapshot is [WEB_BRANCH_SNAPSHOT_20261006.md](WEB_BRANCH_SNAPSHOT_20261006.md). Perform branch deletion only after ancestry and unique-evidence review; do not delete merely because a feature reached staging.
