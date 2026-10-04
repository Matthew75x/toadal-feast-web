# TOADAL FEAST Web

Authoritative source repository for the TOADAL FEAST website program.

## Current authority

The default `main` branch is a stable repository baseline, **not the active owner-authoring lane and not the deployment lane**.

Current owner-authoring source:

`work/owner-native-authoring-20261002`

Preserved current authority:

`archive/owner-native-authority-20261003`

Deployment lane:

`staging/live-visual`

For current status, read on the owner-authoring branch:

- `docs/authority/CURRENT_STATE_20261003.md`
- `docs/authority/WEB_PRODUCT_AUTHORITY.md`
- `docs/authority/CLEANUP_RECEIPT_20261003.md`

## Repository model

- Studio/project source belongs under `studio-project/`.
- Public static export belongs under `dist/`.
- Do not hand-edit generated `dist/` as the ordinary authoring workflow.
- Production/DNS changes require separate explicit approval.
- Website source is not the native TOADAL FEAST game source.
- Studio components/packages are not TCS cartridges.
- Passport / live Feast Book and TCS authority remain separate until their own gates pass.

## Branch discipline

Use short-lived `work/`, `fix/`, `qa/`, or `docs/` branches for active tasks, and `archive/` / `backup/` only for deliberate preservation.

Finished lanes should be merged, archived, or deleted rather than left as indefinite zombie branches.
