# TOADAL Cartridge Hardener v1

Fail-closed browser-game intake, qualification, evidence, and packaging tooling for TOADAL FEAST.

Read the canonical standard first:

- ../../docs/implementation/BROWSER_GAME_CARTRIDGE_HARDENING_STANDARD_V1.md
- ../../docs/implementation/BROWSER_GAME_CARTRIDGE_CONTRACT.md

## Setup

```bash
python3 -m pip install -r requirements.txt
```

## Static hardening + project regression

```bash
python3 cartridge_hardener.py harden \
  --profile examples/croaker-king-defense-v2.profile.json \
  --source /path/to/game-source \
  --output /tmp/cartridge-out \
  --run-commands
```

## Virtual host harness

```bash
python3 host_harness.py \
  --cartridge /tmp/cartridge-out/public/games/croaker-king-defense \
  --profile examples/croaker-king-defense-v2.profile.json \
  --output /tmp/cartridge-out/HOST_HARNESS.json
```

The virtual harness uses a synthetic HTTPS origin and may be blocked by managed-browser policy. A blocked harness is **BLOCKED_ENVIRONMENT**, not PASS and not FAIL.

## Self-test

```bash
python3 -m unittest discover -s tests -v
python3 -m py_compile cartridge_hardener.py host_harness.py
```

A successful local hardening run is not PUBLIC release authorization. CHL-4 is the intended local automation ceiling; real website-player and physical-device acceptance are later gates.

The bundled schema is a portability copy of the canonical repository schema. The test suite checks equality when run inside this repository.

## Optional TCS intake manifest

A profile may include `tcsManifest`. The hardener writes it as root `tcs1.json` only after checking game ID, version, title, entrypoint and TCS bridge protocol consistency. It remains separate from website `cartridge.json` and does not grant TCS approval.
