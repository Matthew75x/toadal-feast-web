# WO-003 Arcade Source Authority

## Authority decision

The source authority for qualification is the `main` tree of `Matthew75x/Toadal-Feast-Development` at commit `6daedca1eb6aa5c953e53a538561e9c42ff9cb3c`, tree `85a5e1eb95b77deb4164f8d91e1f46e5fd8b4aee`. The local checkout used for Git-object inspection is `C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\toadal-feast-asset-source-wo001`; it is clean, on `main`, and its `origin/main` ref matches a read-only query of `origin` at that SHA. `src/runtime/app/release-meta.js` identifies the payload as TOADAL FEAST 1.2.9.

This selection is based on repository/ref identity and provenance, not folder recency. A fuller checkout at `C:\Users\Metarator\Documents\GitHub\Toadal-Feast-Development` is also clean, but its local `main` is `473ea25eda7b7045f6c42ad30ac4669b09a9c261`, dated 2026-09-21. A read-only `git ls-remote` resolves actual `origin/main` to `6daedca…`; the graph contains 192 commits after the `473ea25…` ancestor. That checkout's local `origin/main` ref is stale and must not be treated as current authority.

The older `C:\ASSIGNATOR\ChatGPT\Toadal-Feast-RC276` path mentioned in a previous source-audit note is unavailable. That note did not bind its inspected bytes to a Git commit/hash, so WO-003 does not claim exact continuity with that audit. The selected source instead has independently verifiable repository, commit, tree, blob, and entry-byte hashes.

## Candidate entry comparison

| Candidate | Exact evidence | Decision |
|---|---|---|
| `arcade-standalone.html` | Git blob `951db826b29bde244486c2aacaae220cb42d3131`; 36,016 bytes; SHA-256 `e6547b9628b44ecf608f3a448a12c5761c1dcadc87f5bd3c89650ea6574a42cf` | Selected donor entry. It wires the dedicated Arcade menu/runtime, gameplay, renderer, pause/audio/input helpers, styles, registries, and assets. It is a donor, not a prequalified website cartridge: its current shell exposes four modes and character/cosmetic/shop/daily surfaces. |
| `arcade-modern.html` | Git blob `e8a70691ecd45965ef83f1eea53e5d72d6aabf66`; 1,521 bytes; SHA-256 `cc58d02e96cd5666fb87b3b3118963dce6bc218d92250f5b4099d6c326ba40be` | Rejected as runtime authority. It is a redirect shim to the full `index.html` application, with a mode allowlist and autostart query parameters. |

The selected profile is standard Arcade with canonical Toadal, keyboard and touch, website-owned exit/fullscreen, and no selector, shop, cosmetics, daily-goal surface, account sync, or unrelated game modes. Those omissions are requirements to prove in the isolated wrapper; they are not represented as already implemented by the donor.

## Exact static source closure baseline

The exact Git blobs were recursively scanned from `arcade-standalone.html` and extracted without changing the source checkout into:

`studio-project/toadal-feast-website/reference/audit/arcade-standard-6daedca1/`

This is off the published route graph and is an audit candidate only. The machine-readable report is `docs/review/WO-003/arcade-package/source-static-closure.json`.

The conservative static-string closure is **359 files / 20,232,319 bytes (19.295 MiB)**: assets 255 files / 17,443,470 bytes; content 5 / 341,560; packages 5 / 51,657; prod 5 / 50,987; src 85 / 2,252,315; themes 3 / 56,314; and the HTML entry 1 / 36,016. It is not a final runtime package. The report retains unresolved directory/template/runtime-resolved references (including Arcade asset families, optional mode/character families, and audio). These require exact-profile browser traffic and asset-resolver analysis before any removal or closure claim.

Largest static-closure files and every file's Git blob, size, and SHA-256 are in the JSON report. The closure tool is `scripts/wo003-extract-git-static-closure.mjs`; it reads source Git objects and does not edit the mobile source repository.

## Qualification boundary

Source authority is established; gameplay, runtime dependency closure, isolation, host protocol, persistence behavior, and website integration are **not yet qualified by this source record**. Do not route this audit copy through Play until those gates have independent evidence. If the smallest faithful canonical-Toadal profile requires gameplay or mobile-release-source edits, stop with ARCADE HOLD.

## Final WO-003 disposition

The subsequent isolated candidate run establishes useful bounded runtime/security evidence (38/38 checks) but does not close package or profile acceptance. The current candidate directory contains 398 unique donor files / 28,843,732 bytes plus three harness/adapter files; 187 donor files / 14,194,060 bytes were not requested in the qualification profile, and the conservative static scan reports 101 unresolved references. Their reachability cannot be safely inferred from one bounded run. The run scored 150 and recorded six Toadal tongue catches but remained in level 1 and did not complete; the exact-candidate mechanics/browser/mobile witnesses and the declared local-best-score behavior also remain unverified/reconciled.

**Final disposition: ARCADE HOLD.** Do not integrate or export Arcade from this audit package. See `docs/review/WO-003/WO-003_IMPLEMENTATION_EVIDENCE_2026-09-30.md` and its machine-readable inventory/qualification reports for hashes, package accounting, test results, and the remaining gates.
