# Guest-Local Progression Foundation — 2026-10-01

## Result

**PASS — in-scope guest-local progression foundation.** This implementation is local to the website/browser and is not account progression, cross-device sync, a canonical economy, a game-score integration, or an entitlement system.

- Repository: `Matthew75x/toadal-feast-web`
- Branch: `work/guest-progression-foundation-20261001`
- Base: `914a79f0e36c003583282ea7461cb9f8aba8d52a`
- Implementation commit: `ba9de0c2ddece7710efdb7c48acf24cce51bf935`
- Studio project: `studio-project/toadal-feast-website/project.json`
- Toolchain: Node `v22.23.2`, npm `10.9.8`, TOADAL Studio `1.4.2`

The implementation advances the guest-local progression contract for manifest rows 14, 15, 16, and 20. Home remains visually and behaviorally unchanged; no Arcade/game package, backend, identity/account, or deployment work was included.

## Implemented behavior

- Existing Feast Pass now renders browser-local level, XP, editable starter Sparks, zero Treats, streak, discoveries, daily check-in, and scoped clear controls.
- Added `/feast-pass/quests/`, `/feast-pass/rewards/`, and `/profile/`, registered through the Studio page index.
- Route-visit configuration records actual `/world/` and `/stories/` visits and one local discovery for each. Reloading does not count the same route event twice.
- Four isolated local-storage records are used: `toadal:web:v1:feast-pass`, `toadal:web:v1:quests`, `toadal:web:v1:discoveries`, and `toadal:web:v1:profile`. Malformed data falls back safely; future schema versions are not overwritten. Clear removes only those four keys and preserves unrelated Arcade/mobile keys.
- Starter configuration is editable and explicitly non-canonical: daily check-in `5 XP / 1 Spark`; each configured route quest `10 XP / 1 Spark`; `100 XP` per level. Values are not permanent reward promises. No approved food/Treat catalog or claimable entitlement catalog is connected; Treats remains zero and milestones are informational only.
- Runtime scripts load through Studio’s advanced-code hook only on the exact six routes `/feast-pass/`, `/feast-pass/quests/`, `/feast-pass/rewards/`, `/profile/`, `/world/`, and `/stories/`. The loader derives the site root from the brand link and loads definitions before runtime. Home and News were browser-verified not to request these scripts or touch progression storage.

## Validation and generated-site evidence

- `toadal.inspect(scope="workspace")`: 18 pages, 4 games, 41 assets, 28 components; validation valid with 0 errors and 0 warnings. The graph has 104 nodes, 62 edges, and four existing dangling `component.home.games -> game.card` references; these Home references were not changed by this work.
- `toadal.qa(level="quick")`: PASS; validation clean; all nine accessibility heuristics passed with no reported issues.
- Studio render: PASS, 97 generated files.
- Static export: PASS, `build/exports/toadal-feast-website-static-site.zip` (38,017,774 bytes).
- GitHub Pages base-path transform: 19 HTML files and 510 URL rewrites; `verify-pages-basepath` PASS; `verify-static-links` PASS (19 HTML pages).
- `toadal.checkpoint(mode="verify")`: PASS; validation clean, no errors or warnings.
- The nine in-scope tracked `dist/` files have SHA-256 matches against the final Studio export. Home’s `pages/home.json` and `dist/index.html` have no content diff from the base.
- `npm run ai:doctor` in Studio 1.4.2: PASS; all reported checks passed.
- `node --test scripts/guest-progression.test.mjs`: **17/17 PASS**. JavaScript syntax checks and `git diff --check` also pass.
- Final local Chromium/Playwright browser matrix: **33/33 PASS** against the final static export. It covered all six gated routes, script order and both root/project base paths, Home/News exclusion, daily and quest claims, real World/Stories visits, reload idempotency, profile/reward rendering, reset isolation, corrupt-storage safety, loader-failure fallback, 360px/320px overflow, keyboard focus, and absence of console/runtime errors. Screenshots are in `docs/review/GUEST_PROGRESSION_FOUNDATION/evidence/` (`feast-pass-desktop.png`, `quests-desktop.png`, `rewards-desktop.png`, `profile-desktop.png`, `profile-mobile.png`).

### Separate Studio package-suite note

The Studio repository’s broader `npm test` suite is not the guest-progression test suite. With the installed Chromium and Python Playwright executables supplied through process-local `CHROMIUM_BIN` and `PLAYWRIGHT_PYTHON` overrides, and `TOADAL_PROJECT` unset, it completed **78/81** tests. The three remaining failures are outside this website change:

1. Test 75, Tier 2 game-web-pack press-pack workflow: `ZIP_FAILED: null`; the package invokes external `zip`, which is unavailable here and has no Windows fallback.
2. Test 77, Tier 3 optimized-media workflow: ImageMagick/`magick` is unavailable.
3. Test 78, Tier 3 HTTP import-optimization workflow: the same missing ImageMagick prerequisite; QR assertions passed before image optimization failed.

Without the Chromium/Playwright overrides, browser-discovery tests 32 and 81 also fail; both pass with those local overrides. `toadal.qa(level="full")` itself could not spawn `npm.cmd` (`spawnSync npm.cmd EINVAL`), so the direct `npm test` result above was captured. No Studio source, test, or assertion was modified to alter these results. These unrelated Studio package prerequisites do not block the in-scope website feature checks.

## Scope and deployment boundary

- Tracked `dist/` changes are limited to the progression stylesheet/runtime and Feast Pass, Quests, Rewards, Profile, World, and Stories outputs.
- Generated Studio build, history, and handoff state is ignored/untracked and excluded from the commit.
- Home source/output and Home visual rules, Arcade assets/packages, `main`, and `staging/live-visual` were not changed.
- No GitHub Pages deployment was performed. The Pages workflow is restricted to pushes on `staging/live-visual`; this work branch push is not a deployment trigger.
- No WO-001 or other follow-on work is authorized by this result.
