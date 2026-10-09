# CLAW: Feed Gulper — website cartridge PREVIEW handoff

**Date:** 2026-10-09  
**Owner disposition:** Split-stage CLAW source is accepted as the current working game; website/public release not yet approved.  
**Status:** `CARTRIDGE_PACKAGE_PREPARED_AWAITING_HOST_AND_TCS` — **NOT** PUBLIC, **NOT** on staging, and **NOT** merged.

## Immutable working source

- Repository: [Matthew75x/claw-feed-gulper](https://github.com/Matthew75x/claw-feed-gulper)
- Working-source lock: `release/claw-split-stage-working-20261009`
- Exact game commit: `91f9b600b5d05c0b37ff49a9db615c9c1c38342e`
- Qualified original source (not website adapter): [release QA SUCCESS](https://github.com/Matthew75x/claw-feed-gulper/actions/runs/37995232503).
- The website cartridge is a **derivative** of that source, retaining the original game core/sprites; its wrapper and runtime bundle have their own exact ledger and require independent acceptance.

## Ready-to-intake, non-public cartridge

- Cartridge ID `claw-feed-gulper`, display name `CLAW: Feed Gulper`, version `2.5.1`, entry `index.html`.
- Website metadata: separate root `cartridge.json` (schemaVersion integer 1; `publicState: PREVIEW`).
- TCS metadata: separate root `tcs1.json` (schemaVersion string `1.0.0`; TCS bridge features `[]`; TCS authority `NOT_RUN`).
- Source is packaged as a **self-contained classic script** `runtime.bundle.js` plus canonical TOADAL assets, not native ES modules that may fail under sandboxed opaque-origin iframe.
- Package includes genuine source gameplay `poster.webp`, `screenshot.webp`; no fabricated mock-up, root service worker, installation launcher, developer QA, credentials, or account integration.
- Browser storage is a separate namespace: `toadal:game:claw-feed-gulper:v1:save`. No silent migration from standalone `toadal.claw.feed-gulper.v7` or website-owned keys. Opaque-origin inability to persist falls back to in-memory gameplay; no account save promised.
- Host adapter `toadal.game.v1`: send ready/start/pause/resume/score/complete/error; accept authorized `host:init`, pause/resume/mute/unmute/visibility; strict `window.parent` identity, HTTPS resource URL origin and protocol version; visible does not auto-resume.
- Manifest truth: `PREVIEW` **candidate**; no actual host acceptance, no TCS approval, no physical-device acceptance.
- **Exact derivative ZIP SHA-256:** `9369b9e16ef094dd52e70c1566f9beee45b4c75c87a4edce79ed6cc5d566b826` (**16,536,901 bytes**, **81 runtime files**).
- **Publisher qualification artifact digest:** `81b8c98667212ba9cd2f059f171b76de044e60a5f14b1be4241e26913d591cb1`.
- **TCS manifest canonical digest:** `db067a230a8ab24079570ddd799fcdaa73a354d9f05a64820c38d9cc219e2533`.
- The exact game ZIP, static evidence, manifest/ledger and input request are delivered in the owner's ChatGPT `CLAW_CARTRIDGE_WEBSITE_PREVIEW_FINAL_20261009` working package. Do not assume the derived candidate is already hosted at any public URL.

## Implement in website owner-authoring lane only after admission

1. Run the existing hardener against the supplied exact package and validate the live `toadal.game.v1` host in the existing browser player. Verify parent-origin/source gating with **opaque sandbox iframe**, focus escape, pause, resume, mute, visibility, route exit, fullscreen, retry, reload, UI overlays and saved-state limitations.
2. Use the real `poster.webp` and `screenshot.webp`; add `CLAW` Game Detail/Play and player routes as **Studio-editable source**, *not hand-edits to generated `dist/`*. Preserve the current Home/Feast Pass/Wicked Bites active work.
3. Keep discoverability/Play action **disabled** until actual CHL/Publisher/TCS gates pass. Use a nonindexed PREVIEW test slot if a private test page is admitted.
4. Complete mobile 320×568 and 390×844 plus short landscape 568×320/844×390, desktop, accessibility and physical-device acceptance, then freeze exact byte/hash evidence.
5. Do not claim cloud save, shared sound persistence, account rewards, leaderboards or website progression until each integration is built and verified.

## Separate Publisher/TCS admission

Publisher registration is proposed in [draft PR #35](https://github.com/Matthew75x/toadal-feast-publisher-stack/pull/35): Publisher ID `claw_feed_gulper`, TCS/website ID `claw-feed-gulper`; build hosting true, everything else disabled, publicDiscovery.visible false.

Publisher official process:
```text
npm run cartridge:intake -- prepare --game-id claw_feed_gulper --artifact /ABSOLUTE/PATH/TO/EXTRACTED/cartridge --out /PRIVATE/INTAKE/claw-2.5.1 --registry /PATH/TO/PROPOSED/tenants.json [--tcs-root APPROVED_TCS_CHECKOUT]
npm run cartridge:intake -- verify --workspace /PRIVATE/INTAKE/claw-2.5.1 --registry /PATH/TO/PROPOSED/tenants.json
```
Use a fresh output directory and the **extracted cartridge runtime directory** for no-TCS preparation. If supplying the ZIP, the official CLI **requires** an authorized `--tcs-root`. The preparer never synthesizes trusted approval. It must report `AWAITING_TRUSTED_TCS_PASS` until a valid qualified receipt/envelope for the exact immutable bytes exists. Stage requires a separately trusted Ed25519 PASS; no ordinary positive issuer is currently demonstrated by TCS. No test keys or bypass.

## Evidence present / absent

**Prepared/tested independently:** deterministic ZIP member/byte integrity, distinct manifest structural checks, namespace isolation (9 cases), website host-message adapter (18 cases including simulated opaque-origin), real source-play QA at 320×568 and 390×844 with data-URI local browser harness and zero page errors, original game full 6-viewport hosted QA. Custom handoff file ledger and Publisher digest computed.

**Unverified:** official Publisher `prepare` (not yet run), native TCS archive/sandbox/issuer, real website player iframe lifecycle, Studio export roundtrip, physical-device performance, owner public-release approval.

## Work ownership

- CLAW source frozen in its own source repo.
- Publisher PR #35 is a separate *draft* registration; no public capability activation.
- This handoff lives on an isolated website `work/` branch. Do not merge/live deploy or modify active owner-authored files without respective acceptance.
