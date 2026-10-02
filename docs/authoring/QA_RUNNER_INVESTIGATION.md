# Full Studio QA runner investigation

The first bridge full-QA run could not launch `npm.cmd` with Windows Node 22's shell-free spawn (`EINVAL`). The derived extension now launches npm's JavaScript CLI through the current Node executable, retaining the complete npm test script and separate arguments. No test was removed, skipped or weakened.

The next run executed 172 tests but inherited `TOADAL_PROJECT`, causing the Studio recovery suite to select the open website instead of its audited fixture (13 fixture mismatches). Three tool-prerequisite failures also occurred because the run used an incorrect local tools path. The corrected runner clears project-selection/import variables **only for the package test child**, preserving the explicit website manifest for validate/render/doctor. The prerequisite paths now point to `work/wo000-tools/`. Failed reports are retained as `studio-qualification-full.json` and `studio-qualification-qualified.json`.

An initial suspected temporary Home property was investigated before any restoration. `headlineAccent: "One recovered home."` is already present in both the authoritative `485e5cee...` baseline and source HEAD, as well as every migration history snapshot. It is an inert legacy field, not a newly introduced mutation, and was preserved. All 33 current page files match the latest completed Studio history snapshot byte-for-byte. No restoration or deletion of that property was performed.

The final successful bridge run is recorded separately in `studio-qualification-final.json`. Subsequent compatibility changes require a fresh final run before package completion.
