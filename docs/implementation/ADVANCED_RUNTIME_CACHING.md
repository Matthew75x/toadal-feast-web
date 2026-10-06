# Cacheable advanced website runtime

The Studio collection `collections/advanced-code.json` remains the owner-authoring authority for the website-wide advanced CSS and JavaScript.

The staging export pipeline now externalizes that exact authored runtime after Studio export and before the established base-path/static checks. This is a deterministic **derived-output optimization**, not a second source of website behavior.

## Why

Before this change the same advanced runtime was injected into every normal generated page:

- advanced CSS: **22,271 bytes**
- advanced JavaScript: **50,850 bytes**
- generated website pages carrying both: **33**
- repeated inline source payload: **2,412,993 bytes**

The static export therefore redownloaded/reparsed the same 73,121 bytes on every full-page route navigation.

## Derived output

The export step verifies that every normal website page contains exactly one CSS block and one JavaScript block and that both match the Studio collection exactly **before any page is changed**.

It then creates content-addressed assets:

- `assets/css/advanced-code.<hash>.css`
- `assets/js/advanced-code.<hash>.js`

The advanced stylesheet reference remains at the original advanced-style position. The JavaScript reference remains parser-blocking at the original end-of-body advanced-script position. A preload at the former CSS position starts the JavaScript fetch early without changing execution ordering.

Protected game/cartridge HTML is excluded and remains byte-governed by the existing protected-artifact path.

The normal base-path transformation still processes the derived CSS and pages after externalization. Runtime filenames are based on the exact final derived CSS bytes and exact authored JavaScript bytes, so a future authored runtime change changes its URL.

The export refuses:
- a page whose inline CSS/JavaScript differs from Studio source;
- missing or duplicate advanced blocks;
- a raw Studio export that already contains a stale derived advanced-runtime asset;
- an invalid Pages base path.

Validation is two-phase: all pages must validate before any transformed HTML is written.

## Measured result — 2026-10-06

Pinned Studio verify-only export:

- pages externalized: **33**
- HTML across those pages: **2,916,227 → 512,144 bytes**
- HTML reduction: **2,404,083 bytes**
- duplicate source bytes eliminated after retaining one CSS + one JS copy: **2,339,872 bytes**
- final public site gains only one 22,271-byte CSS asset and one 50,850-byte JS asset.

A controlled local Chrome navigation measurement used the same Home → Play → World sequence at 390×844 and 1440×900. Static assets were cacheable; HTML was not.

At both viewports:
- cold Home transfer was effectively neutral: **+870 bytes** total from the two additional request envelopes;
- Play transfer decreased by **72,851 bytes**;
- World transfer decreased by **72,851 bytes**;
- three-page sequence transfer decreased by **144,832 bytes**;
- both advanced runtime assets reported **0 transfer bytes** on the second and third pages.

These are local deterministic navigation measurements, not internet-speed or Core Web Vitals claims. Timing values are intentionally not used as acceptance thresholds.

## Acceptance

The optimization is acceptable only when:
- fresh Studio export is reproducible;
- protected game bytes are unchanged;
- the Pages-focused regression gate passes;
- all 33 normal pages reference exactly one matching derived CSS/JS pair;
- protected game HTML receives no website runtime;
- the 83-case route/browser matrix remains green;
- exact staging package preparation succeeds;
- automatic Pages deployment succeeds and live pages/resource bytes match the merged source.

No visual redesign, gameplay, progression, account, native game, or production-domain behavior belongs to this change.
