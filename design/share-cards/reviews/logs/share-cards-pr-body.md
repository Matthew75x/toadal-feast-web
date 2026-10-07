## Review candidate

Builds a standalone sharing-card service outside the sealed GitHub Pages artifact.

- Feast and Astro invitations / personal-score PNGs using the newer Astro v2 frame, TOADAL Lettering v2.0.0 art and selected website mascot.
- Responsive composer with prepare-before-share, copy/download fallback and removal controls.
- Initial crawler-readable OG/X metadata, immutable snapshots, independent private removal authority, expiry and direct-image revocation.
- Persistent local and R2 storage, atomic anonymous burst/daily limits, bounded cleanup and a typed Worker entry.
- Native HUD Maker schema-validated design seeds and asset/font provenance.
- Review-only CI; no deployment job.

## Scope / authority

Base: staging/live-visual @ f53176f0c90e6e23c179d7c541e16de69b4e34d5.
New package: services/share-cards.
Documentation: docs/implementation/SHARE_CARDS_AND_INVITES.md.

Existing Studio source, dist, game/cartridge bytes, progression, catalogue and Pages workflow are untouched. The real website host/game hookup remains a separately scoped native Studio/export change; Lily's active onboarding paths remain outside this candidate.

## Validation

- 54 service/storage/security tests pass.
- 52 existing protected-game/staging/score-adapter boundary tests pass on exact committed protected bytes.
- 12 desktop/390px Chromium check groups pass; four cards created and revoked.
- Actual local Workerd + simulated R2: PNG/metadata, idempotent retry and direct-image retirement pass.
- Worker source/binding type check, dry-run build and seven asset hashes pass.
- npm audit: zero known vulnerabilities in the locked graph.

Receipts in services/share-cards/review. Native/clipboard browser checks are explicit stubs, not OS delivery proof. Imported JS is tested but not fully converted to strict TypeScript.

## Launch gates

Draft source review only. No cloud resources, DNS, spend, analytics or production deployment.
Worker public origin is an invalid placeholder; creation, public names, workers.dev and preview URLs are disabled.
Approve concrete hosting/domain/budget/access/retention details, qualify cloud resource use and actual Facebook/iPhone/Android Messages previews, then connect through the accepted native Studio/export path.
Public scores remain player-submitted, with no verified rank/reward/install claim.

