# Website shared audio runtime qualification — 2026-10-07

Disposition: infrastructure review candidate; not deployed. PR #35 remains draft.

## CI failure disposition

Exact base `839fe227e36526e9e8fbb75e5421a217bcaa72c8` passed the unchanged staging command **281/281**, zero skips. Exact original candidate `ce2d8ec6ef81a96cd886f4211e11ea236749215c` (tree `38214da72bb6fabec8efd0a580bf820aed0e84ad`) reproduced **279/281** and exactly the two `ENOENT dist/assets/js/advanced-code.696ecde0ccc9.js` failures in hosted run **37581973332**, job **112663477088**.

The audio loader changed Studio advanced JavaScript, but committed dist retained `advanced-code.8c9ede2cbb6a.js`. This was a branch-induced export-coherence failure. The fix uses the existing pinned Studio exporter and advanced-runtime externalizer to regenerate dist. All 33 website pages now reference the exact derived `696ecde0ccc9` resource. No resource test or integrity pin was weakened or replaced arbitrarily.

The earlier qualification's claim about two inherited catalogue failures is withdrawn. Windows CRLF checkout conversion altered raw hashes in preliminary local runs; clean Git-blob checkouts produced the exact results above. Canonical-byte base and original-candidate TAP logs are in this evidence directory.

## Focused fixes

The adapter retains host ownership after active/muted through available/degraded and transport failures. Only explicit unavailable returns local ownership. Host playback checks lifecycle, cooldown and voice limits after sample loading, preventing concurrent admission and delayed playback after mute/hide/disposal. Persisted mute suppresses local fallback before any AudioContext exists. Activation is serialized, sample prewarm is sequential, denied storage and malformed messages fail safely, and concurrent attachment shares one host. Hidden pages stop/cancel host playback; normal exit closes the context/cache, while back/forward-cache navigation suspends/restores the same context.

The existing hardener validates/emits bounded declarations and requires conditional protocol vocabulary. Coverage now includes nine negative schema mutations, missing protocol tokens, no-audio behavior, opt-in manifest emission, exact input/output game bytes, and no runtime injection.

## Verification

- Hardener: **16/16**, including nine negative schema subcases; Python 3.11.6, Pillow 12.3.0, jsonschema 4.26.0.
- Focused audio + existing player/manifest/protected/score checks: **56/56**; audio subset **31/31** (including three lifecycle subtests).
- Unchanged staging suite: **281/281**; policy regressions: **25/25**. Zero skips.
- Existing Studio export at `ffebf68559c0866e8e68b3de1470fa89ee654013`: PASS, authored source unchanged; Pages/basepath, static links, crawler and freshness checks pass.
- Existing Studio source provenance uses two CRLF Windows representations and an LF presentation dependency. These representations reproduce existing byte pins; Studio code and provenance pins were not changed.
- Protected Wicked Bites: **3/3** files match exact base, Studio reference and preservation policy. No migration.
- Real installed Chrome **154.0.8037.98**: **30/30** checks, zero browser errors. Scratch manifests/registry/gameplay responses are test-only HTTP overlays; protected files are never edited.

Non-opted-in Wicked Bites requests loader + manifest once each; host and registry zero times; no feature-created context; original host:mute/unmute remains. Scratch opt-in requests loader, manifest, host and registry once each; no context before sound gesture; one running context afterward; semantic action plays procedural fallback. Mute suppresses shared and legacy playback, survives reload without context creation, and only explicit unavailable returns local ownership.

## Exact bytes

| Exported asset | Raw bytes | gzip bytes (level 9) |
| --- | ---: | ---: |
| website-audio-loader.mjs | 1,584 | 689 |
| website-audio-host.mjs | 28,992 | 8,064 |
| audio-registry.json | 292 | 219 |

Incremental dist versus exact base: **32,664 raw bytes**, **9,190 gzip bytes**, net **3 files**. Gzip impact is the difference between sums of individually compressed files, not a ZIP size or download-saving claim. The common advanced runtime grows 968 raw bytes / 34 gzip bytes; generated HTML changes only its exact runtime references. Scoped optional control CSS adds 828 raw bytes; the host is loaded only for opted-in cartridges. Production registry remains **0 cues / 0 profiles**.

## Final Git binding and held gates

The committed JSON receipt binds the authored-source fingerprint and exact dist hashes. After the finish commit, qualification is rerun from clean final HEAD, and its full HEAD/tree, hosted check run IDs and final browser receipt are recorded in the PR body and exported final-head receipt. A commit cannot contain its own SHA. No earlier dirty-working-tree browser run is presented as final-HEAD proof.

Owner/integration review, owner listening, physical phone/Safari and latency acceptance remain held. No production cue admission, actual game migration, native/TCS change, merge, DNS change or deployment was performed.

One possible next operation: a separately reviewed Global Food Launcher game/profile migration, drawing on its development pilot semantic boundaries only after its ordinary cartridge and website admission gates. That pilot is not current public website authority.


## Authorized headphone-comfort follow-up

The prior infrastructure candidate `f453cd082a841d65fdd40aeb21470bf14e9a84cf` had green hosted checks. The follow-up adds native site-volume and gentler-stereo controls inside the existing opted-in player and preference key; it does not admit any cue or migrate a game. New preferences start at 25%, with a fixed 0.5 digital output factor and user attenuation after compression. Panning defaults to 60% range and adjusts active sounds smoothly. Samples and fallback tones have short zero-edge envelopes; stop/steal fades retain physical voice slots until ended. Volume/intensity zero remains host-owned silence.

**31/31** audio contract tests include post-steal volume changes and live panner adjustment; **30/30** real Chrome checks include accessible keyboard controls, persistence without activation, non-opt-in absence, mobile viewport fit and actual OfflineAudioContext renders. This mobile test is emulation, not a physical phone test. Seven digital fixtures cover samples, tones, default/maximum gain, 16 simultaneous sources and exact zero cases. Tested maximum 16-voice PCM peak: **0.5798557996749878**, default peak **0.14496394991874695**; maximum adjacent sample step **0.002526636701077223**. No clipping in these fixtures is not a universal true-peak or acoustic safety guarantee.

WHO/ITU guidance informed adjustable volume, management of sudden/repeated sounds and required listening review. Device volume, headphone sensitivity and fit are unknown to the website. Actual sample/fallback content, harsh ringing, repeated actions, simultaneous gameplay mix, headphone/speaker comparison, owner listening and physical phone/Safari remain admission gates. No hearing-safety certification or physical/listening PASS is claimed. See the [runtime contract](../implementation/WEBSITE_SHARED_AUDIO_RUNTIME_V1.md#headphone-comfort-and-cue-admission) for primary references and production mix guidance.
