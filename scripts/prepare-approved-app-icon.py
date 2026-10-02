"""Optimize the hash-verified owner app icon, without cropping or changing art."""
import hashlib
import json
from pathlib import Path
from PIL import Image, __version__ as pillow_version

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(r"C:\Users\Metarator\Downloads\EASY BRANDING.png")
EXPECTED = "c7fb79e1d466f417e3c8f374450b81ecf8d183ad6bdabe3eabb62c642fb17b7e"
OUTPUT = ROOT / "studio-project/toadal-feast-website/reference/assets/images/app/approved-app-icon.webp"
raw = SOURCE.read_bytes()
if hashlib.sha256(raw).hexdigest() != EXPECTED:
    raise SystemExit("Owner icon hash differs from authoritative manifest; refusing import.")
with Image.open(SOURCE) as source:
    original = list(source.size)
    image = source.convert("RGBA")
    image.thumbnail((256, 256), Image.Resampling.LANCZOS)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    image.save(OUTPUT, "WEBP", lossless=True, method=6, exact=True)
    result = {
        "source": str(SOURCE), "sourceSha256": EXPECTED, "sourceDimensions": original,
        "output": str(OUTPUT.relative_to(ROOT)).replace("\\", "/"),
        "sha256": hashlib.sha256(OUTPUT.read_bytes()).hexdigest(),
        "dimensions": list(image.size), "bytes": OUTPUT.stat().st_size,
        "transformation": "RGBA, proportion-preserving 256px thumbnail, lossless WebP; no crop/art replacement",
        "pillow": pillow_version, "permittedUse": "App icon only; forbidden as website wordmark or companion"
    }
print(json.dumps(result, indent=2))
