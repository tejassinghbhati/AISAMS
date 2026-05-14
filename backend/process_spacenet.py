"""
SpaceNet SN4 Dataset Processor (CSV-based)
===========================================
Parses the SpaceNet SN4 summaryData CSV files (building pixel polygons),
renders synthetic satellite-style images from real building footprints,
runs our detector, and computes Precision / Recall / F1 evaluation.

Usage
-----
  # After downloading summaryData.tar.gz:
  python process_spacenet.py --tar summaryData.tar.gz

  # Already extracted:
  python process_spacenet.py --dir spacenet_data

  # Also run detector evaluation:
  python process_spacenet.py --dir spacenet_data --evaluate

  # Control number of sample tiles:
  python process_spacenet.py --dir spacenet_data --n 6
"""

import argparse
import csv
import json
import math
import random
import re
import shutil
import sys
import tarfile
from collections import defaultdict
from pathlib import Path
from typing import Optional

SAMPLES_DIR  = Path("samples")
EXTRACT_DIR  = Path("spacenet_data")
N_SAMPLES    = 6
MIN_BUILDINGS = 10
TILE_SIZE    = 900     # SpaceNet SN4 tile width/height in pixels
SN4_GSD      = 0.5    # metres per pixel (SpaceNet SN4 pan-sharpened)
SN4_LAT      = 33.749
SN4_LON      = -84.390

S3_URI = "s3://spacenet-dataset/spacenet/SN4_buildings/tarballs/summaryData.tar.gz"


# ── WKT polygon parser ────────────────────────────────────────────────────

def parse_polygon_pix(wkt: str) -> list[tuple[float, float]]:
    """Parse POLYGON ((x1 y1, x2 y2, ...)) into list of (x, y) tuples."""
    numbers = re.findall(r'[-+]?\d*\.?\d+', wkt)
    pts = []
    for i in range(0, len(numbers) - 1, 2):
        try:
            pts.append((float(numbers[i]), float(numbers[i + 1])))
        except (ValueError, IndexError):
            pass
    return pts


def polygon_bbox(pts: list[tuple[float, float]]) -> tuple[int, int, int, int]:
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    return int(min(xs)), int(min(ys)), int(max(xs)), int(max(ys))


# ── UTM Zone 16N → WGS84 (simplified flat-earth approx for Atlanta) ───────

def utm16n_to_wgs84(easting: float, northing: float) -> tuple[float, float]:
    """Approximate UTM Zone 16N (central meridian -87°) → (lat, lon)."""
    k0 = 0.9996
    lat = northing / (111111.0 * k0)
    lon = -87.0 + (easting - 500000.0) / (111111.0 * math.cos(math.radians(lat)) * k0)
    return round(lat, 5), round(lon, 5)


def tile_id_to_latlon(image_id: str) -> tuple[float, float]:
    """Extract UTM coords from tile ImageId, convert to WGS84."""
    m = re.search(r'_(\d{6})_(\d{7})$', image_id)
    if m:
        e, n = int(m.group(1)), int(m.group(2))
        lat, lon = utm16n_to_wgs84(e + TILE_SIZE * SN4_GSD / 2, n + TILE_SIZE * SN4_GSD / 2)
        return lat, lon
    return SN4_LAT, SN4_LON


# ── CSV parsing ────────────────────────────────────────────────────────────

def load_csv_buildings(csv_dir: Path) -> dict[str, list[list[tuple[float, float]]]]:
    """
    Parse all Train CSVs in csv_dir.
    Returns {image_id: [polygon_pts, ...]} for nadir7 only (sharpest view).
    """
    tiles: dict[str, list] = defaultdict(list)
    # prefer nadir7 (lowest angle, clearest overhead view)
    csvs = sorted(csv_dir.glob("*nadir7*.csv"))
    if not csvs:
        csvs = sorted(csv_dir.glob("*.csv"))
    if not csvs:
        print("  ! No CSV files found")
        return {}

    chosen = csvs[0]
    print(f"  Reading {chosen.name} ...")
    with open(chosen, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            img_id  = row.get("ImageId", "")
            wkt_pix = row.get("PolygonWKT_Pix", "")
            if not img_id or not wkt_pix or "POLYGON" not in wkt_pix:
                continue
            pts = parse_polygon_pix(wkt_pix)
            if len(pts) >= 3:
                tiles[img_id].append(pts)

    print(f"  Loaded {sum(len(v) for v in tiles.values())} buildings across {len(tiles)} tiles")
    return dict(tiles)


# ── Synthetic image renderer ───────────────────────────────────────────────

def render_tile(polygons: list[list[tuple[float, float]]], seed: int = 0) -> "Image":
    """
    Render a synthetic 900×900 satellite-style image from GT building polygons.
    Background: textured terrain.  Buildings: light-gray structured footprints.
    """
    from PIL import Image, ImageDraw, ImageFilter
    rng = random.Random(seed)

    W, H = TILE_SIZE, TILE_SIZE
    img = Image.new("RGB", (W, H))
    draw = ImageDraw.Draw(img)

    # Ground
    for y in range(H):
        for x in range(W):
            n = rng.randint(-6, 6)
            img.putpixel((x, y), (62 + n, 56 + n, 48 + n))

    # Roads (random straight lines)
    for _ in range(rng.randint(3, 6)):
        x1, y1 = rng.randint(0, W), rng.randint(0, H)
        x2, y2 = rng.randint(0, W), rng.randint(0, H)
        w = rng.randint(8, 16)
        draw.line([(x1, y1), (x2, y2)], fill=(92, 87, 81), width=w)

    # Vegetation patches
    for _ in range(rng.randint(4, 10)):
        cx, cy = rng.randint(0, W), rng.randint(0, H)
        rx, ry = rng.randint(15, 60), rng.randint(15, 50)
        g = rng.randint(85, 155)
        draw.ellipse([cx - rx, cy - ry, cx + rx, cy + ry],
                     fill=(rng.randint(20, 50), g, rng.randint(20, 45)))

    # Buildings from GT polygons
    for poly in polygons:
        shade = rng.randint(155, 230)
        pts_int = [(int(x), int(y)) for x, y in poly]
        if len(pts_int) >= 3:
            draw.polygon(pts_int, fill=(shade, shade - 8, shade - 18),
                         outline=(shade - 40, shade - 48, shade - 58))

    img = img.filter(ImageFilter.GaussianBlur(0.5))
    return img


# ── IoU and evaluation ─────────────────────────────────────────────────────

def iou(a: tuple, b: tuple) -> float:
    ax1, ay1, ax2, ay2 = a
    bx1, by1, bx2, by2 = b
    ix1, iy1 = max(ax1, bx1), max(ay1, by1)
    ix2, iy2 = min(ax2, bx2), min(ay2, by2)
    if ix2 <= ix1 or iy2 <= iy1:
        return 0.0
    inter = (ix2 - ix1) * (iy2 - iy1)
    union = (ax2 - ax1) * (ay2 - ay1) + (bx2 - bx1) * (by2 - by1) - inter
    return inter / max(union, 1)


def evaluate_tile(detector, img_path: str, gt_polygons: list, meta: dict) -> dict:
    """Run detector on one rendered tile; compare vs. GT polygon bboxes."""
    result = detector.detect(
        img_path,
        gsd_m=meta["gsd"],
        lat=meta["lat"],
        lon=meta["lon"],
        job_id=meta["stem"],
        out_dir=str(SAMPLES_DIR / "eval" / meta["stem"]),
    )

    gt_bboxes = [polygon_bbox(p) for p in gt_polygons]
    pred_bboxes = [
        (d["bbox"]["x"], d["bbox"]["y"],
         d["bbox"]["x"] + d["bbox"]["w"],
         d["bbox"]["y"] + d["bbox"]["h"])
        for d in result.get("detections", [])
        if d["category"] == "building"
    ]

    if not gt_bboxes or not pred_bboxes:
        return {"gt_count": len(gt_bboxes), "pred_count": len(pred_bboxes),
                "tp": 0, "precision": 0.0, "recall": 0.0, "f1": 0.0}

    matched = set()
    tp = 0
    for pred in pred_bboxes:
        for j, gt in enumerate(gt_bboxes):
            if j not in matched and iou(pred, gt) >= 0.5:
                tp += 1
                matched.add(j)
                break

    prec = tp / len(pred_bboxes)
    rec  = tp / len(gt_bboxes)
    f1   = 2 * prec * rec / (prec + rec + 1e-9)
    return {
        "gt_count":   len(gt_bboxes),
        "pred_count": len(pred_bboxes),
        "tp": tp,
        "precision":  round(prec, 3),
        "recall":     round(rec, 3),
        "f1":         round(f1, 3),
    }


# ── Main pipeline ──────────────────────────────────────────────────────────

def prepare_samples_from_csv(tiles: dict, n_samples: int = N_SAMPLES,
                              evaluate_mode: bool = False):
    SAMPLES_DIR.mkdir(exist_ok=True)

    # Pick tiles with most buildings
    scored = sorted(tiles.items(), key=lambda x: len(x[1]), reverse=True)
    selected = [(img_id, polys) for img_id, polys in scored
                if len(polys) >= MIN_BUILDINGS][:n_samples]
    if not selected:
        selected = scored[:n_samples]

    if not selected:
        print("  ! No usable tiles found")
        return

    detector = None
    if evaluate_mode:
        sys.path.insert(0, str(Path(__file__).parent))
        from detector import SpatialAssetDetector
        detector = SpatialAssetDetector()

    manifest = []
    eval_results = []
    total_buildings = sum(len(v) for v in tiles.values())

    print(f"\n  Dataset: {len(tiles)} tiles, {total_buildings} annotated buildings")
    print(f"  Preparing {len(selected)} sample tiles...\n")

    for rank, (img_id, polygons) in enumerate(selected, 1):
        lat, lon = tile_id_to_latlon(img_id)
        stem = f"spacenet_{rank:02d}"
        dst  = SAMPLES_DIR / f"{stem}.jpg"

        print(f"  [{rank}/{len(selected)}] {img_id.split('_catid_')[0].split('Atlanta_')[-1]}")
        print(f"    GT buildings : {len(polygons)}")
        print(f"    Origin       : {lat:.4f}N  {lon:.4f}E")

        try:
            rendered = render_tile(polygons, seed=rank * 7)
            rendered.save(dst, "JPEG", quality=92)
            print(f"    + rendered tile saved ({dst.stat().st_size // 1024} KB)")
        except Exception as exc:
            print(f"    ! render failed: {exc}")
            continue

        entry = {
            "file": dst.name,
            "label": f"SpaceNet SN4 - Atlanta tile {rank}",
            "desc": f"Rendered from real building footprints - {len(polygons)} annotated buildings - GSD {SN4_GSD}m/px",
            "lat":  lat,
            "lon":  lon,
            "gsd":  SN4_GSD,
            "url":  f"/samples/{dst.name}",
            "available": True,
            "source": "SpaceNet SN4 / AWS Open Data",
            "gt_buildings": len(polygons),
        }

        if evaluate_mode and detector:
            print(f"    -> evaluating detector...")
            try:
                metrics = evaluate_tile(
                    detector, str(dst), polygons,
                    {"gsd": SN4_GSD, "lat": lat, "lon": lon, "stem": stem},
                )
                entry["eval"] = metrics
                eval_results.append((stem, metrics))
                print(f"    P={metrics['precision']:.1%}  R={metrics['recall']:.1%}  F1={metrics['f1']:.1%}")
            except Exception as exc:
                print(f"    ! eval failed: {exc}")

        manifest.append(entry)

    # Merge manifest (keep non-SpaceNet entries from previous runs)
    mf_path = SAMPLES_DIR / "manifest.json"
    existing = []
    if mf_path.exists():
        try:
            existing = [e for e in json.loads(mf_path.read_text())
                        if not e.get("source", "").startswith("SpaceNet")]
        except Exception:
            pass
    mf_path.write_text(json.dumps(existing + manifest, indent=2))
    print(f"\n  Manifest -> {mf_path}  ({len(existing + manifest)} total samples)")

    if eval_results:
        avg_p = sum(m["precision"] for _, m in eval_results) / len(eval_results)
        avg_r = sum(m["recall"]    for _, m in eval_results) / len(eval_results)
        avg_f = sum(m["f1"]        for _, m in eval_results) / len(eval_results)
        print(f"\n  Evaluation summary ({len(eval_results)} tiles):")
        print(f"  Avg Precision : {avg_p:.1%}")
        print(f"  Avg Recall    : {avg_r:.1%}")
        print(f"  Avg F1        : {avg_f:.1%}")
        eval_path = SAMPLES_DIR / "eval_summary.json"
        eval_path.write_text(json.dumps({
            "tiles":         len(eval_results),
            "avg_precision": round(avg_p, 3),
            "avg_recall":    round(avg_r, 3),
            "avg_f1":        round(avg_f, 3),
            "dataset_tiles": len(tiles),
            "dataset_buildings": total_buildings,
            "per_tile": [{"tile": s, **m} for s, m in eval_results],
        }, indent=2))
        print(f"  Eval report -> {eval_path}")


# ── CLI ────────────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser(description="SpaceNet SN4 CSV-based sample processor")
    ap.add_argument("--tar",      type=Path, help="summaryData.tar.gz path")
    ap.add_argument("--dir",      type=Path, help="Already-extracted directory")
    ap.add_argument("--evaluate", action="store_true",
                    help="Run detector and compute P/R/F1")
    ap.add_argument("--n", type=int, default=N_SAMPLES,
                    help=f"Number of sample tiles (default {N_SAMPLES})")
    args = ap.parse_args()

    print("\n  SpaceNet SN4 Dataset Processor (CSV mode)\n")

    base_dir: Optional[Path] = None

    if args.tar:
        if not args.tar.exists():
            print(f"  ! File not found: {args.tar}")
            sys.exit(1)
        print(f"  Extracting {args.tar} ...")
        EXTRACT_DIR.mkdir(parents=True, exist_ok=True)
        with tarfile.open(args.tar, "r:gz") as tf:
            tf.extractall(EXTRACT_DIR, filter="data")
        print(f"  Extracted to {EXTRACT_DIR}/")
        base_dir = EXTRACT_DIR
    elif args.dir:
        base_dir = args.dir
        if not base_dir.exists():
            print(f"  ! Directory not found: {args.dir}")
            sys.exit(1)
    else:
        ap.print_help()
        sys.exit(0)

    # Find CSV directory (summaryData subfolder or root)
    csv_dir = base_dir
    sub = base_dir / "summaryData"
    if sub.exists():
        csv_dir = sub

    tiles = load_csv_buildings(csv_dir)
    if not tiles:
        print("  ! No building data loaded from CSVs")
        sys.exit(1)

    prepare_samples_from_csv(tiles, n_samples=args.n, evaluate_mode=args.evaluate)
    print("\n  Done. Start the backend and refresh to see SpaceNet samples.\n")


if __name__ == "__main__":
    main()
