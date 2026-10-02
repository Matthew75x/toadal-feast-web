# Characters owner-authoring pilot

Status: PASS for the bounded Characters pilot, 2026-10-02. This is not final site-migration qualification and is not a deployment or LOCK_VISUAL acceptance.

The canonical migration project contains 167 nested, version-1 native presentation objects instead of one full-page HTML string. The product copy/art were preserved. Testing changes were made only in the independent project created with Workbench → Duplicate: `owner-pilot-qa-20261002`. That ignored QA project and its temporary imported screenshot are excluded from product commits and the final Studio package.

## Real Studio UI evidence

Using the actual Studio UI (not API substitutes), the pilot selected Princess Lily's image; replaced it through the named asset picker; switched cover/contain; set focal 35/25, height 220 and aspect 4:3; edited Inspector copy; selected World through the route picker; reordered and duplicated the card; and exercised undo/redo. The canonical Princess Lily asset was restored in the QA copy afterwards. The replacement/framing, description and route persisted after saving, closing the tab, stopping Studio and reopening the same QA project.

The pilot also imported an existing PNG (deduplicated by Studio), optimized the asset through Studio, uploaded a new QA-only JPG, inserted it from Assets, inspected its component usage, hid/deleted it and exercised undo/redo. A native section and child text were inserted through Studio. Double-click inline copy edits saved through the source/origin/session-checked preview bridge. The fresh reopened tab recorded zero console errors after the autosave/inline mutation queue correction.

Gully's awkward-aspect-ratio canonical art was framed through the UI using contain, focal 65/35, height 180 and aspect 3:2. A mobile-only height override of 150 applied at a real 390px preview; Tablet inherited 180. Desktop 1440, Tablet 900 and Mobile 390 previews were exercised. Content mode withheld geometry/add/remove controls and decoration drag handles while retaining safe copy/asset controls.

The existing free canvas was inserted through Studio. Real pointer drag moved its QA text decoration from (80,64) to (152,120), the resize handle changed 160×40 to 224×80, and the rotation handle produced 50 degrees. All five geometry values survived another Studio stop/reopen. Logical-scale pointer tests additionally cover 75%/50% zoom; real pointer manipulation used 100% zoom. A 1441px QA host viewport avoided a fractional-coordinate limitation in the browser-control tool; no website styling was changed to accommodate that tool limitation.

## Export and functional proof

Workbench → Export Website downloaded two static ZIPs from the unchanged saved QA project. Both contain 143 files; every corresponding uncompressed file has the same SHA-256. ZIP archive hashes differ due to archive metadata, so this proves deterministic output contents, not byte-identical ZIP containers.

- First ZIP SHA-256: `8bccdbe76ee24d7e28b8653176f77d22c660be15d1d54605e35357f4b5b4a6a7`.
- Second ZIP SHA-256: `17fa7fb7db7475bb6af63c7e16f8fd11f8e1c7dd079ff188d68e3e86ec61dd9e`.
- `index.html` and `404.html` exist; exported Characters HTML has no preview editing bridge or decoration-control script.
- Studio validation: valid, zero errors/warnings. Verify checkpoint: PASS, `owner-native-characters-ui-pilot-verified`.
- Existing authoritative Pages adapter applied `/toadal-feast-web/` and staging robots to the QA export copy, not to canonical `dist/`.
- Standalone local export: visible Genies filter showed precisely Sweet/Fruity/Savoury Genie. Keyboard Enter on the whole Sweet Genie card produced one discovery. Pointer activation of the whole Gully card produced the second; reload restored both. Clicking the whole Toadal profile card navigated to `/toadal-feast-web/characters/toadal/` and recorded the third discovery on return.
- At 390px: no horizontal overflow; zero broken visible images; Gully natural width 319, contain, focal 65/35 and actual height 150. No console errors.
- Automated real-handler tests cover click, touchend, Enter, Space, idempotence and nested-secondary-action isolation. Real browser proof covers keyboard and pointer activation; it does not claim a physical touchscreen was attached.

## Evidence

- `evidence/characters-image-framing-mobile-ui.jpg`
- `evidence/gully-framing-mobile-ui.jpg`
- `evidence/characters-free-canvas-drag-resize-rotate-ui.jpg`
- `evidence/characters-pilot-export-mobile.jpg`

These screenshots show a disposable QA copy, including explicitly QA-only text and framing edits. Those edits must not be mistaken for approved product content. The unchanged canonical project is the source for subsequent page migration.

Studio suite at this checkpoint: 160/160 PASS, zero skipped. Final site-wide gates and final package qualification remain required after migration.
