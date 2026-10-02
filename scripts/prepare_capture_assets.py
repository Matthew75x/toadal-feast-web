#!/usr/bin/env python3
"""Prepare deterministic WebP derivatives from approved owner QA captures."""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import sys
import zipfile
from pathlib import Path

try:
    from PIL import Image, __version__ as PILLOW_VERSION
    from PIL.features import version as pillow_feature_version
except ImportError as exc:  # pragma: no cover - environment-specific diagnostic
    raise SystemExit("Pillow is required: install Pillow with WebP support.") from exc


ARCHIVE_SHA256 = "fb614e1f5293b226d38b47265b88f3ae65d775158ab2c3d85f62ad739f427482"
ARCHIVE_ROOT = "TOADAL_FEAST_OWNER_VISUAL_QA_2026-09-27/"
DEFAULT_ARCHIVE = Path(
    r"C:\Users\Metarator\Downloads\TOADAL_FEAST_OWNER_VISUAL_QA_2026-09-27.zip"
)
REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = REPO_ROOT / "studio-project/toadal-feast-website/reference/assets/images/app/convergence-20261001"
DEFAULT_LEDGER = REPO_ROOT / "docs/review/visual-asset-gameplay-convergence-20261001/capture-assets.md"
DEFAULT_MANIFEST = REPO_ROOT / "docs/review/visual-asset-gameplay-convergence-20261001/capture-assets.json"

# Member names are relative to the archive's one top-level folder. Only approved
# raw capture entries are listed here; diagnostic-footer (*-f8) captures are excluded.
CAPTURES = (
    {
        "member": "visual/arcade-raw/004-active-gameplay-raw.png",
        "sha256": "98e4b64ddf857b7e127d0041157f1b1a5d7fbd62877198a3a9ae152e5165b17f",
        "output": "arcade-active-gameplay.webp",
        "label": "Arcade active gameplay capture",
        "note": "Raw approved gameplay capture; source is not an F8 diagnostic-footer image.",
    },
    {
        "member": "visual/standard-raw/002-menu-raw.png",
        "sha256": "9c87794c7756d4a869b0d0e9b2ff3e33a27dfb15cd4bcdca44d30489685d2ab7",
        "output": "menu-onboarding-overlay.webp",
        "label": "TOADAL FEAST mobile app mode menu capture",
        "note": "The source shows the mobile app mode menu; the owner-QA tools badge remains visible.",
    },
    {
        "member": "visual/standard-raw/006-feastfall-entry-raw.png",
        "sha256": "006397c6ec05d8d647ee1729c5d7f13d32bcc013ad1cb3ee1b6ad60e3db0254c",
        "output": "feastfall-entry-onboarding-overlay.webp",
        "label": "Feastfall entry capture with onboarding/UI overlay",
        "note": "The source includes onboarding/UI overlays; it shows an entry state, not an unoverlaid gameplay state.",
    },
    {
        "member": "visual/standard-raw/010-puzzle-entry-raw.png",
        "sha256": "4894ffd9561e29a956bdc0b797ae6a1003c1a8202f2d7763c6533030bde2cba2",
        "output": "puzzle-entry.webp",
        "label": "Puzzle entry capture",
        "note": "Approved raw entry capture; this is distinct from the separate puzzle result proof below.",
    },
    {
        "member": "visual/puzzle/p001-result.png",
        "sha256": "7cdad19d126e129efac72da18a6d6f3633d742e00caf8cb65be1bd35fd08f617",
        "output": "puzzle-result-proof.webp",
        "label": "Puzzle result proof capture",
        "note": "Actual puzzle result proof supplied by the owner; it is not a gameplay preview or entry-state image.",
    },
)


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def markdown_table(rows: list[dict[str, object]]) -> str:
    lines = [
        "| Output | Source member | Source SHA256 | Source dimensions | Output SHA256 | Output dimensions | Bytes |",
        "|---|---|---|---:|---|---:|---:|",
    ]
    for row in rows:
        lines.append(
            "| `{output}` | `{member}` | `{source_sha256}` | {source_dimensions} | "
            "`{output_sha256}` | {output_dimensions} | {bytes} |".format(**row)
        )
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", type=Path, default=DEFAULT_ARCHIVE)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--ledger", type=Path, default=DEFAULT_LEDGER)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--quality", type=int, default=86)
    args = parser.parse_args()
    if not 1 <= args.quality <= 100:
        raise SystemExit("WebP quality must be between 1 and 100.")

    archive_bytes = args.archive.read_bytes()
    actual_archive_sha = sha256(archive_bytes)
    if actual_archive_sha != ARCHIVE_SHA256:
        raise SystemExit(
            f"Archive SHA256 mismatch: expected {ARCHIVE_SHA256}, got {actual_archive_sha}"
        )

    # Verify every requested source member before decoding any image or writing outputs.
    with zipfile.ZipFile(io.BytesIO(archive_bytes)) as archive:
        verified: list[tuple[dict[str, str], bytes]] = []
        for capture in CAPTURES:
            archive_name = ARCHIVE_ROOT + capture["member"]
            try:
                source_bytes = archive.read(archive_name)
            except KeyError as exc:
                raise SystemExit(f"Required source member is missing: {archive_name}") from exc
            actual_member_sha = sha256(source_bytes)
            if actual_member_sha != capture["sha256"]:
                raise SystemExit(
                    f"Source SHA256 mismatch for {archive_name}: "
                    f"expected {capture['sha256']}, got {actual_member_sha}"
                )
            verified.append((capture, source_bytes))

    webp_version = pillow_feature_version("webp")
    if not webp_version:
        raise SystemExit("The installed Pillow build has no WebP encoder.")

    # All hashes are approved before the first decode/conversion or output write.
    args.output_dir.mkdir(parents=True, exist_ok=True)
    ledger_rows: list[dict[str, object]] = []
    for capture, source_bytes in verified:
        with Image.open(io.BytesIO(source_bytes)) as source:
            source.load()
            source_dimensions = source.size
            image = source.convert("RGBA" if "A" in source.getbands() else "RGB")
        output_buffer = io.BytesIO()
        image.save(output_buffer, format="WEBP", quality=args.quality, method=6, exact=True)
        output_bytes = output_buffer.getvalue()
        output_path = args.output_dir / capture["output"]
        output_path.write_bytes(output_bytes)
        with Image.open(io.BytesIO(output_bytes)) as derivative:
            output_dimensions = derivative.size
        ledger_rows.append(
            {
                **capture,
                "source_sha256": capture["sha256"],
                "source_dimensions": f"{source_dimensions[0]} × {source_dimensions[1]}",
                "output_sha256": sha256(output_bytes),
                "output_dimensions": f"{output_dimensions[0]} × {output_dimensions[1]}",
                "bytes": len(output_bytes),
                "asset": {
                    "id": {
                        "arcade-active-gameplay.webp": "asset.app.capture.arcade.active.gameplay",
                        "menu-onboarding-overlay.webp": "asset.app.capture.app.mode.menu",
                        "feastfall-entry-onboarding-overlay.webp": "asset.app.capture.feastfall.entry.onboarding.overlay",
                        "puzzle-entry.webp": "asset.app.capture.puzzle.entry",
                        "puzzle-result-proof.webp": "asset.app.capture.puzzle.result.proof",
                    }[capture["output"]],
                    "name": capture["label"],
                    "kind": "image",
                    "category": "app-capture",
                    "source": f"reference/assets/images/app/convergence-20261001/{capture['output']}",
                    "extension": "webp",
                    "bytes": len(output_bytes),
                    "sha256": sha256(output_bytes),
                    "referenceSha256": sha256(output_bytes),
                    "referenceSource": f"reference/assets/images/app/convergence-20261001/{capture['output']}",
                    "authoritySource": f"TOADAL_FEAST_OWNER_VISUAL_QA_2026-09-27.zip#{capture['member']}",
                    "authoritySha256": capture["sha256"],
                    "width": output_dimensions[0],
                    "height": output_dimensions[1],
                    "renderTargets": ["website-home", "website-app"] if capture["output"] == "arcade-active-gameplay.webp" else ["website-app"],
                    "replaceable": True,
                    "tags": ["mobile-app-capture", "owner-supplied-qa-capture", "not-browser-game"] + (["actual-app-gameplay", "first-run-control-hint"] if capture["output"] == "arcade-active-gameplay.webp" else ["mobile-app-ui-capture"]),
                },
            }
        )

    script_path = Path(__file__).resolve()
    archive_path = args.archive.resolve()
    command = f'python "{script_path}" --archive "{archive_path}" --output-dir "{args.output_dir.resolve()}" --quality {args.quality}'
    ledger = """# Capture asset preparation ledger

Generated by `scripts/prepare_capture_assets.py`. Source PNGs and the ZIP archive are not copied into this output directory.

- Source archive: `{archive_name}`
- Source archive SHA256: `{archive_sha256}`
- Archive member prefix: `{archive_root}`
- Encoding: WebP quality `{quality}` (Pillow `{pillow_version}`, libwebp `{webp_version}`, method 6, exact alpha handling)
- Reproducible command: `{command}`

{table}

## Truthful usage notes

{notes}

The script checks the complete archive SHA256 and the SHA256 of each exact member above before decoding or converting any capture. It reads only the listed raw/proof members, and does not select diagnostic-footer `*-f8` files. The output uses quality-controlled lossy WebP; the original PNG source remains represented by its archive/member hashes above. Byte-for-byte reproduction requires the same Pillow and libwebp encoder versions recorded above.
""".format(
        archive_name=archive_path.name,
        archive_sha256=actual_archive_sha,
        archive_root=ARCHIVE_ROOT,
        quality=args.quality,
        pillow_version=PILLOW_VERSION,
        webp_version=webp_version,
        command=command,
        table=markdown_table(ledger_rows),
        notes="\n".join(f"- `{row['output']}`: {row['note']}" for row in ledger_rows),
    )
    ledger_path = args.ledger
    ledger_path.parent.mkdir(parents=True, exist_ok=True)
    with ledger_path.open("w", encoding="utf-8", newline="\n") as ledger_file:
        ledger_file.write(ledger)
    manifest = {
        "schema": "toadal-feast.owner-qa-capture-assets.v1",
        "sourceArchive": archive_path.name,
        "sourceArchiveSha256": actual_archive_sha,
        "encoder": {"pillow": PILLOW_VERSION, "libwebp": webp_version, "format": "webp", "quality": args.quality, "method": 6},
        "assets": [row["asset"] for row in ledger_rows],
    }
    args.manifest.parent.mkdir(parents=True, exist_ok=True)
    with args.manifest.open("w", encoding="utf-8", newline="\n") as manifest_file:
        manifest_file.write(json.dumps(manifest, indent=2) + "\n")
    print(f"Prepared {len(ledger_rows)} verified WebP derivatives in {args.output_dir}")
    print(f"Ledger: {ledger_path}")
    print(f"Machine-readable asset manifest: {args.manifest}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
