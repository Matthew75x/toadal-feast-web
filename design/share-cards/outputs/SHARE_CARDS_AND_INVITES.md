# Share cards and invitations — implementation and launch record

Status: **local implementation and review candidate**. No public deployment.
Date: 2026-10-06. Analytics disabled.

## Authority and scope

| Item | Authority / effect |
| --- | --- |
| Website base | Matthew75x/toadal-feast-web, staging/live-visual, f53176f0c90e6e23c179d7c541e16de69b4e34d5 |
| New module | services/share-cards/; separately deployed service and composer |
| Documentation | This file |
| CI | New share-cards-review.yml runs package checks on relevant PRs; no deployment or cloud credentials |
| Page / manifest requirement | Personalized public previews need a service outside the sealed static Pages artifact. No existing page/manifest export is changed here. |
| Owner-visible result | Feast/Astro invitation and personal-score PNGs, local composer and stable local URLs |
| Acceptance | API/storage/security regressions, desktop/mobile Chromium qualification, actual local Worker+R2 lifecycle, asset hashes, Worker type/build checks and existing website boundary checks |
| dist impact | None |
| Deployment impact | None from this branch or draft PR. Existing Pages workflow unchanged. Worker creation disabled; workers.dev/preview URLs disabled. |
| Closure | Merge or supersede the source after review; archive/delete the temporary work branch when superseded. Do not turn this branch into a permanent deployment lane. |

The live Lily onboarding claim remains active in
[program issue 321](https://github.com/Matthew75x/Toadal-Feast-Development/issues/321#issuecomment-6024156625).
Its game/detail, Play/Feast Pass metadata and dependent export paths are outside
this change. CONTRIBUTING.md says normal website page edits belong in native
Studio source, and test/PR success does not authorize deployment.

## Existing systems considered and used

| Resource | Concrete role | Boundary |
| --- | --- | --- |
| Web Studio | Accepted native source ffebf68559c0866e8e68b3de1470fa89ee654013; future website composer surface and controlled export | No manual dist edits; no exporter change in this candidate |
| Native HUD Maker | Two 1200×630 authoring seeds with real art layers, editable text and share.score binding; schema validated against accepted hud-authoring package | Designer import/export visuals remain unqualified; native rounded text differs from Lilita output. Seeds are design inputs, not automatically synchronized production templates. |
| files (19).zip | **New** arcade-astro/v2 score frame, used by Astro score card | This is distinct from GitHub's older root arcade-astro assets; gameplay HUD patch is not applied or claimed device-qualified |
| files (20).zip | TOADAL Lettering v2.0.0 glossy header, pre-rendered from audited standalone engine; embedded Lilita One font decoded for fixed renderer | Build-time lettering only. Not a custom glyph set or a browser engine assumed to run inside Workers. Font license/notice retained. |
| Website selected mascot | Exact pinned toadal-victory source plus deterministic size derivative | No Lily art or game screenshot swap |
| Current game progress model | Personal source claims and explicit missing/zero distinction inform adapter contract | No XP, Sparks, rewards, global rank or canonical ledger writes |
| toadal-analytica | Future measurement contract only | NOT_CORE_READY; no public collector or consent policy authority. No telemetry enabled. |

The native HUD library was read from the accepted GitHub source rather than the
older Crownfall reference HTML. Both attached packages are complementary.
Asset archive/member/engine/art hashes are in assets/provenance.json; full font
license and notices accompany the package. Attached document directions were
treated as evidence rather than new task authorization.

## How a card works

1. The player selects an invitation or personal score and a fixed theme.
2. Preview renders a PNG without saving a public card.
3. Prepare creates an immutable normalized snapshot and PNG, then returns the
   public URL plus a separate private removal credential.
4. A separate final tap invokes Web Share synchronously with that ready URL.
   Share completion is an OS/target handoff, not a delivery or read receipt.
5. Clipboard fallback and PNG download remain available.
6. The recipient opens initial HTML containing metadata and a fixed approved
   play destination. No JavaScript/login is needed to read that page/image.
7. Removal or expiry blocks HTML and the direct PNG endpoint. Scheduled
   maintenance strips stored card content and deletes image bytes.

GET/HEAD never render, consume an invite, accept friendship, grant a reward,
launch a game automatically, record a conversion or extend retention.
Each card has its own canonical and og:url. Images have a template-versioned
path and never change while that snapshot is active.

These are ordinary rich-link previews:
[Open Graph](https://ogp.me/) and
[Web Share](https://www.w3.org/TR/web-share/).
Receiving apps choose layout, crop, whether an image appears, and caching.
A local URL cannot be used to qualify Facebook/iPhone/Android Messages.

## API and trust

| Route | Purpose |
| --- | --- |
| GET /api/config | Fixed games/themes and creation/alias/analytics capabilities |
| POST /api/preview | Bounded fixed-template PNG, no persistent share record |
| POST /api/shares | Persist ready snapshot/PNG; private 64-hex Idempotency-Key |
| DELETE /api/shares/:id | Bearer removal token; approved browser origin |
| GET/HEAD /s/:id | Initial crawler-readable HTML |
| GET/HEAD /s/:id/card-v1.png | PNG, gated by active lifecycle |
| GET /health | Basic availability |

Inputs are schemaVersion, kind, theme, gameId, optional bounded score/timestamp,
and configuration-gated alias/aliasPublic. Unknown keys, client URLs, HTML,
code, source claims, verified flags, remote assets, arbitrary template uploads,
unsupported games and unsafe scores are rejected. Payload cap: 4096 bytes.
Score cap: 999,999,999. A real zero is accepted; an absent score is never zero.

Anonymous submissions are **personal, player-submitted**. The snapshot does not
invent a completed-game timestamp, browser save, accepted game source or
verification. Its source is personal-submission, confidence none, persistence
none; public snapshot storage is a separate concern. Mode is unspecified and
rulesetVersion null where the source supplies no authority.

Idempotency uses a cryptographically random private client creation key.
Public ID and removal token are different one-way derivations. Only the removal
token hash is stored. Treat the creation key as private bearer authority too.
Identical durable retries return the same card; changed payloads conflict.
Known failed preparation requires a new key, while ambiguous transport/pending
retries retain their key. Quota rejection before reservation can retry later.

The composer keeps removal credentials only in the tab and retains controls for
earlier prepared cards. Closing the tab loses removal access; expiry still
applies. A future account/guest recovery feature would be separately scoped.
No credential is placed in the public link, query string, HTML, image or report.

## Data and retention

Default proposal: seven days of public availability. Anonymous by default;
public names and analytics are disabled in the Worker configuration.

- Preview pixels are transient; preview still submits selected card data to the
  service to render.
- Ready card content includes the selected game/theme and optional submitted
  score/timestamp. Alias use requires both configuration and explicit public
  selection.
- Expiry is checked on every public HTML/image request.
- Removal creates a durable retirement marker first, strips the card from its
  record, and deletes its PNG. A late render cannot restore public access.
- Maintenance processes at most 100 records and 100 quota entries per run,
  storing a continuation only after that page completes. Public expiry is
  immediate even if physical cleanup is delayed. At the proposed low limits,
  hourly sweeps are sufficient; monitor cleanup before raising limits.
- Expired records lose content when swept; management/idempotency hashes can
  remain until two days beyond expiry to support safe retries. Image bytes are
  deleted. Minimal permanent markers contain only an opaque retired ID and
  retired:true, preventing old keys from republishing old URLs. They do not
  retain names, scores, tokens, IPs, recipients or device attributes.
- Public responses use no-store to avoid application-controlled stale copies.
  Versioned URLs preserve stable content without long cache TTLs.
- Social previews, recipient screenshots and downloaded/forwarded images can
  persist outside this service after removal.

No contact list, recipient identity, fingerprint, IP/UA join, cookie or
persistent analytics identifier is collected by application code. Infrastructure
providers may retain operational data under their own account configuration;
analytics off does not mean a hosting provider processes no request information.
Public sharing does not grant permission for unrelated tracking.

## Host/game integration handoff

The reusable share-client.mjs exposes createShareClient and
attachAcceptedSnapshotAdapter. A host supplies a callback for accepted completed
Wicked Bites results; raw iframe postMessage events are not accepted by this seam.

The existing ToadaWebsiteScoreAdapter validates sender window, schema, active
session and **opaque origin 'null'** plus the expected sandboxed game path.
Preserve those rules. Do not broaden iframe sandbox, bridge origins or cartridge
payload permissions. The current game adapter is personal evidence, not anti-cheat
verification. No new verified trust is granted by this service.

To connect the real website:

1. Refresh live source/writer ownership and coordinate the page/runtime/export
   scope after Lily's current claim closes or the owner assigns nonoverlapping
   paths.
2. Author the composer entry in native Studio. Pin its public runtime assets
   through existing resource/manifest rules and regenerate via the pinned
   exporter. The separate service origin must be an approved CSP connection.
3. Expose only an accepted completed host snapshot. Do not read arbitrary game
   storage, fabricate no-data metrics or accept a cartridge URL as a game ID.
4. Wire Share on a fresh top-level player gesture and preserve missing/zero,
   unavailable/held game and progress state distinctions.
5. Prove actual completion → composer → prepared public card on the final
   exported candidate before release.

Progression cards, leaderboards, authenticated verified scores, referral rewards,
rooms, automatic app deep links and native installs are deferred. They can reuse
the lifecycle/template pipeline after their own source/access policy is accepted.
This implementation does not create those authorities.

## Deployment candidate and explicit launch decisions

The [static Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
cannot execute this dynamic API. Proposed runtime: one separate Cloudflare
Worker plus one dedicated R2 bucket. No KV/D1/account service/browser-rendering
subscription is required. Wasm resvg renders the fixed SVG with embedded local
assets/font; rendering has no external fetch path.

The current Worker name/bucket are review names. PUBLIC_ORIGIN uses an invalid
placeholder. Routes, workers.dev and preview URLs are disabled; creation and
aliases are false. No cloud bucket, Worker, DNS route, billable subscription or
analytics pipeline was created by this PR.

Before public activation, approve a concrete deployment record containing:

- Hosting account, dedicated bucket/Worker names and public hostname (for
  example share.toadalfeast.com if that is the owner's chosen domain).
- Approved play base URL and the first eligible game. Current local destination
  is the existing GitHub Pages preview, not an invented app-store page.
- Paid runtime/budget and alert thresholds. Rendering needs qualification beyond
  the [Free 10ms CPU limit](https://developers.cloudflare.com/workers/platform/limits/).
  The candidate sets 1000ms CPU per invocation; choose Workers Paid, currently
  [starting at $5/month plus usage](https://developers.cloudflare.com/workers/platform/pricing/),
  subject to the existing account plan. This is not a guaranteed total bill.
- Seven-day content availability, permanent minimal retirement markers, and
  aliases remaining off. Decide intended audience/markets before adding public
  identity or analytics, particularly if children use the games.
- Who may create cards at launch and abuse controls. The origin allowlist
  constrains browser callers, but a scripted caller can spoof it. Shared atomic
  five/minute, 100/day create and 300/day render caps bound expensive work and
  contain no user identifier; an attacker could exhaust that pool. Public GET
  traffic is not a hard monetary cap. Add account-level alerts/WAF/access policy
  appropriate to the pilot before opening creation widely.
- The exact public qualification candidate, final art/copy, and rollout/rollback
  choice. Turn CREATION_ENABLED off to stop new links while existing safe reads
  and removal remain; preserve the bucket/cleanup so expiry continues.
- Any future analytics separately. No consent or analytics activation is inferred
  from the action of sharing.

With approval, first deploy nonpersonal samples to a public test endpoint.
Keep website staging robots/noindex protections intact. Test Facebook, actual
iPhone Messages, Android Messages and desktop copy-link against exact HTTPS
metadata/image URLs. Check crop, caching, image MIME/dimensions, failed storage,
expired/revoked links and direct image reads. Owner-approved rollout follows
those channel witnesses and final website integration qualification.

## Local Worker verification

From services/share-cards:

    npx wrangler dev --local --ip 127.0.0.1 --port 8788 \
      --var PUBLIC_ORIGIN:http://127.0.0.1:8788 \
      --var ALLOWED_ORIGINS:http://127.0.0.1:8788 \
      --var CREATION_ENABLED:true

Then, in another shell:

    npm run test:worker

This uses simulated R2, not remote cloud storage. The smoke check proves
actual Workerd Wasm rendering, conditional writes, PNG dimensions, initial
metadata, idempotent retry and direct-image revocation.
For local scheduled cleanup, use Wrangler's documented local scheduled endpoint.
No diagnostic bypass remains in the Worker.

## Validation receipt and practical limits

See services/share-cards/review/ for secret-free receipts.

- API, lifecycle, storage, burst and quota tests run with Node's test runner.
- Persistent FileStore tests include real restart, binary isolation, concurrent
  one-winner creation, Windows-safe atomic replacement and traversal refusal.
- R2 tests mock its documented conditional/pagination API; the local Worker
  smoke separately exercises the actual storage emulator.
- Desktop and 390px Chromium composer qualification covers 12 check groups.
  Native/clipboard use explicit stubs; trusted click activation was true.
- Both themes and scores zero/999,999,999 render. Visual examples were inspected.
- Worker source/env type-checks and a deploy dry run pass. The imported JS is not
  converted to strict TypeScript in this candidate.
- Exact asset hashes/license notices are checked. npm audit reports no known
  vulnerabilities for the locked dependency graph. A patched sharp override
  addresses the Wrangler/Miniflare development dependency advisory.
- Existing protected-game, staging-artifact and score-adapter boundary tests are
  run without changing their source/policy. Windows checkout CRLF conversion
  required restoration of exact committed protected-file bytes for the pin test.

Unverified: cloud latency/CPU/memory, live DNS, real social/OS share previews,
native Designer visual round trip, Safari/iOS/Firefox composer behavior,
real website/game completion integration, operational alerts and rollout.
These remain explicit launch gates, not evidence of failures in channels never
tested.
