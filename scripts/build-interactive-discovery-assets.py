#!/usr/bin/env python3
"""Build only approved, optimized V1 website derivatives from the owner ZIP."""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import zipfile
from pathlib import Path
from PIL import Image, ImageDraw, ImageOps

ARCHIVE_SHA256 = "605e16399d21210228a9c784fb413c6d886e75b0bf0fa277b25ef0a2dbcf4ecb"
BASELINE = "fbcc41a7e5ac36ca8362f503557968090119e5f1"
OUTPUTS = {
    "gully": "characters/gully.webp",
    "candyShooter": "characters/candy-shooter-fruity-bash.webp",
    "portal": "interactive/portal-discovery.webp",
    "candyBlue": "interactive/candy-blue.webp",
    "candyGreen": "interactive/candy-green.webp",
    "candyPurple": "interactive/candy-purple.webp",
    "dailyChest": "interactive/daily-chest-sprite.webp",
    "dailyBurst": "interactive/daily-fruit-burst-sprite.webp",
    "goldenBlock": "interactive/golden-block-sprite.webp",
    "toadalPush": "puzzle/toadal-push-golden-block.webp",
    "toadalMagic": "puzzle/toadal-magic-golden-block.webp",
}


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def image_bytes(image: Image.Image, quality: int = 88) -> bytes:
    from io import BytesIO
    output = BytesIO()
    image.save(output, format="WEBP", quality=quality, method=6, exact=True)
    return output.getvalue()


def remove_connected_matte(image: Image.Image, matte: str) -> Image.Image:
    """Remove edge-connected near-black/near-white matte, retaining enclosed ink."""
    rgba = image.convert("RGBA")
    rgb = rgba.convert("RGB")
    w, h = rgb.size
    pixels = list(rgb.getdata())
    if matte == "black":
        candidates = [255 if max(p) <= 28 else 0 for p in pixels]
    else:
        candidates = [255 if min(p) >= 235 and max(p) - min(p) <= 20 else 0 for p in pixels]
    mask = Image.new("L", (w, h))
    mask.putdata(candidates)
    draw = ImageDraw.Draw(mask)
    for x in range(w):
        if mask.getpixel((x, 0)) == 255:
            ImageDraw.floodfill(mask, (x, 0), 128)
        if mask.getpixel((x, h - 1)) == 255:
            ImageDraw.floodfill(mask, (x, h - 1), 128)
    for y in range(h):
        if mask.getpixel((0, y)) == 255:
            ImageDraw.floodfill(mask, (0, y), 128)
        if mask.getpixel((w - 1, y)) == 255:
            ImageDraw.floodfill(mask, (w - 1, y), 128)
    alpha = [0 if edge == 128 else old_alpha for edge, old_alpha in zip(mask.getdata(), rgba.getchannel("A").getdata())]
    alpha_image = Image.new("L", (w, h), 0)
    alpha_image.putdata(alpha)
    rgba.putalpha(alpha_image)
    return rgba


def contain_square(image: Image.Image, size: int, inset: float = 0.90) -> Image.Image:
    image = image.convert("RGBA")
    bounds = image.getchannel("A").getbbox()
    if bounds:
        image = image.crop(bounds)
    target = max(1, round(size * inset))
    image.thumbnail((target, target), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.alpha_composite(image, ((size - image.width) // 2, (size - image.height) // 2))
    return canvas


def sprite_strip(frames: list[Image.Image], cell: int) -> Image.Image:
    canvas = Image.new("RGBA", (cell, cell * len(frames)), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        canvas.alpha_composite(contain_square(frame, cell, 0.88), (0, index * cell))
    return canvas


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", type=Path, required=True)
    parser.add_argument("--site", type=Path, default=Path("studio-project/toadal-feast-website"))
    parser.add_argument("--ledger", type=Path, default=Path("docs/review/interactive-discovery-v1-20261001/asset-ledger.json"))
    args = parser.parse_args()
    archive = args.archive.resolve()
    site = args.site.resolve()
    ledger = args.ledger.resolve()
    if sha256(archive.read_bytes()) != ARCHIVE_SHA256:
        raise SystemExit("Owner archive SHA-256 mismatch; refusing to build.")

    with zipfile.ZipFile(archive) as zipped:
        manifest_name = next((name for name in zipped.namelist() if name.endswith("/ASSET_AUTHORITY.json")), None)
        if not manifest_name:
            raise SystemExit("ASSET_AUTHORITY.json is missing from the archive.")
        manifest = json.loads(zipped.read(manifest_name))
        if manifest.get("schema") != "toadal.website.interactive-asset-authority.v1":
            raise SystemExit("Unexpected owner asset-authority schema.")
        root_prefix = manifest_name.rsplit("/", 1)[0] + "/"
        members = {name[len(root_prefix):]: name for name in zipped.namelist() if name.startswith(root_prefix)}
        authorities = {item["path"]: item for item in manifest.get("assets", [])}
        verified = []
        for relative, authority in authorities.items():
            member = members.get(relative)
            if member is None:
                raise SystemExit(f"Manifest asset missing from ZIP: {relative}")
            actual = zipped.read(member)
            if len(actual) != authority["bytes"] or sha256(actual) != authority["sha256"]:
                raise SystemExit(f"Manifest byte/hash mismatch: {relative}")
            verified.append(relative)

        def read_source(relative: str) -> tuple[bytes, dict]:
            member = members.get(relative)
            authority = authorities.get(relative)
            if member is None or authority is None:
                raise SystemExit(f"Required owner source is not in the manifest: {relative}")
            return zipped.read(member), authority

        def image(relative: str, matte: str | None = None) -> tuple[Image.Image, dict]:
            raw, source_authority = read_source(relative)
            with Image.open(__import__("io").BytesIO(raw)) as opened:
                result = opened.convert("RGBA")
            if matte:
                result = remove_connected_matte(result, matte)
            return result, source_authority

        def collect_frames(prefix: str, suffix_pattern: str) -> list[tuple[int, str]]:
            matches = []
            for relative in authorities:
                if relative.startswith(prefix):
                    match = re.search(suffix_pattern, relative)
                    if match:
                        matches.append((int(match.group(1)), relative))
            return sorted(matches)

        products: dict[str, tuple[Image.Image, list[dict], str]] = {}
        source, auth = image("characters/gully/gully-happy-canonical.png")
        products["gully"] = (contain_square(source, 320), [auth], "canonical transparent identity, resized to 320px")

        source, auth = image("characters/candy-shooter/candy-shooter-primary-source.png", "black")
        products["candyShooter"] = (contain_square(source, 512), [auth], "edge-connected black matte removed; concept-art crop")

        source, auth = image("interactive/portal/portal-static-source.png")
        products["portal"] = (contain_square(source, 512), [auth], "approved transparent static portal; motion is CSS-only")

        for name, relative in [
            ("candyBlue", "collectibles/gem-candy-blue-source.png"),
            ("candyGreen", "collectibles/gem-candy-green-source.png"),
            ("candyPurple", "collectibles/gem-candy-purple-source.png"),
        ]:
            source, auth = image(relative, "black")
            products[name] = (contain_square(source, 256), [auth], "edge-connected black matte removed")

        chest = collect_frames("interactive/daily-chest/source/", r"-(\d{3})\.png$")
        burst = collect_frames("interactive/daily-chest/fruit-burst-source/", r"fruit-burst-(\d{2})\.png$")
        if [n for n, _ in chest] != [1, 2, 4, 5, 6, 7, 8] or [n for n, _ in burst] != list(range(1, 9)):
            raise SystemExit(f"Unexpected approved chest/burst frame sequence: {[n for n,_ in chest]} / {[n for n,_ in burst]}")
        chest_by_number = dict(chest)
        # Keep the visually closed 005 frame before the first visibly open 004 frame.
        chest = [(number, chest_by_number[number]) for number in [1, 2, 5, 4, 6, 7, 8]]
        chest_images, chest_sources = [], []
        for _, relative in chest:
            frame, auth = image(relative, "white")
            chest_images.append(frame)
            chest_sources.append(auth)
        products["dailyChest"] = (sprite_strip(chest_images, 256), chest_sources, "7 approved frames; closed-to-open visual order; white matte removed; fixed 256px cells")

        burst_images, burst_sources = [], []
        for _, relative in burst:
            frame, auth = image(relative, "white")
            burst_images.append(frame)
            burst_sources.append(auth)
        products["dailyBurst"] = (sprite_strip(burst_images, 256), burst_sources, "8 approved frames; white matte removed; fixed 256px cells")

        block_source, block_auth = image("puzzle/golden-block/golden-block-destruction-source-sheet.png", "black")
        frames = []
        width, height = block_source.size
        for index in range(25):
            left = index % 5 * width // 5
            top = index // 5 * height // 5
            right = (index % 5 + 1) * width // 5
            bottom = (index // 5 + 1) * height // 5
            frames.append(block_source.crop((left, top, right, bottom)))
        products["goldenBlock"] = (sprite_strip(frames, 256), [block_auth], "25 ordered 5x5 cells; near-black edge matte removed; 256px vertical sprite strip")

        for name, relative in [
            ("toadalPush", "puzzle/golden-block/toadal-push-golden-block.png"),
            ("toadalMagic", "puzzle/golden-block/toadal-magic-golden-block.png"),
        ]:
            source, auth = image(relative)
            products[name] = (contain_square(source, 384), [auth], "approved transparent ability art, optimized to 384px")

        asset_index_path = site / "assets" / "index.json"
        index = json.loads(asset_index_path.read_text(encoding="utf-8"))
        current = {item["source"]: item for item in index.get("assets", [])}
        prior_outputs = {}
        if ledger.exists():
            try:
                prior_outputs = {item["path"]: item for item in json.loads(ledger.read_text(encoding="utf-8")).get("outputs", [])}
            except (json.JSONDecodeError, KeyError, TypeError):
                prior_outputs = {}
        generated = []
        baseline_bytes = 0
        final_bytes = 0
        output_root = site / "reference" / "assets" / "images"
        for name, (rendered, sources, processing) in products.items():
            relative_output = OUTPUTS[name]
            path = output_root / Path(relative_output)
            prior = prior_outputs.get("reference/assets/images/" + relative_output)
            old = current.get("reference/assets/images/" + relative_output)
            if path.exists():
                actual_sha = sha256(path.read_bytes())
                allowed_existing = {prior.get("sha256"), prior.get("previousSha256")} if prior else {old.get("sha256") if old else None}
                if actual_sha not in allowed_existing:
                    raise SystemExit(f"Refusing to overwrite an unverified runtime file: {path}")
            old_bytes = prior.get("previousBytes", 0) if prior else (old.get("bytes", 0) if old else 0)
            old_sha = prior.get("previousSha256") if prior else (old.get("sha256") if old else None)
            payload = image_bytes(rendered, 88)
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(payload)
            baseline_bytes += old_bytes
            final_bytes += len(payload)
            generated.append({
                "key": name,
                "path": "reference/assets/images/" + relative_output,
                "bytes": len(payload),
                "sha256": sha256(payload),
                "width": rendered.width,
                "height": rendered.height,
                "previousBytes": old_bytes,
                "previousSha256": old_sha,
                "sourceAssets": [{"path": s["path"], "sha256": s["sha256"], "bytes": s["bytes"]} for s in sources],
                "processing": processing,
            })

    report = {
        "schema": "toadal.website.interactive-discovery.asset-ledger.v1",
        "baselineCommit": BASELINE,
        "archiveSha256": ARCHIVE_SHA256,
        "verifiedManifestAssetCount": len(verified),
        "outputs": generated,
        "baselineRuntimeBytesReplaced": baseline_bytes,
        "finalRuntimeBytesGenerated": final_bytes,
        "netRuntimeAssetDeltaBytes": final_bytes - baseline_bytes,
        "sourceArchiveShipped": False,
        "rawSourceSequencesShipped": False,
    }
    ledger.parent.mkdir(parents=True, exist_ok=True)
    ledger.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({key: report[key] for key in ["verifiedManifestAssetCount", "baselineRuntimeBytesReplaced", "finalRuntimeBytesGenerated", "netRuntimeAssetDeltaBytes"]}, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, KeyError, ValueError, zipfile.BadZipFile) as error:
        print(f"Asset build failed: {error}", file=sys.stderr)
        raise SystemExit(1)
