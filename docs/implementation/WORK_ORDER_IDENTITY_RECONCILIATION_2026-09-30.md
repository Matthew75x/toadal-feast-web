# Website Work-Order Identity Reconciliation

Date: 2026-09-30

## Problem

Two different efforts are currently being referred to as **WO-003**:

1. the active Arcade isolation/package qualification lane, whose evidence uses WO-003 terminology; and
2. the original website roadmap file `docs/work-orders/WO-003-world-characters.md`, which reserves WO-003 for **World + Characters**.

This ambiguity is now an operational risk because future prompts, evidence folders, branches and closure reports can appear to refer to the same work order while describing different work.

## Authority rule

Do not rename or rewrite already-created Arcade evidence/commits merely to fix history.

Historical/current Arcade artifacts may continue to say **WO-003** where that identifier is already embedded.

For all NEW forward references after the current Arcade lane, use:

- **ARC-QUAL-01** — Arcade cartridge qualification / HOLD closure
- **ARC-INTEGRATE-01** — conditional Arcade website integration

The canonical numbered website roadmap remains:

- WO-000 — Environment baseline
- WO-001 — Global shell + Home
- WO-002 — Play + Game Detail + Player
- WO-003 — World + Characters
- WO-004 — Stories + Manga + Reader
- WO-005 — Feast Pass / Progression
- WO-006 — Editorial + App + Search + Utilities
- WO-007 — Responsive / Accessibility / Performance closure
- WO-008 — Website release-candidate closure

## Mapping of current Arcade evidence

Treat references such as:

- `docs/review/WO-003/...`
- branch/report language saying “WO-003 Arcade”
- current Arcade HOLD reports

as historical aliases for **ARC-QUAL-01**.

Do not interpret those references as authorization to start canonical roadmap WO-003 World + Characters.

## Execution rule

Until Arcade qualification/integration is disposed:

- canonical WO-003 World + Characters remains HOLD;
- ARC-QUAL-01 is the active Arcade technical lane;
- ARC-INTEGRATE-01 may execute only after ARC-QUAL-01 qualifies the final cartridge;
- no later numbered website work order should be started merely because an Arcade report says “WO-003 PASS.”

## Why this matters

A numeric collision can otherwise cause:

- the wrong branch to be selected;
- the wrong evidence directory to be treated as authority;
- World/Characters work to start prematurely;
- an Arcade PASS to be mistaken for roadmap WO-003 completion;
- later WO-004/WO-005 gating to advance incorrectly.

This mapping prevents that without invalidating completed work.
