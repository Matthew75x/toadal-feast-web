# TOADAL owner self-service closure plan

Date: 2026-10-02. User approved implementation; bounded FOUNDATION engineering acceptance closed on 2026-10-03. See [closure evidence](OWNER_SELF_SERVICE_CLOSURE_20261003.md). Subsequent publishing/cartridge milestones and owner/off-machine dependencies remain separate; no release/deployment approval is implied. Starting-state findings below are historical, preserved for provenance.

## Outcome

Prioritize the owner managing the actual TOADAL website without code, JSON editing, terminal commands, or hand-editing generated output. Preserve the approved visitor-facing design.

The target workflow is: choose a page or starter, edit real content, save, reopen, preview desktop/mobile, deliberately make the page exportable, download the website, and recover from a backup if necessary. Export is not deployment.

## Verified starting points

- Website: `C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\toadal-feast-web-owner-native-authoring-20261002`.
- Website branch: `work/owner-native-authoring-20261002`; SHA `4d5f60ba06788939dc9a392249292777d972a07d`; tree `09b7984039a11db1159d9f131c5a9b849aa5e04f`. Clean when this plan was prepared, before adding this document.
- Studio: `C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\studio-owner-authoring-20261002\TOADAL_STUDIO_1.4.2_AUDITED_WEB_BUILDER`.
- Studio 1.4.2; same work branch; SHA `d18c692268eb88dbbc14f23c94dd9c0a95f379ee`; tree `0d197aac219e6925b2552e971e384722b3b0446c`. Existing generated audit-log modification is not new authoring source work and must be preserved separately.
- Canonical project: website root plus `studio-project\toadal-feast-website\project.json` (33 registered pages). Existing editor URL: `http://127.0.0.1:4323/`; do not stop its services.
- Existing image, structured biography, and link UI round trips are proven. Navigation label/order/save is proven. Blank pages, four generic templates, duplication, structure controls, backups, and static export exist, but not every workflow has owner-level acceptance evidence.
- Navigation and Page Settings lack the native inspector's complete draft protection. Backup/project context changes also need protection.
- Source inspection shows page duplication rewrites only top-level component IDs and inherits source metadata, including publication state. Template creation also needs recursive clone safety. These are demonstrated implementation risks, not a claim that a full runtime failure has already been reproduced.
- Historical broad qualification remains evidence, not a fresh test run for this plan. No tests, source modifications, or deployments were performed while preparing it.

## Guardrails

1. Continue from these checkpoints; do not restart migration or visual convergence.
2. Use an independent D: pilot project for temporary content and restored backups; verify free space and redirect TEMP/TMP/test caches away from C:.
3. Preserve both repositories before each meaningful implementation tranche. Commit intentional source/tests/docs and intentionally tracked generated output only; retain unrelated dirty artifacts without sweeping them into commits.
4. Do not change main, staging, production, cartridges, companion design, backend services, or deployment configuration. No automatic publish/deploy action is authorized by this plan.
5. Keep protected runtime leaves and established navigation, discovery, progression, storage isolation, and accessibility hooks intact. Do not blindly clone specialized player/Reader runtime pages as ordinary templates.
6. Never manually patch dist to make a workflow pass. Authored project data and the canonical renderer must produce the result.
7. Keep initial work bounded to the following foundation. Medium-sized publishing workflows below are subsequent milestones, not disguised quick fixes.

## Foundation: implementation order and definition of done

### 1. Uniform save, cancel, and project-switch safety

Reuse `owner-draft.js` for Navigation and Page Settings rather than introducing another save model. Show Saved / Unsaved / Saving / Not saved clearly. Resolve drafts before page/panel/project changes, restore/import, history actions, and export. Save errors, invalid values, and stale revisions retain entered work; Cancel restores the last loaded values without writing.

Acceptance: real UI Save/Discard/Keep-editing checks in both forms; reload persistence; rejected/stale save retains the draft; failed discard cannot silently navigate; Keep editing prevents backup import or project switching. Add focused regression tests for the affected transitions.

### 2. Safe page cloning and route handling

Introduce a shared recursive clone routine for duplication and page starters. Give cloned authoring components fresh IDs throughout children/slots and remap genuine internal component references. Preserve intentionally shared asset/symbol IDs and required runtime/DOM hooks; do not blindly rewrite all strings. New copies must be drafts, not inherit an existing page's public status or schedules.

Use consistent route normalization and readable conflict errors, protect Home/404, and reject unsafe paths. Do not silently rewrite unrelated links. Explain references deliberately retained from the original page.

Acceptance: copy a deeply nested Media page; edit copied image/text/links without changing its source; verify component references, source hashes, safe route output, and draft state. Exercise route collisions and invalid routes without leaving partial page/index writes. Test failure recovery and project-data coherence, not merely the presence of buttons.

### 3. One intuitive Create Page flow

Present three understandable choices: Blank, Template, or Start from an existing page. Ask for page title and destination, show the normalized route, and make draft status visible. Select the new page after creation. Offer an explicit Add to navigation action using the existing stable navigation data; do not automatically publish or alter menus.

Provide clear Edit content versus Build page affordances using the existing modes. Avoid forcing an owner to understand internal IDs, component types, raw collections, or unrelated game/HUD tools.

Acceptance: an owner creates a page, edits it, reopens it, deliberately exposes it in navigation, previews it, exports it, and clicks the resulting exported link without code or JSON. Verify actual draft/publication export behavior: a Draft badge alone is not proof that a draft is excluded from public output, Search, navigation, or sitemap. Existing accepted pages must remain unchanged.

### 4. A small TOADAL-specific starter set

Begin with a Media starter derived from the existing approved native Media layout, then a simple Article/Story-style content page and an Information page derived from appropriate existing native content. Retain generic templates where useful. Reuse the visual system; do not invent a new website style or fabricate approved editorial material.

Expose editable heading, body, image/alt/framing, related links, and repeatable sections. Keep shared global shell content separate from local page content. Preview or describe each starter before creation.

Acceptance: each starter creates an independent draft with safe IDs/routes, editable real fields, correct shared styling, and coherent desktop/mobile output. A story-style page is an ordinary narrative page; it does not claim automatic Manga/Reader catalogue integration.

### 5. Trustworthy section editing

Close the existing Add / Duplicate / Move / Hide / Delete / Undo paths. Use human-readable section labels; explain whether changes affect one page or a genuinely shared symbol. Confirm destructive operations and preserve a working Undo route. Warn about references when removing or renaming a page.

Acceptance: one safe-copy structure pilot covers adding text/image, duplicate independence, reordering, hide/show, deletion and Undo, save/reopen, and exported structure. Locked runtime content remains protected; original project files remain unchanged.

### 6. Finish the image/content editing experience

Build on the already-proven image and text controls. Preserve thumbnail selection and import. Make image name, alt text, fit, focal position, size/aspect, and the scope of desktop/mobile overrides understandable. Clearly show when a mobile override remains independent of a desktop replacement. Make the selected content's location obvious through existing page/layer selection.

Acceptance: repeat only the affected path after UI changes; verify intentional desktop and mobile results, including persisted project fields and emitted image/styles. Do not repeat the already-completed full image pilot if no relevant behavior changes. Do not add destructive library cleanup or blanket recompression.

### 7. Understandable export and recovery

Distinguish Export Website from Download Project Backup. Resolve unsaved changes first. Show preparation, failure, and successful generation/download initiation. Do not claim the browser saved a file to disk when the application can only observe that it initiated a download. Keep export distinct from deployment.

Before restore, identify the selected backup and explain independent-project restoration. Retain size checks and readable error feedback. After success show which project is open; after failure preserve the current project. Use existing page snapshots/history for smaller recovery operations.

Acceptance: export real authored values, exercise exported links, and restore a project backup into an independent copy. Compare meaningful project/assets and regenerate it. Repeat canonical static export on unchanged saved inputs and compare file paths/uncompressed hashes; ZIP timestamps alone do not establish nondeterminism. Corrupt/incomplete backup tests must not overwrite the canonical project.

### 8. Owner walkthrough, evidence, and preservation

Supply a short visual owner guide: edit an existing page; create a Media page; add text/image/links; arrange sections; add navigation; preview; export; Undo/restore. Use actual Studio labels and explain protected content and publishing boundaries.

Reconcile stale capability/status documents with exact website and Studio checkpoints. Clearly separate implemented, UI-proven, owner-approved, and externally gated capabilities. Update the authoritative ledger only where evidence and owner authority permit; no automatic LOCK_VISUAL claim.

Refresh the Studio recovery bundle/config/evidence and verify local reconstruction. Transfer off-machine to ASSIGNATOR only using an available approved destination, then verify recovery there. If the destination is unavailable, record that remaining preservation step honestly rather than claiming it completed.

Acceptance: one representative owner session completes the end-to-end flow without code, with compact receipts/screenshots and coherent committed source. Report exact remaining limits. Home visual approval and the companion overlap decision remain explicit owner decisions, not engineering tests.

## Worthwhile subsequent milestones, not foundation blockers

### Structured Stories/News publishing

After foundation acceptance, a real no-JSON editor over the existing editorial registries is the next high-value feature. Scope Stories to series/chapter metadata, ordered page images, draft/preview/publication, and integration with the existing Stories/Manga/Reader path. Scope News separately to factual article metadata/body/media and existing Devlog discovery.

This is medium-sized implementation, not an almost-complete upload wizard. Use owner-supplied content; preserve existing progress/bookmark contracts, publication rules, and Search discovery. Qualify one safe-copy authored story through the actual catalogue and Reader before claiming support. An ordinary story-style page does not satisfy this capability.

### Prepared game-cartridge onboarding

Defer until separately scoped after owner-authoring closure. A validated prebuilt browser cartridge is different from uploading raw game source. Qualification must cover package integrity, player integration, messaging, sandbox/storage behavior, registry states, and real gameplay. Do not promise arbitrary source compilation or automatic public release.

## Explicitly not worthwhile in this tranche

- Another visual redesign, wholesale companion changes, or a new builder framework.
- Authentication/cloud/commerce/community infrastructure already owned by external systems.
- Fabricated story chapters, official store URLs, legal copy, or gameplay claims.
- Broad frozen-asset pruning, blanket optimization, or unrelated refactors.
- Production cutover, staging promotion, main merges, or deployment.

## Parallel work and proportionate verification

Use a small number of focused agents, not maximum agent count. A safety worker can implement draft helpers/tests; a clone/template worker can implement recursive clone logic/tests; a QA worker can pilot the integrated safe copy; a documentation worker can prepare the owner guide and receipts. Keep write sets disjoint. The lead alone integrates shared `studio.js`/server wiring and controls canonical generated output. Never let multiple agents render into the same project/dist.

Start with focused tests and real UI operations for the changed paths. After foundation source is frozen, run the canonical validation -> inspect -> render -> static export -> verify checkpoint flow on the exact relevant project, plus affected route/base-path/static-link/mobile checks. Reuse historical broad evidence for unaffected paths; rerun a wider gate or matrix only when impact or an actual regression warrants it. Use D: temporary storage and checkpoint before any longer qualification.

## Success demonstration and stop condition

The impressive result is an owner creating a new TOADAL-styled Media page, uploading a picture, framing it, adding narrative and links, arranging sections, saving/reopening, adding it to navigation, viewing mobile output, exporting a working site, and recovering a backup entirely through Studio.

Foundation is closed only when that representative workflow and safety checks pass from committed source, export matches authored data, limitations are explicit, and recovery is proven. Record any off-machine/owner-approval dependency separately. Stop at the checkpoint/report; do not roll automatically into Stories publishing, cartridge integration, or deployment.

Recommended first implementation tranche: uniform draft/project-switch protection plus recursive page-clone regression coverage, before adding TOADAL starters.
