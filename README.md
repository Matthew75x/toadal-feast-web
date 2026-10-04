# TOADAL FEAST Web

Authoritative website-development repository for TOADAL FEAST.

## Start here

Current website-lane status:

**[docs/authority/CURRENT_STATE_20261003.md](docs/authority/CURRENT_STATE_20261003.md)**

Product/creative authority:

**[docs/authority/WEB_PRODUCT_AUTHORITY.md](docs/authority/WEB_PRODUCT_AUTHORITY.md)**

Executed cleanup record:

**[docs/authority/CLEANUP_RECEIPT_20261003.md](docs/authority/CLEANUP_RECEIPT_20261003.md)**

## Current operating model

- Active autonomous completion candidate: `work/autonomous-owner-completion-20261004` (qualified website payload commit `0132cb22cfbf821ec597d32a97f60d556ead7e97`).
- Preserved owner-authoring baseline: `work/owner-native-authoring-20261002`; historical authority pointer: `archive/owner-native-authority-20261003`.
- Deployment lane: `staging/live-visual`; `main` is not the deployment target.
- Production/DNS changes require separate explicit authorization.
- Studio project source lives under `studio-project/`.
- Public export lives under `dist/`; regenerate it from the project/source and do not hand-edit generated output.
- Large media should remain outside ordinary Git history unless deliberately managed.

## Authority boundaries

Website source is not native game source.

Website Studio packages are not TCS cartridges.

Historical Studio 1.4.2 logs are not the same authority as the separate current Studio V5.1 engineering checkpoint.

Passport / Feast Book future account systems and TCS security must not be simulated as live website authority before their own gates pass. Empty story/catalogue records, unavailable app-store destinations, and absent backend submissions must remain truthfully disclosed until approved content/services exist.

## Branch discipline

Completed work should not remain as indefinite open PRs or zombie branches.

Use:
- `work/` for active engineering
- `qa/` for bounded QA
- `docs/` for documentation
- `archive/` for preserved historical heads

See [CONTRIBUTING.md](CONTRIBUTING.md).
