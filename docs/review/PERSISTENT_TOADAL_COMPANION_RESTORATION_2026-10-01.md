# Persistent Toadal Companion Restoration — 2026-10-01

## Result

**PASS at source + projected-browser qualification. Authoritative Studio render is still required before staging is updated.**

This task restores the intended Toadal website-companion behavior that regressed in the owner-preview visual closure.

## Root cause

The regression is explicit in owner-preview commit:

`96313ac7bb662c6a8660fcdd8a5a92969ae0020f`

That commit added several later CSS overrides forcing the contextual helper into page flow:

- `position: static !important`
- comment: `no floating mascot over content`
- comment: `Keep the contextual helper in document flow`

Those rules overrode the earlier global fixed-position companion contract.

That was contrary to the product behavior: Toadal is a persistent contextual companion, not footer/page-flow decoration.

A second QA defect allowed this to pass: the browser matrix checked companion overlap and viewport bounds but did not require the helper itself to remain `position: fixed`.

## Restored behavior

The source now explicitly requires Toadal to:

- remain fixed at the viewport bottom-right while the page scrolls;
- respect safe-area insets;
- remain non-blocking outside the visible panel/toggle;
- preserve the user-collapsible/minimized preference;
- react to hover, keyboard focus, touch, explicit actions, and visible page sections;
- change approved contextual artwork where an approved pose exists;
- move and grow slightly when engaged;
- briefly pulse when reaction context changes;
- disable motion under `prefers-reduced-motion: reduce`;
- never follow the cursor.

### Size

Previous general helper artwork was approximately 78×82 desktop and 52×56 mobile.

Restored presentation is deliberately a little larger:

- desktop: **96×104**
- mobile: **66×72**
- engaged state: up to approximately **1.08× scale** plus a small upward movement
- context-change pulse: approximately **1.10× peak** for 360ms

This makes Toadal readable without turning him into a large content obstruction.

## Missing-route audit

The source audit found six registered routes that had context metadata but no actual companion component:

- `/404.html`
- `/player/wicked-bites/`
- `/feast-pass/`
- `/feast-pass/quests/`
- `/feast-pass/rewards/`
- `/profile/`

A companion component is now present on each.

All **30 / 30 registered routes** now contain a companion source surface.

The Wicked Bites player uses an intentionally unobtrusive persistent helper and passed overlap qualification.

## Context behavior

Existing contextual runtime behavior was preserved and extended.

The companion already supported:
- World
- Support
- App
- Stories / Media
- Settings
- Search
- Contact
- News
- Maintenance
- Privacy
- Account
- Notifications
- Sound / mute
- Registration
- Delete account
- Rating
- Survey
- Positive / negative feedback
- AI disclosure
- Partnership
- Community
- Merchandise
- Reward
- Download

This restoration adds explicit semantic coverage for:
- Play / game / preview / player
- Feast Pass / quests / rewards / Sparks / streak
- 404 / lost / error / empty state

No unapproved artwork was invented. Play can use the canonical default Toadal image when no specific approved contextual derivative exists.

## Regression-proofing

Added:

`scripts/verify-persistent-companion.mjs`

It rejects:
- static-position companion overrides;
- missing fixed bottom-right positioning;
- accidental downsizing below the restored presentation;
- loss of hover/focus/touch behavior;
- loss of section-aware reactions;
- loss of contextual artwork mapping;
- loss of reduced-motion handling;
- cursor-following behavior;
- registered routes missing a companion source component.

The verifier is wired into:

`scripts/owner-preview-gate.py`

The browser matrix was strengthened to detect:
- missing companion;
- companion that is no longer fixed;
- out-of-viewport companion;
- severe control overlap;
- actual hover/touch reaction state on Home;
- actual transform/movement when reduced motion is not requested.

The render-freshness verifier now also rejects any authoritative rendered route that loses its `<aside class="toadal-companion">...` surface.

## Qualification

Fresh source qualification:

- Persistent Toadal companion verifier: **PASS**
- required website suite: **48/48 PASS**
- Home visual contract: **PASS**
- navigation truth: **PASS**
- character registry: **PASS**
- gated ecosystem: **PASS**
- manifest compliance: **PASS**
- Search/Discovery: **PASS**
- non-Home truth: **PASS**
- visual asset authority: **PASS**
- non-Home layout closure: **PASS**
- cartridge storage isolation: **PASS**
- browser-matrix syntax: **PASS**
- owner-preview gate syntax: **PASS**
- `git diff --check`: **PASS**

### Projected browser proof

Because authoritative Studio 1.4.2 is available in Codex's separate environment, browser qualification here used a temporary projection only:

- current source CSS projected onto the existing rendered owner-preview output;
- current advanced-code runtime projected into rendered pages;
- newly added companion components projected into the six missing rendered routes;
- generated `dist/` restored afterward and not committed.

Result:

**77 / 77 PASS across all 30 routes**

The strengthened Home interaction witness proved:
- desktop engaged state: true;
- desktop World reaction: `curious`;
- desktop image transform: active;
- mobile engaged state: true;
- mobile World reaction: `curious`;
- mobile image transform: active;
- no fixed-position failures;
- no companion out-of-bounds failures;
- no severe companion/control overlap failures.

Evidence:

`docs/review/persistent-companion-restoration-20261001/browser-matrix-projected.json`

## Render status

The checked-in `dist/` remains the prior owner-preview render, so the stricter render-freshness verifier correctly fails until Studio is rerun.

It specifically identifies the six routes whose old render lacks the newly restored companion, in addition to previously known source/render truth deltas.

This is expected and must not be bypassed by hand-editing `dist/`.

## Required handoff

Codex should start from this fix branch, run the authoritative Studio 1.4.2 render/export, and then rerun the complete owner-preview gate.

Only a fully green authoritative render should replace `staging/live-visual`.

No staging, `main`, or production deployment occurred from this restoration lane.
