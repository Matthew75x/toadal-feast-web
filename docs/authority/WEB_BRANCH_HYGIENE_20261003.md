# Website Branch Hygiene — 2026-10-03

## Current protected branches

Keep:
- `main`
- `staging/live-visual`
- `work/owner-native-authoring-20261002`
- `archive/owner-native-authority-20261003`
- `docs/web-control-lean-20261003`

Do not delete active owner-authoring, staging, or archive authority branches merely to reduce branch count.

## Archived and closed planning

Archived:
- QR attribution scaffold → `archive/qr-routing-scaffold-3371afa-20261003`
- old Arcade sampler product profile → `archive/web-arcade-profile-c7a4632-20261003`

Original draft PRs were closed and original head branches deleted.

## Cleanup rule

A historical branch may be deleted when:
1. its head is fully reachable from a preserved active/archive authority; or
2. an explicit archive pointer exists; or
3. it is generated/duplicate-only and contains no unique approved work.

Do not delete:
- current owner-authoring source;
- staging authority;
- unique accepted assets;
- owner-review evidence;
- portable recovery bundles;
- provenance/manifests needed for deterministic export.

## Documentation rule

Use `docs/authority/CURRENT_STATE_20261003.md` for current lane status.

`TOADAL_STUDIO_LIVE_STATE_20261002.md` is a historical chronological log and should not be used as a one-page current-state authority.
