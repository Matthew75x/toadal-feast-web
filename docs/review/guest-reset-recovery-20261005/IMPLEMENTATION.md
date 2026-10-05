# Guest progress reset and reproducible runtime pins

## Implemented behavior

The Profile reset previously caught browser-storage deletion errors but replaced all in-memory records with empty defaults anyway. The displayed success could disagree with progress retained by the browser. A targeted baseline reproduction retained 10 XP on disk but incorrectly returned 0 XP.

Reset now reads back each of the same four owned guest-progression keys. It clears displayed records only when removal is observed, reloads retained records without discarding their future/corrupt-data protection, and preserves last-readable values as explicitly unverified when readback fails. Snapshot metadata reports cleared, retained, failed and unverified keys. A subsequent successful retry recovers the normal local-storage state. The existing snapshot return shape is retained with additive, non-persisted `storage.lastReset` details.

The actual reset button reports incomplete/unverified reset, successful browser reset, or temporary page-only reset distinctly. Its operation message is applied after normal rendering so generic storage diagnostics cannot obscure the result. Unrelated game saves and preferences remain untouched. No new storage key, progression schema, reward policy, account integration or game code is introduced.

This is truthful best-effort four-key reset, not a multi-key transaction, cross-tab locking system or account deletion service. Another tab can still write independently. A browser-denied operation is not presented as successful recovery or guaranteed deletion.

## Export repair

Studio validation exposed six existing runtime-resource references whose hashes described CRLF workstation copies rather than the committed LF files. The mismatch was independently checked against the baseline Git blobs. Home, Reader and Player resource metadata now binds the unchanged committed resource bytes, plus the deliberately changed guest runtime. Exact-path LF checkout attributes stabilize these five distinct source/export resources across Windows and Unix. Runtime HTML and protected game files are unchanged; no validator was relaxed and no cartridge admission was granted.

The static candidate was generated using the existing pinned Studio exporter. Authored source remained unchanged during export, all export checks passed, and three protected game artifacts matched their source. Only `dist/assets/js/guest-progression.js` changed among exported files.

## Verification

- 44/44 Node checks: 32 existing guest-progression cases plus 12 reset/resource-pin regressions.
- Six actual exported-Profile browser cases passed: denied removal at desktop and phone widths; silent retained profile; unreadable reset outcome; blocked localStorage/page-memory fallback; successful narrow-phone reset. Retries, reopens, foreign-key preservation and the exact loaded runtime hash were checked where applicable. No unexpected page exceptions occurred.
- Phone widths are desktop Chromium emulation, not physical Android/iOS acceptance. Failures are controlled Storage API fault injection, not claims about a particular device policy.
- Existing Studio validation, source/output freshness, base-path, link, staging-robots and protected-game checks passed.
- The existing Pages deployment workflow runs the focused Node regressions before upload; no additional broad QA workflow was added.

Reproduce the fast checks:

```text
node --test scripts/guest-progression.test.mjs scripts/guest-reset-recovery.test.mjs
```

Reproduce the bounded browser check using an installed `playwright-core` module and Chromium/Chrome:

```text
node scripts/guest-reset-browser.mjs <REPORT_DIRECTORY>
```

`PLAYWRIGHT_MODULE` may point to the installed module entrypoint; `CHROME_PATH` may select an existing browser executable. The runner uses its own temporary browser context and loopback server, blocks non-test-origin requests, and closes both on completion. It never connects to an existing owner browser session or launches a game.

Publication state is recorded on the pull request/deployment receipt, not inferred from these tests. Production, accounts, game source, Publisher/TCS and public telemetry remain outside this repair.
