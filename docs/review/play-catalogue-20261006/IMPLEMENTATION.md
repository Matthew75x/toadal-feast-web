# Availability-aware Play catalogue

## Product scope

Advances manifest row 2 (Play / Games Hub), registry-driven availability, truthful release status, accessible filtering and the discover-to-existing-detail journey. This is a bounded website implementation, not whole-program acceptance or a new game admission.

The selected staging base is `6d3d52c370668cf6cb589442921a0b6a6dac4fca`; all website #15?#22 work is retained. The four existing listing records provide one configured playable Wicked Bites preview, one explicit CLAW launch hold and two concepts. A playable preview is not a PUBLIC release or a live health guarantee. No other game record is added to the listing.

## Implemented behavior

Native Studio controls support title search, All / Playable / Launch held / Concepts / Unconfirmed availability, an independent release-state selector, matching counts, Clear filters, stable keyboard focus, status and error explanations. Search uses canonical and displayed titles, case/accent-insensitive token matching and a bounded query. The unconfirmed category stays distinct from concepts and appears when needed.

Query and filter changes update only `q`, `availability` and `release` in the same-page URL. Reload, copied links, Back/Forward and browser page restoration retain the chosen state; unrelated campaign parameters and fragments are preserved. Typing adds one history step per interaction rather than one per character. When the browser rejects history updates, filtering still works but the UI explains that the address was not updated.

Existing cards/art and their detail links remain authoritative. The catalogue does not generate player links, create iframes, execute games, read or write progression, qualify TCS, grant a reward or change a launch flag. The previous release-only filter code is preserved for other/historical surfaces but does not attach to these new controls.

No JavaScript or a missing adapter leaves every authored listing and detail link readable, with disabled enhanced controls and a truthful fallback. Unsupported DOM projection does not impersonate zero games. An actual empty catalogue, genuine no matches, and unavailable filtering have separate states. Text is assigned as text, not interpreted HTML.

## Source-derived metadata and safe future edits

The native page is still `studio-project/toadal-feast-website/pages/play.json`; display labels/text/links remain owner-editable. `scripts/sync-play-catalogue.mjs` reads only IDs already listed by that page and derives classification, source-record hashes, badges and initial counts from matching `games/*.json` files. It does not discover or publish unlisted/hidden games.

An explicit hold wins over enabled flags or old package evidence. Incomplete or contradictory capability metadata is unconfirmed, not silently playable or a concept. A playable label additionally requires the existing source entry and connected detail/player records. Unknown publication-state changes, duplicate IDs or missing expected artifacts refuse synchronization/export rather than confer new authority.

For an explicitly approved catalogue/source update:

```text
node scripts/sync-play-catalogue.mjs --check
node scripts/sync-play-catalogue.mjs --write
node --no-warnings --experimental-strip-types scripts/export-staging-candidate.mjs <PINNED_STUDIO_ROOT>
```

`--check` is read-only and the default. Use `--write` only after reviewing the relevant game record and website source change; it updates presentation metadata, not approval. The standard exporter calls this check before writing an export. The existing Pages regression step verifies the projection before upload. No new scheduled workflow or provider service is introduced.

The new loader resource is included in the existing exact hash-pinned runtime inventory, with source/export LF checkout rules. Home and Comic Reader's dependent manifest-shell resource pins are updated without changing reader content. The one companion compatibility extension makes its existing bubble-placement algorithm avoid the full catalogue form, including the results summary, on desktop and mobile. Character drag/persistence logic is unchanged.

## Focused verification

```text
node --test scripts/play-catalogue.test.mjs
node scripts/play-catalogue-browser.mjs <REPORT_DIRECTORY>
```

The browser runner uses the existing Playwright module (`PLAYWRIGHT_MODULE`) and Chrome executable (`CHROME_PATH`) with a bounded action timeout, isolated contexts and a private loopback server closed in `finally`. It covers actual search/filter/detail navigation, existing held/concept launch boundaries, copied URLs, reload/Back/Forward, focus, phone-sized layout, full-form companion overlap and unchanged website progress. It deliberately does not launch a cartridge. Failure/no-JavaScript/unconfirmed/empty states are controlled inputs; phone widths are emulation, not physical-device certification.

The existing current-dist Python companion smoke was updated to recognize the new Held control while retaining its legacy Public witness. Syntax is checked; this operation's actual functional evidence comes from the Node browser runner, not an unexecuted Python suite. The older six-resource pin assertion is extended to the exact seven-entry inventory, retaining every original hash comparison and duplicate loader pin.

Fresh committed-source proof, source/merge identity, complete export equality, protected-artifact result and live deployment readback are recorded on the delivery PR. Working-copy passes do not themselves establish deployment. Prior failing attempts/screenshots stay in the local task evidence rather than being relabelled.

## Boundaries

All game records, game artifacts, player/detail routes, reward/quest definitions and guest-showcase/progression behavior are preserved. No production toadalfeast.com/DNS, native source or release approval, Publisher/TCS, Analytica, accounts, credentials, privacy/telemetry or spending changes. Delivery target is the established GitHub Pages staging site, with staging noindex retained.
