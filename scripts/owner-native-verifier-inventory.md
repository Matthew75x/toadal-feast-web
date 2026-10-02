# Owner-native verifier and test inventory

This inventory describes current source coverage after the 33-route conversion. Historically, eight migrated site verifiers inspected `props.html`; those former blob-based assertions are no longer the source model. A ninth native-aware verifier, `scripts/verify-nonhome-truth.mjs`, covers non-Home route truth. The migrated checks project the nested Studio component tree through the pinned owner renderer and inspect authored markup, with built `dist` output checked where the verifier contract requires it.

The source-side projection is `scripts/lib/owner-native-projection.mjs`. It verifies the SHA-256 pin for the vendored portable Studio renderer. When the audited Studio root is configured, it also checks Studio 1.4.2, the owner-authoring source digest, and the TypeScript-stripped generated renderer; the live and portable projection are cross-checked in `scripts/owner-native-projection.test.mjs`. Current provenance is recorded in `scripts/vendor/owner-authoring-renderer.provenance.json`: Studio source SHA-256 `ff3e9c52d178451121b3512331f7f9bec2c6ce7094a84ae568d13f9100e6a19e`, generated renderer SHA-256 `61258647ffcf5250e123089fc4fc7bc9c61617c03dff442517c376f42153b1d9`. This pin includes the recent reduced-motion fallback change. Projection provenance is source evidence, not a final browser qualification.

## Nine native-aware site verifiers

| Verifier | Current projected source and output coverage |
| --- | --- |
| `scripts/verify-final-interaction-truth.mjs` | Projects every registered route; checks authored links, controls, and required route signals. |
| `scripts/verify-final-product-contracts.mjs` | Projects each registered route for visible product-state checks and inspects the typed component data for structured assertions. |
| `scripts/verify-search-discovery.mjs` | Projects Search, Support, Media, and the registered discovery routes; checks controls, hooks, anchors, labels, and links. |
| `scripts/verify-canonical-gully-gameplay-authority.mjs` | Projects Home, Characters, World, and Media; checks canonical Gully image authority and game route output. |
| `scripts/verify-gated-ecosystem-routes.mjs` | Projects Account, Community, Store, Contact, About, Coming Soon, Legal, and Support; checks route state, noindex, and user-facing action truth. |
| `scripts/verify-navigation-truth.mjs` | Projects Home components and checks authored navigation/anchor semantics against route truth. |
| `scripts/verify-home-visual-contract.mjs` | Projects Home and selected native subtrees for section, asset, label, visual, and runtime-hook contracts. |
| `scripts/verify-owner-preview-render-freshness.mjs` | Projects all registered native page components and compares component projections with compiled route output after safe-HTML and base-path normalization; checks runtime asset freshness and route sentinels. |
| `scripts/verify-nonhome-truth.mjs` | Checks authored interaction and route truth for non-Home pages. |

These scripts keep product assertions while changing the source evidence from full-page HTML blobs to native projection. They do not accept serialized component JSON as a substitute for emitted markup when checking visible controls or links.

## Nine migrated site-contract test files

These existing test files now use projected output or typed route/component data according to the contract under test:

| Test file | Preserved contract focus |
| --- | --- |
| `scripts/editorial-manifest.test.mjs` | Article quote target and text-only projection. |
| `scripts/manifest-audit-utility.test.mjs` | Utility route content, disabled controls, and endpoint/purchase truth. |
| `scripts/manifest-complete-v1.test.mjs` | Registered route contract plus visible copy, links, and hooks. |
| `scripts/manifest-gated.test.mjs` | Gated-page state, actions, and runtime-source contract. |
| `scripts/manifest-profile-discovery.test.mjs` | Characters discovery IDs/card-status pairing, future slot, and Profile controls/disclosures. |
| `scripts/manifest-runtime-regressions.test.mjs` | Player shell/HUD sibling association, opaque iframe contract, and score runtime. |
| `scripts/stories-publishing.test.mjs` | Stories, Manga, and Reader publication state and forbidden-content boundaries. |
| `scripts/wo002-contract.test.mjs` | Home, Play, game detail, player, and variant contracts plus typed registries. |
| `scripts/world-manifest.test.mjs` | Characters filter IDs, progression root, and per-record discovery hooks. |

The native migration's focused source suites are separate: `scripts/convert-owner-native.test.mjs`, `scripts/owner-native-projection.test.mjs`, `scripts/owner-native-runtime.test.mjs`, and `scripts/owner-native-character-interaction.test.mjs`. They cover conversion shape and typed fields, route/component preservation, no-shadow-HTML conversion, portable/live renderer provenance, protected runtime leaves, and character-card interaction behavior. They are regression evidence; their existence does not establish final site-wide acceptance.

## Legacy HTML boundary and protected compatibility

Native page components have no shadow `props.html`. The only permitted authored HTML properties are the exact three locked, protected runtime leaves documented in `docs/authoring/OWNER_NATIVE_MIGRATION_INVENTORY.md`: Home discovery loader, opaque-origin Wicked Bites iframe, and dynamic Reader image slot. Their original fragments and pinned code resources are verified separately. `/404.html` remains native `core.content-section` plus `layout.grid`, with no HTML-blob exception.

Historical blob inventories should be read in past tense. The 33-route pre-conversion corpus commonly placed whole sections in `core.rich-text.props.html`; those records are no longer the current page source. The bounded runtime leaves retain legacy fragments only to preserve existing behavior. Their continued presence must not be generalized into an HTML authoring path.

## Current qualification state and limits (2026-10-02)

- Website native regression suite: 136/136 PASS in the latest `Dwebsite-final-all-tests.log`.
- Studio saved qualification: 173/173 tests PASS; project validation has zero errors/warnings, graph has no dangling references, accessibility has zero errors/warnings, and Studio doctor passes 26/26 checks. Additional symbol and motion-compatibility tests are in progress; the final rerun is required.
- Studio's general `publishing.staticExport` profile and Pages UI are in progress to replace the owner CLI export step. They are not complete and have no passing qualification result yet.
- Owner preview gate: 16/16 steps PASS; browser matrix: 83/83 PASS.
- Home interactive discovery: 49/49 checks PASS and eight screenshots. App download: 44/44 checks PASS and eight screenshots. Stories/Manga/Reader: nine route/viewport cases plus the fixture reader flow PASS, with six screenshots.
- Visual comparison reports 12 cases PASS. Home, World, and App geometry match at desktop 1440, tablet 900, and mobile 390 widths. Characters geometry differs at all three widths as expected after removal of its prior layout control.
- The manifest gate has 20 green steps but its saved overall status is FAIL: `inputsUnchangedDuringGate` is false because the source fingerprint changed during the run (the dist fingerprint is unchanged). A clean rerun after source freeze is pending.
- Home's four typed native game cards and World's three whole-card preview links are complete. The baseline legacy `headlineAccent` value remains inert and preserved; it was not reactivated or recovered.

These results establish extensive current evidence but do not mean final qualification or package completion. The static-export profile/Pages UI implementation, clean manifest rerun, Studio rerun after in-progress symbol/motion compatibility coverage, and final package commit remain pending. See [OWNER_NATIVE_MIGRATION_INVENTORY.md](../docs/authoring/OWNER_NATIVE_MIGRATION_INVENTORY.md) and [STUDIO_CAPABILITY_REUSE.md](../docs/authoring/STUDIO_CAPABILITY_REUSE.md) for the canonical status and capability record. This documentation update did not run tests or verifiers.
