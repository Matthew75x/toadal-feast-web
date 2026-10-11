# Owner native runtime compatibility boundary

Status: implemented bounded compatibility for four protected fragments. All 34 pages have been converted to native authoring; exactly four small runtime leaves remain as locked `core.rich-text` components. This is a narrow compatibility mechanism for existing behavior, not a general runtime-fragment authoring system.

## Why these four leaves remain

The fragments carry behavior that ordinary owner-authored markup cannot safely replace: the Home discovery loader starts first-party interactions, the Wicked Bites and CLAW frames run isolated game previews, and the reader image slot receives its page image and alternative text from published story data. Keeping each exact original fragment inside a read-only leaf preserves those semantics while the rest of each page is editable native content.

The converter allows a fragment only when its route, original parent component ID, kind, exact node attributes/shape, and byte limit match an entry in `RUNTIME_EXCEPTIONS`. Unknown routes, parents, or altered fragments remain diagnostics and conversion failures. Each emitted leaf carries `runtimeVersion: 1`, a SHA-256 digest of its exact original HTML, its policy identity, and the pinned code resources. The leaf is locked and read-only; these fields are not owner-editable HTML or generic attributes.

## Registered exceptions

| Route and original parent | Runtime kind and policy | Exact packaged resources (URL — SHA-256) |
| --- | --- | --- |
| `/` — `component.home.interactive-discovery` | `external-script`; `site-global-home-discovery-loader-v1` (`global-loader`) | `/assets/js/home-interactive-discovery.js` — `1055e4942c7481ac0ee5dd97b60a8a56e4cf6aec7b1b5dbcf2362c5e921c8658`; `/assets/js/guest-progression.js` — `baa82c9aa41b024f9b6dff58beade76c9f6e3625e6dcfffd28b81443ecf9f352`; `/assets/js/manifest-shell.js` — `dcae91f1c6681ad29179ca56e2fa9d8b9d93126ff3445cfc348c00e1d5995280`; `/assets/js/play-catalogue.js` — `347c0ee01761571ca583cb199d9ba989f169a7ff97fdaea874374c4054b92c39` |
| `/player/wicked-bites/` — `component.muogc5wx.80e0fg` | `isolated-frame`; `isolated-wicked-bites-frame-v1` (`sandboxed-iframe`), sandbox `allow-scripts allow-pointer-lock`, allow `fullscreen` | `/public/games/wicked-bites/index.html` — `783dfe877c931a6d142a1453eaddace6776d4852d4dae074a20b40975b47036c` |
| `/reader/` — `component.comic.reader-preview` | `dynamic-image`; `stories-publishing-dynamic-image-v1` (`dynamic-image-slot`), selector `[data-reader-page]`, source must be absent | `/assets/js/stories-publishing.js` — `b8f1b2b960fdaafc4b29cb4919693e66dfe92f88dda9cc5fe33b8923579733f3`; `/assets/js/manifest-shell.js` — `dcae91f1c6681ad29179ca56e2fa9d8b9d93126ff3445cfc348c00e1d5995280` |
| `/player/claw-feed-gulper/` — `component.player-claw-feed-gulper.muogc5wx.80e0fg` | `isolated-frame`; `isolated-claw-feed-gulper-frame-v1` (`sandboxed-iframe`), sandbox `allow-scripts allow-pointer-lock`, allow `fullscreen` | `/public/games/claw-feed-gulper/index.html` — `762afa5b995ea6cb06392a7a933773256885a989b88fc328a95cc94095656e16` |

The resource entries in `scripts/convert-owner-native.mjs` are the authoritative values. Conversion also verifies the referenced files against those digests before writing selected pages. The iframe remains restricted to its registered target and capability profile; the reader image has no guessed static source; and the Home script source and `defer` attribute must match the registered fragment exactly.

## Compatibility limits

- The four runtime leaves preserve the exact original node fragment and existing runtime contracts. Their lock/read-only flags and versioned metadata are asserted from the converted project pages.
- Only those four exact route/parent/fragment combinations are admitted. No general registry API, arbitrary executable HTML, arbitrary resource URL, owner-selected sandbox capability, or new fragment kind is implied.
- The converter remains pure until its explicit project conversion workflow; unregistered, wrong-route, wrong-parent, changed-fragment, and unsupported-version inputs fail closed.
- Runtime resources are pinned by URL and content digest. The player policy does not grant `allow-same-origin`; the reader slot does not store a fixed `src` or page-specific `alt`.
- Native owner tag support used by conversion is supplied by the caller. The runtime qualification tests include Studio-supported `caption`, `progress`, and `tfoot` tags in that set.

## Qualification evidence and limits

`scripts/owner-native-runtime.test.mjs` reads nested components from every registered project page. It requires exactly the four registered runtime leaves, checks their route and original parent identity, exact policy/resources, HTML digests, lock/version fields, and source fragment semantics. It also verifies successful conversion with the registered exceptions and refusal without registration, on a mismatched route or parent, or after fragment/version alteration.

These are source and converter regression checks. They do not establish a functional browser pass for Home interactions, player controls, reader navigation, accessibility, or responsive behavior. Those behaviors require separate preview/browser qualification.
