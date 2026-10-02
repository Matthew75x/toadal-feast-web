# Owner native runtime compatibility boundary

Status: implemented bounded compatibility for three protected fragments. All 33 pages have been converted to native authoring; exactly three small runtime leaves remain as locked `core.rich-text` components. This is a narrow compatibility mechanism for existing behavior, not a general runtime-fragment authoring system.

## Why these three leaves remain

The fragments carry behavior that ordinary owner-authored markup cannot safely replace: the Home discovery loader starts first-party interactions, the Wicked Bites frame runs an isolated game preview, and the reader image slot receives its page image and alternative text from published story data. Keeping each exact original fragment inside a read-only leaf preserves those semantics while the rest of each page is editable native content.

The converter allows a fragment only when its route, original parent component ID, kind, exact node attributes/shape, and byte limit match an entry in `RUNTIME_EXCEPTIONS`. Unknown routes, parents, or altered fragments remain diagnostics and conversion failures. Each emitted leaf carries `runtimeVersion: 1`, a SHA-256 digest of its exact original HTML, its policy identity, and the pinned code resources. The leaf is locked and read-only; these fields are not owner-editable HTML or generic attributes.

## Registered exceptions

| Route and original parent | Runtime kind and policy | Exact packaged resources (URL — SHA-256) |
| --- | --- | --- |
| `/` — `component.home.interactive-discovery` | `external-script`; `site-global-home-discovery-loader-v1` (`global-loader`) | `/assets/js/home-interactive-discovery.js` — `4a516b712dc3e1b276f81b5fe5b2a4cc45bfd978d145a8b13cc8739959686840`; `/assets/js/guest-progression.js` — `69984c7ce7b1ff79413b9275e345715a92badc131b4657fd26f4ae98e7c1cee2`; `/assets/js/manifest-shell.js` — `b5997ed5df1d715039835560c7b84a8373fd348b7ca28f9cffa29992ed51802e` |
| `/player/wicked-bites/` — `component.muogc5wx.80e0fg` | `isolated-frame`; `isolated-wicked-bites-frame-v1` (`sandboxed-iframe`), sandbox `allow-scripts allow-pointer-lock`, allow `fullscreen` | `/public/games/wicked-bites/index.html` — `26a8e1f0cc717560f30a786fa9705f4b538f01c742fa120eb1bf7544705f4fec` |
| `/reader/` — `component.comic.reader-preview` | `dynamic-image`; `stories-publishing-dynamic-image-v1` (`dynamic-image-slot`), selector `[data-reader-page]`, source must be absent | `/assets/js/stories-publishing.js` — `ab17e0ec3c363a0391740cfa605e5a5be69a027bbd837d624ae0462aa288c504`; `/assets/js/manifest-shell.js` — `b5997ed5df1d715039835560c7b84a8373fd348b7ca28f9cffa29992ed51802e` |

The resource entries in `scripts/convert-owner-native.mjs` are the authoritative values. Conversion also verifies the referenced files against those digests before writing selected pages. The iframe remains restricted to its registered target and capability profile; the reader image has no guessed static source; and the Home script source and `defer` attribute must match the registered fragment exactly.

## Compatibility limits

- The three runtime leaves preserve the exact original node fragment and existing runtime contracts. Their lock/read-only flags and versioned metadata are asserted from the converted project pages.
- Only those three exact route/parent/fragment combinations are admitted. No general registry API, arbitrary executable HTML, arbitrary resource URL, owner-selected sandbox capability, or new fragment kind is implied.
- The converter remains pure until its explicit project conversion workflow; unregistered, wrong-route, wrong-parent, changed-fragment, and unsupported-version inputs fail closed.
- Runtime resources are pinned by URL and content digest. The player policy does not grant `allow-same-origin`; the reader slot does not store a fixed `src` or page-specific `alt`.
- Native owner tag support used by conversion is supplied by the caller. The runtime qualification tests include Studio-supported `caption`, `progress`, and `tfoot` tags in that set.

## Qualification evidence and limits

`scripts/owner-native-runtime.test.mjs` reads nested components from every registered project page. It requires exactly the three registered runtime leaves, checks their route and original parent identity, exact policy/resources, HTML digests, lock/version fields, and source fragment semantics. It also verifies successful conversion with the registered exceptions and refusal without registration, on a mismatched route or parent, or after fragment/version alteration.

These are source and converter regression checks. They do not establish a functional browser pass for Home interactions, player controls, reader navigation, accessibility, or responsive behavior. Those behaviors require separate preview/browser qualification.
