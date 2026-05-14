"""
Run once: python download_samples.py
Downloads 3 real aerial/satellite images from OpenAerialMap (public domain)
and saves them to the samples/ directory for the demo gallery.
"""

import os
import sys
import json
import urllib.request
from pathlib import Path

SAMPLES_DIR = Path("samples")
SAMPLES_DIR.mkdir(exist_ok=True)

# OpenAerialMap metadata API – completely free, images are CC-by-SA / public domain
# Each entry: name, OAM search bbox, approximate centre for display
QUERIES = [
    {
        "file": "urban_dense.jpg",
        "label": "Dense Urban — Mumbai Region",
        "desc": "High-density residential blocks, roads, and vegetation patches",
        "lat": 19.0760, "lon": 72.8777, "gsd": 0.30,
        "bbox": "72.82,19.05,72.89,19.11",
    },
    {
        "file": "railway_yard.jpg",
        "label": "Railway Infrastructure — Delhi",
        "desc": "Track network, marshalling yard, OHE structures, access roads",
        "lat": 28.6448, "lon": 77.1858, "gsd": 0.25,
        "bbox": "77.18,28.63,77.22,28.66",
    },
    {
        "file": "mixed_landuse.jpg",
        "label": "Mixed Land-use — Bengaluru",
        "desc": "Buildings, water bodies, parks and urban green cover",
        "lat": 12.9716, "lon": 77.5946, "gsd": 0.35,
        "bbox": "77.57,12.95,77.63,13.00",
    },
]

OAM_API = "https://api.openaerialmap.org/meta"
HEADERS  = {"User-Agent": "SpatialAssetSystem/1.0"}


def fetch_oam(bbox: str):
    url = f"{OAM_API}?bbox={bbox}&limit=5&has_tiled=true"
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read())
    items = data.get("results", {}).get("items", [])
    return items


def download_image(img_url: str, dest: Path):
    req = urllib.request.Request(img_url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as resp:
        dest.write_bytes(resp.read())


def main():
    manifest = []
    for q in QUERIES:
        dest = SAMPLES_DIR / q["file"]
        if dest.exists():
            print(f"  ✓ {q['file']} already exists, skipping")
            manifest.append({k: v for k, v in q.items() if k != "bbox"})
            continue

        print(f"  → Searching OAM for '{q['label']}'…")
        try:
            items = fetch_oam(q["bbox"])
            if not items:
                print(f"    ✗ No OAM results, using fallback")
                raise ValueError("no items")

            # Prefer thumbnail (small) or first downloadable image
            img_url = items[0].get("thumbnail") or items[0].get("uuid")
            if not img_url:
                raise ValueError("no url")

            print(f"    ↓ Downloading {img_url[:70]}…")
            download_image(img_url, dest)
            print(f"    ✓ Saved → {dest} ({dest.stat().st_size // 1024} KB)")
        except Exception as exc:
            print(f"    ✗ OAM download failed ({exc}), generating synthetic sample…")
            _generate_synthetic(dest, q["label"])

        manifest.append({k: v for k, v in q.items() if k != "bbox"})

    (SAMPLES_DIR / "manifest.json").write_text(json.dumps(manifest, indent=2))
    print(f"\n  Manifest written → samples/manifest.json")
    print(f"  Done. Start the backend and open the app to see sample images.\n")


def _generate_synthetic(dest: Path, label: str):
    """Create a convincing synthetic satellite-style image using PIL."""
    try:
        from PIL import Image, ImageDraw, ImageFilter
        import random, math

        rng = random.Random(hash(label) & 0xFFFFFF)
        W, H = 800, 600
        img = Image.new("RGB", (W, H), (62, 54, 46))
        draw = ImageDraw.Draw(img)

        # Roads
        for _ in range(4):
            x1, y1 = rng.randint(0, W), rng.randint(0, H)
            x2, y2 = rng.randint(0, W), rng.randint(0, H)
            draw.line([(x1, y1), (x2, y2)], fill=(90, 85, 80), width=rng.randint(5, 14))

        # Buildings
        for _ in range(40):
            x, y = rng.randint(10, W - 80), rng.randint(10, H - 60)
            w, h = rng.randint(20, 70), rng.randint(15, 50)
            shade = rng.randint(100, 200)
            draw.rectangle([x, y, x + w, y + h], fill=(shade, shade - 10, shade - 20))

        # Vegetation
        for _ in range(12):
            cx, cy = rng.randint(0, W), rng.randint(0, H)
            rx, ry = rng.randint(20, 80), rng.randint(20, 60)
            r = (rng.randint(20, 60), rng.randint(80, 160), rng.randint(20, 60))
            draw.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=r)

        # Water
        for _ in range(2):
            cx, cy = rng.randint(50, W - 50), rng.randint(50, H - 50)
            rx, ry = rng.randint(40, 120), rng.randint(25, 60)
            b = rng.randint(100, 160)
            draw.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=(20, 60, b))

        img = img.filter(ImageFilter.GaussianBlur(0.6))
        img.save(dest, "JPEG", quality=88)
        print(f"    ✓ Synthetic image saved → {dest}")
    except ImportError:
        print("    ✗ PIL not available, sample will be skipped in gallery")


if __name__ == "__main__":
    print("\n  Spatial Asset System — Sample Image Downloader")
    print("  ─────────────────────────────────────────────\n")
    main()
