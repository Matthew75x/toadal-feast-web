# Studio publisher export contract

The selected Studio authority is 1.4.2 at commit `2e77fa3c2930a109b570a2e6475a28355ebe0971` (tree `f3c6279c103e2b5918b5f3ff89e0306e8ccab955`). The later branch head `d43041537ceee5ea531690f1e51b5aae447d9ed8` is an owner UI/test follow-up; it was not used for this proof.

## Export from authored source

The Studio manifest uses generated rendering, `reference` asset inputs, enabled `collections/advanced-code.json`, and the staging base path `/toadal-feast-web/`. The supported static export API is `packages/export-manager/src/index.ts:exportStaticSite(absoluteManifestPath)`. It renders reference assets and advanced code, applies public export protection and base-path processing, then creates the project static ZIP.

Use a verified full checkout of the pinned Studio commit, install its locked dependencies with `npm ci --ignore-scripts`, and export an independent frozen project copy. Set TEMP/TMP to a sibling directory outside that copy. The existing website flow is:

```text
node --no-warnings --experimental-strip-types scripts/run-studio-visual-convergence.mjs <frozen website root> <absolute frozen project.json> <verified pinned Studio root>
```

That flow also records a checkpoint in the independent copy. A narrow export harness may call the supported static export function directly. Neither workflow performs an external deployment.

Fresh export proof compares extracted content ledgers from two independent exports, every runtime module against authored source, loader injection in all 33 parent documents, and all three protected Wicked Bites files against qualified Git bytes. Matching copied files alone is insufficient. ZIP metadata may differ while extracted bytes match.

## Final r2 source binding

The r2 candidate archive SHA256 is `9ed08a3cc237913ff162f2499e0d4b346311bf77e5ee895387b7f245b74a70b7`. A fresh frozen copy of the final authored Studio project contains 179 files with content-ledger SHA256 `e5781a0664bb8f59f8079d9afa81464381129ec998f3e6cccd38d2db7ba49549`. The pinned exporter validated that copy with zero errors and zero warnings, then exported it twice. All fourteen integration modules, including final account UI and controller, are byte-identical between authored source, fresh exports and the immutable r2 candidate. All 33 parent documents contain the independent loader exactly once; the protected child contains none. All three game files remain exact qualified Git bytes. The frozen source remained unchanged and matched the actual source after export.

These facts prove future source export survival for the final r2 runtime. They do not claim full candidate/export packaging parity, live backend acceptance or rollback. Independent exports contain 154 files; the admitted candidate has 156. The 36 differing paths comprise the 33 parent HTML documents, the candidate external loader and public integration receipt, and staging robots packaging. The four background representation repairs are preserved. The execution dossier keeps both fresh archives, extracted ledgers, source checksums, derived CSP, browser results, static scans and all earlier failures outside source control.

The r3 profile input guard changed only `profile-ui.js` and its public checksum receipt. A controlled deferred response reproduced the initial GET overwriting a typed or deliberately cleared display name in both actual-source tests and offline Chrome. The guard preserves the draft while retaining normal untouched prefill; all 92 source tests and the same three offline Chrome cases passed. Its separate pinned export proof retained all fourteen runtime modules, 33 loader parents and three exact game files, and passed the fresh finite-CSP route/game check. The historical r2 and r3 artifacts and proofs are preserved.

## Final r4 source binding

The final r4 candidate archive SHA256 is `a1dabf5d2932bf5fee08886d3df8450133e2544c4a989380a11f03d4b232e115`. Website implementation commit `d9ab9c2bb09fb32b34845a617f78d751b630a766` (tree `03db070317edc973b87124221f038d99b198c45a`) records its source. The final frozen Studio project contains 179 files with content-ledger SHA256 `bd54f391a74c76c5653c8d1d7f4fbf85715a39db0eee5f5a8bbdfc0575a8687c`. Both fresh exports validate with zero errors and warnings and yield identical 154-file extracted content, ledger SHA256 `7ff8ddd9be78acfbabed532c9ca1364414f46fb2ea00539687e2289ebe777a4b`.

All fourteen runtime modules match source, both fresh exports and the sealed r4 candidate. All 33 parent documents retain the full advanced-code block and independent loader exactly once; the protected child contains neither. The three protected game files remain exact qualified Git bytes. Actual authored source and the frozen input remained unchanged after export. A fresh Chrome check passed all 33 routes, finite CSP, missing-config inert behavior and the real game at 1440 pixels; the live candidate campaign has its own receipts.

R4 changes the controller's legal selector to the canonical `requiredForAccounts` boolean set. Optional unapproved EULA no longer blocks otherwise approved required documents. Every required document still needs a unique safe key, approved non-draft version and safe path; missing or malformed requirement flags and empty or duplicate required sets fail closed. Account UI consent checkboxes follow that exact required set. Registration remains held by the actual staging audience/legal/runtime gates. The r4 public delta from r3 is exactly the controller and public checksum receipt; no cartridge code changed.

Full source-export/candidate packaging parity still fails on the same 36 documented paths. Fresh output uses inline advanced code and needs its own derived parent CSP. This proof establishes source runtime survival and preserves that limitation; it does not replace the admitted artifact or establish full integration/rollback acceptance. The final execution receipt is `evidence/studio-export-proof-r4-20261004/studio-source-to-export-proof-final-r4.json` in the task dossier outside source control.

## Source byte and background requirements

Reference runtime resources use exact qualified Git blob bytes. Six `runtimeCodeResources.sha256` fields in Home, Reader and Wicked Bites Player pin those exact bytes. The checkout CRLF conversion was removed from 17 reference files; this changed no executable text after newline normalization. Do not repin resources to an incidental local checkout conversion.

The four section backgrounds in Feast Pass, Quests, Rewards and Guest Profile are authored as:

```css
background-image:url(/assets/images/world/candy-kingdom.webp)
```

Their `backgroundAsset` field is empty; the original binding was `asset.home.world.desktop`. Cover sizing and the 50%/50% focal position remain unchanged. Edit these four background URLs through their `style` field while using this pinned Studio version. Reassigning `backgroundAsset` makes its renderer emit a quoted, HTML-entity-encoded URL that the pinned base-path processor does not rewrite. This representation change was proved through all 33 fresh routes, the unchanged real game, and exact background appearance comparisons at 1440, 768, 390 and 320 pixels. It does not change text, design, components, or cartridge code.

## Fresh output and CSP

Studio includes the publisher loader in its existing inline advanced-code block. The current candidate loads a separate external loader. Fresh export parent HTML bytes and the inline script hash therefore differ. Derive parent CSP from the actual fresh output before serving it; the candidate parent policy cannot be reused unchanged. Protected child bytes and child CSP remain exact. Proof exports are separate artifacts and do not replace the current candidate.

## Runtime tests

```text
node scripts/run-publisher-integration-tests.cjs
```

The 97 tests use actual authored runtime modules and the actual dist loader. See `scripts/publisher-integration-tests/README.md` for scope. The source-to-export, browser/CSP, staging backend and external approval gates use separate receipts. Generated ZIPs, screenshots, service logs and synthetic browser state belong in the execution dossier, outside source control.
