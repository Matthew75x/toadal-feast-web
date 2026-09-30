# CP9 / V13 donor baseline authority

Date verified: 2026-09-30

## Exact pinned donor and local reproduction

Archive on ASSIGNATOR:
`C:\ASSIGNATOR\TOADAL_FEAST_V13_CHECKPOINT_IX_PUBLIC_POLISH (2).zip`

SHA-256:
`EBBD2B7631268E39522A2F63EB7377CE2CD6571B86CB88947C597B0B1376E7A4`

Extracted source/package root:
`C:\ASSIGNATOR\TOADAL_V13_CP9\TOADAL_FEAST_V13_CHECKPOINT_IX_PUBLIC_POLISH`

The earlier repository manifest recorded a staging `dist/` aggregate of 236 files / 6,605,121 bytes. That value was a stale inventory and has been superseded by the final read-only archive reconciliation below.

The verified staging `dist/` aggregate is:
- 234 files
- 6,422,416 bytes
- includes Home, Play, account/download/status/support/legal surfaces
- includes staging player slots/routes for:
  - Wicked Bites
  - CLAW: Feed Gulper
  - Feast Defense
  - Fruity Bash
  - Lily Pad Leap
  - TOADAL FEAST Arcade

Final closure reverified the exact archive SHA-256 from the Downloads mirror, extracted it read-only, and matched all 234 archived `dist/` files individually (6,422,416 bytes) plus all 15 manifest witnesses. The repository manifest aggregate was reconciled to those measured contents; archive bytes, witness hashes, and verifier logic were not changed. The verifier now passes 17/17. The canonical ASSIGNATOR archive/root paths were absent in this environment; the Downloads mirror is byte-identical to the owner-pinned SHA, and the extracted mirror is the qualified local evidence source.

The donor also contains source, tests, cartridge tooling, build/release tooling, QA evidence, and Checkpoint IX reports. It is not merely a raster reference.

## Checkpoint IX quality state

Checkpoint IX reported:
- source/release tests: 32/32 PASS
- staging: 31 routes
- staging deterministic static QA: 11,687 checks / 0 failures / 0 warnings
- touched-surface rendered QA: 16 desktop/mobile cases / 0 problems
- production-shaped build: 29 routes
- production deterministic static QA: 11,014 checks / 0 failures / 0 warnings
- production promotion intentionally blocked
- no production deployment or DNS change

Checkpoint IX explicitly states that no structural redesign was introduced for novelty and that the Home retained the approved premium illustrated V12/V13 direction.

## Reuse rule for WO-001 and later work

CP9/V13 is a **donor/reference baseline**, not something to discard.

Before recreating a capability that already exists in CP9/V13:
1. inspect the donor implementation and evidence;
2. determine whether it can be reused, adapted, or ported safely into the certified Studio 1.4.2 project;
3. prefer reuse/adaptation when it preserves correct behavior and reduces regression risk;
4. rebuild only when the donor implementation conflicts with the current Studio architecture, current product truth, current security/accessibility requirements, or approved visual target;
5. document any intentional replacement of a previously working donor capability.

Do not copy the donor `dist/` wholesale into the new project. Reuse source patterns, components, data, player/cartridge architecture, route behavior, and validated interaction ideas selectively.

## Anti-regression requirements

WO-001 must not:
- regress the Home into a simpler generic landing page;
- lose search or approved navigation behavior that exists in the accepted visual direction;
- discard the working Play/player/fullscreen/cartridge architecture merely because WO-001 is rebuilding the global shell;
- remove qualified routing/funnel concepts without an explicit replacement;
- treat CP9's engineering/public-copy cleanup as disposable;
- expose operator jargon on public pages.

The certified Studio project is the new implementation environment.
CP9/V13 remains the working-product donor.
The documented approved Home direction and retained CP9/V13 screenshots are the available reviewed visual authority/regression baseline. Original mockup PNGs were not recovered; their absence alone does not block acceptance, and pixel-perfect parity is not claimed.
The current repository contracts remain product-truth/runtime authority.

## Preservation boundary

Do not modify the CP9 archive or extracted donor in place.

Treat the archive hash above as immutable evidence.
