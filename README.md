# TOADAL FEAST Web

Authoritative source repository for the new TOADAL FEAST website.

## Current purpose

This repository is the isolated website-development and GitHub Pages staging workspace.

- Production website remains untouched until explicit approval.
- TOADAL Studio project source belongs under `studio-project/`.
- The public GitHub Pages staging site is <https://matthew75x.github.io/toadal-feast-web/>.
- `staging/live-visual` is the only branch that can deploy the site; `main` and production are not deployment targets.
- Exported static website goes to `dist/` and must be committed on `staging/live-visual` after each Studio export.
- Before committing an export, validate/render with TOADAL Studio and apply/verify `/toadal-feast-web/` using `scripts/wo001-pages-basepath.mjs` and `scripts/verify-pages-basepath.mjs` (see `docs/STAGING_STATUS.md` for the exact routine). The Pages workflow uploads the committed `dist/`; it does not build the Studio project.
- Large comics/video/media will live outside normal Git history.

## Authority

Start with [the consolidated product authority](docs/authority/WEB_PRODUCT_AUTHORITY.md). It records the owner-approved requirements, precedence rules, source inventories, preserved branch history, and [current staging gaps](docs/authority/STAGING_AUTHORITY_GAP_REPORT.md). Older work-order status documents are retained as history; their phase labels do not override the accepted staging lineage.

Game/runtime assets come from the current TOADAL FEAST game repository.
Website visual authority comes from approved mockups/design decisions.
Do not substitute retired or generic assets for canonical TOADAL assets.
