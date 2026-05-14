"""
Run once: python download_samples.py
Downloads real satellite imagery from ESRI World Imagery (free, no auth)
and saves sample images to samples/ for the demo gallery.
"""

import io
import json
import math
import struct
import urllib.request
from pathlib import Path

SAMPLES_DIR = Path("samples")
SAMPLES_DIR.mkdir(exist_ok=True)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Referer": "https://www.arcgis.com/",
}

# ESRI World Imagery tile endpoint
TILE_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"

# Samples: each gets a 3×3 tile grid stitched together
SAMPLES = [
    {
        "file": "urban_dense.jpg",
        "label": "Dense Urban — Mumbai",
        "desc": "High-density residential blocks, roads, and patches of green cover from Mumbai's inner suburbs",
        "lat": 19.0534, "lon": 72.8514, "gsd": 0.30,
        "zoom": 18, "source": "ESRI World Imagery",
    },
    {
        "file": "railway_yard.jpg",
        "label": "Railway Yard — Delhi",
        "desc": "Track network, marshalling yard and access roads near New Delhi railway complex",
        "lat": 28.6392, "lon": 77.2150, "gsd": 0.25,
        "zoom": 18, "source": "ESRI World Imagery",
    },
    {
        "file": "mixed_landuse.jpg",
        "label": "Mixed Land-use — Bengaluru",
        "desc": "Buildings, water bodies, parks and urban green cover in Bengaluru Tech Corridor",
        "lat": 12.9716, "lon": 77.5946, "gsd": 0.35,
        "zoom": 17, "source": "ESRI World Imagery",
    },
]


def lat_lon_to_tile(lat: float, lon: float, z: int) -> tuple[int, int]:
    lat_r = math.radians(lat)
    n = 2 ** z
    x = int((lon + 180) / 360 * n)
    y = int((1 - math.log(math.tan(lat_r) + 1 / math.cos(lat_r)) / math.pi) / 2 * n)
    return x, y


def download_tile(z: int, x: int, y: int) -> bytes:
    url = TILE_URL.format(z=z, x=x, y=y)
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=20) as resp:
        return resp.read()


def stitch_tiles(z: int, cx: int, cy: int, grid: int = 3) -> "Image":
    from PIL import Image
    half = grid // 2
    canvas = Image.new("RGB", (256 * grid, 256 * grid))
    for dy in range(grid):
        for dx in range(grid):
            tx, ty = cx + dx - half, cy + dy - half
            try:
                data = download_tile(z, tx, ty)
                tile = Image.open(io.BytesIO(data)).convert("RGB")
                canvas.paste(tile, (dx * 256, dy * 256))
            except Exception as exc:
                print(f"      ✗ tile {z}/{ty}/{tx}: {exc}")
    return canvas


def generate_synthetic(dest: Path, label: str):
    try:
        from PIL import Image, ImageDraw, ImageFilter
        import random

        rng = random.Random(hash(label) & 0xFFFFFF)
        W, H = 900, 900
        img = Image.new("RGB", (W, H), (58, 52, 44))
        draw = ImageDraw.Draw(img)

        # Ground texture
        for _ in range(3000):
            x, y = rng.randint(0, W), rng.randint(0, H)
            c = rng.randint(45, 75)
            draw.point((x, y), fill=(c, c - 3, c - 8))

        # Grid roads
        for x in range(60, W, rng.randint(100, 160)):
            draw.line([(x, 0), (x, H)], fill=(88, 83, 78), width=rng.randint(7, 12))
        for y in range(60, H, rng.randint(100, 160)):
            draw.line([(0, y), (W, y)], fill=(88, 83, 78), width=rng.randint(7, 12))

        # Buildings (regular grid clusters)
        for bx in range(0, W, 120):
            for by in range(0, H, 120):
                if rng.random() < 0.65:
                    for _ in range(rng.randint(3, 8)):
                        x = bx + rng.randint(8, 80)
                        y = by + rng.randint(8, 80)
                        w = rng.randint(16, 48)
                        h = rng.randint(12, 40)
                        shade = rng.randint(110, 210)
                        draw.rectangle([x, y, x+w, y+h], fill=(shade, shade-8, shade-18))
                        draw.rectangle([x, y, x+w, y+h], outline=(shade-30, shade-38, shade-48))

        # Vegetation patches
        for _ in range(14):
            cx, cy = rng.randint(0, W), rng.randint(0, H)
            r = rng.randint(18, 70)
            g = rng.randint(88, 165)
            draw.ellipse([cx-r, cy-r//2, cx+r, cy+r//2],
                         fill=(rng.randint(18,55), g, rng.randint(18,50)))

        # Water feature
        for _ in range(1):
            cx, cy = rng.randint(100, W-100), rng.randint(100, H-100)
            rx, ry = rng.randint(60, 140), rng.randint(30, 70)
            b = rng.randint(100, 160)
            draw.ellipse([cx-rx, cy-ry, cx+rx, cy+ry], fill=(20, 55, b))

        img = img.filter(ImageFilter.GaussianBlur(0.5))
        img.save(dest, "JPEG", quality=92)
        print(f"    + synthetic saved ({dest.stat().st_size // 1024} KB)")
    except Exception as exc:
        print(f"    ! synthetic generation failed: {exc}")


def main():
    print("\n  Spatial Asset System - Sample Image Downloader\n")
    manifest = []

    for q in SAMPLES:
        dest = SAMPLES_DIR / q["file"]
        entry = {k: v for k, v in q.items() if k not in ("zoom",)}

        if dest.exists():
            print(f"  + {q['file']} already exists")
            entry["available"] = True
            manifest.append(entry)
            continue

        print(f"  -> Downloading satellite tiles for '{q['label']}'...")
        try:
            from PIL import Image
            cx, cy = lat_lon_to_tile(q["lat"], q["lon"], q["zoom"])
            stitched = stitch_tiles(q["zoom"], cx, cy, grid=3)
            stitched = stitched.resize((900, 900), Image.LANCZOS)
            stitched.save(dest, "JPEG", quality=92)
            print(f"     saved {dest.name} ({dest.stat().st_size // 1024} KB)")
            entry["available"] = True
        except Exception as exc:
            print(f"     tile download failed ({exc}), generating synthetic...")
            generate_synthetic(dest, q["label"])
            entry["available"] = dest.exists()

        manifest.append(entry)

    # Merge with existing manifest (keep non-ESRI entries)
    mf_path = SAMPLES_DIR / "manifest.json"
    existing = []
    if mf_path.exists():
        try:
            existing = [e for e in json.loads(mf_path.read_text())
                        if e.get("source", "") not in ("ESRI World Imagery",)
                        and not e.get("file", "").startswith("urban_")
                        and not e.get("file", "").startswith("railway_")
                        and not e.get("file", "").startswith("mixed_")]
        except Exception:
            pass
    mf_path.write_text(json.dumps(existing + manifest, indent=2))
    print(f"\n  Manifest -> samples/manifest.json  ({len(existing + manifest)} total samples)")
    print("  Done. Start the backend and open the app to see sample images.\n")


if __name__ == "__main__":
    main()
