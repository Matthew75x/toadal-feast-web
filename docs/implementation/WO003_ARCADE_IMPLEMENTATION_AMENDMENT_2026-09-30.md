# WO-003 Arcade Implementation Amendment — Standard + FMF + Zen

Date: 2026-09-30

Current state: **ARCADE HOLD**.

The completed 38/38 bounded audit remains valid smoke evidence, but the previous gameplay witness of 16 seconds / score 150 / level 1 is not sufficient to qualify website integration.

## Qualification first

Continue WO-003 without integrating or deploying Arcade yet.

Before integration, prove:

- meaningful Standard Arcade progression or natural run completion;
- required Toadal mechanic witnesses;
- realistic mobile drag and simultaneous movement/action;
- the final persistence behavior;
- dependency classification and justified package closure;
- authoritative mechanics/browser tests against the modified candidate;
- exact-byte requalification of the final cartridge.

## Final web sampler

After the HOLD closes, the intended website preview contains:

- **Standard Arcade** with the web roster: Toadal, Classic Frog, Gully;
- **5 Minute Feast** (`fmf`) with canonical forced **Chomper**;
- **Zen** (`zen`) with canonical forced **Princess Lily**.

FEAST FRENZY / `tc` remains excluded unless separately approved.

## Persistence

Stage A technical qualification may be session-only.

The final Standard web-preview progression must use website-host-owned local state in the isolated web-preview namespace. It must not alter the mobile game save or mobile character economy.

## Package strategy

FMF and Zen are now intentional web-preview content. Their genuinely reachable runtime and presentation assets should count as required package content.

Do not infer that every unresolved reference is a missing file, and do not delete donor files only because the earlier short Standard witness did not request them.

Qualify Standard, FMF and Zen, capture a combined reachability ledger, remove only proven-unreachable material, and requalify the exact final bytes.

## Website integration remains gated

After cartridge qualification, still close:

- Wicked Bites compatibility routing;
- website regressions;
- static export/base-path checks;
- responsive evidence;
- final package/static hashes;
- the inherited Windows full-QA invocation issue without hiding direct test results.

Canonical references:

- `docs/implementation/WEB_ARCADE_PREVIEW_PROFILE.json`
- `docs/implementation/WEB_ARCADE_DEMO_PRODUCT_AUTHORITY_2026-09-30.md`
- `docs/implementation/WEB_ARCADE_DEMO_ACCEPTANCE.json`
