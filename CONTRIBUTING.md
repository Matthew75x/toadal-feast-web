# Contributing — TOADAL FEAST Web

## Before work

Name:
- authority/base;
- page/manifest requirement;
- intended owner-visible effect;
- acceptance gate;
- whether `dist/` changes;
- deployment impact;
- cleanup/archive plan.

## Branches

Preferred:
- `work/`
- `fix/`
- `qa/`
- `docs/`
- `archive/`
- `backup/`

Do not create another permanent branch for every investigation.

At lane end choose:
- MERGED
- SUPERSEDED
- ARCHIVED
- DELETED

## Studio and export

Normal owner editing belongs in Studio/project source, not hand-edited `dist/`.

Public export must:
- be deterministic;
- contain no editor metadata;
- preserve route/base-path requirements;
- use approved assets;
- pass validation/static-link checks.

## Deployment

Only `staging/live-visual` is the deployment lane.

No branch, PR, or successful test implies deployment approval.

## Cross-system boundaries

Do not:
- execute arbitrary cartridge code inside Studio;
- treat TCS as website component packaging;
- invent live Passport/Feast Book authority;
- make website work a hidden dependency of native 1.2.9 release.
