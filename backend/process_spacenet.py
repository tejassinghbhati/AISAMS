"""
SpaceNet SN4 Dataset Processor
═══════════════════════════════════════════════════════════════════════════════
Downloads / extracts the SpaceNet 4 (Atlanta buildings) dataset, prepares
representative 1024×1024 image tiles as demo samples, and optionally runs
precision / recall evaluation against the ground-truth building footprints.

Usage
-----
  # If you ran: aws s3 cp s3://spacenet-dataset/spacenet/SN4_buildings/tarballs/summaryData.tar.gz .
  python process_spacenet.py --tar summaryData.tar.gz

  # Already extracted:
  python process_spacenet.py --dir summaryData

  # Download yourself (requires AWS CLI + credentials or --no-sign-request):
  python process_spacenet.py --download

  # After preparing samples, evaluate detector accuracy:
  python process_spacenet.py --dir summaryData --evaluate
"""

import argparse
import json
import math
import os
import random
import shutil
import struct
import subprocess
import sys
import tarfile
from pathlib import Path
from typing import Optional

# ── Constants ──────────────────────────────────────────────────────────────

SAMPLES_DIR   = Path("samples")
EXTRACT_DIR   = Path("spacenet_data")
N_SAMPLES     = 6          # tiles to copy into samples/
TILE_SIZE     = 1024       # resize to this for fast inference
MIN_BUILDINGS = 5          # skip tiles with fewer GT buildings

# SpaceNet SN4 defaults for Atlanta (WorldView-2, pan-sharpened)
SN4_GSD = 0.3             # m/pixel
SN4_LAT = 33.746
SN4_LON = -84.389

S3_URI = "s3://spacenet-dataset/spacenet/SN4_buildings/tarballs/summaryData.tar.gz"

# ── Geo helpers ────────────────────────────────────────────────────────────

def geotiff_metadata(tif_path: Path) -> dict:
    """
    Extract (origin_lon, origin_lat, gsd_m) from a GeoTIFF.
    Tries rasterio → gdal CLI → tiff-tag parser → SpaceNet defaults.
    """
    # 1. rasterio (best)
    try:
        import rasterio
        with rasterio.open(str(tif_path)) as src:
            t   = src.transform
            gsd = abs(t.a)  # pixel width in CRS units
            # if CRS is projected (metres), gsd is already in m
            # if CRS is geographic (degrees), approximate
            if src.crs and src.crs.is_geographic:
                gsd = gsd * 111_111
            lon, lat = src.lnglat()
            return {"lat": round(lat, 6), "lon": round(lon, 6), "gsd": round(gsd, 4)}
    except Exception:
        pass

    # 2. gdalinfo CLI
    try:
        out = subprocess.check_output(
            ["gdalinfo", str(tif_path)], stderr=subprocess.DEVNULL, text=True
        )
        origin, pixel = None, None
        for line in out.splitlines():
            if "Origin =" in line:
                parts = line.split("(")[1].rstrip(")").split(",")
                origin = (float(parts[0].strip()), float(parts[1].strip()))
            if "Pixel Size =" in line:
                parts = line.split("(")[1].rstrip(")").split(",")
                pixel = abs(float(parts[0].strip()))
        if origin and pixel:
            gsd = pixel if pixel < 1 else pixel  # assume degrees if < 1
            if gsd < 0.01:   # degrees → metres
                gsd = gsd * 111_111
            return {"lat": round(origin[1], 6), "lon": round(origin[0], 6), "gsd": round(gsd, 4)}
    except Exception:
        pass

    # 3. Minimal TIFF GeoKey parser (pure Python, no deps)
    try:
        meta = _parse_geotiff_tags(tif_path)
        if meta:
            return meta
    except Exception:
        pass

    # 4. Defaults from tile filename (SpaceNet SN4 tile grid ~Atlanta)
    return {"lat": SN4_LAT, "lon": SN4_LON, "gsd": SN4_GSD}


def _parse_geotiff_tags(path: Path) -> Optional[dict]:
    """
    Minimal GeoTIFF ModelTiepointTag (tag 33922) + ModelPixelScaleTag (tag 33550) parser.
    Both tags are in little-endian doubles (IEEE 754).
    """
    with open(path, "rb") as f:
        header = f.read(8)
        if header[:2] not in (b"II", b"MM"):
            return None
        bo = "<" if header[:2] == b"II" else ">"
        offset = struct.unpack(bo + "I", header[4:8])[0]
        f.seek(offset)
        n_entries = struct.unpack(bo + "H", f.read(2))[0]
        tags: dict = {}
        for _ in range(n_entries):
            raw = f.read(12)
            tag, dtype, count = struct.unpack(bo + "HHI", raw[:8])
            val_or_offset = struct.unpack(bo + "I", raw[8:])[0]
            if dtype == 12 and count <= 3:   # DOUBLE, fits inline only rarely
                pass
            tags[tag] = (dtype, count, val_or_offset)

        def read_doubles(offset, count):
            f.seek(offset)
            return list(struct.unpack(bo + f"{count}d", f.read(count * 8)))

        scale  = None
        tiepoint = None
        if 33550 in tags:   # ModelPixelScaleTag
            _, cnt, off = tags[33550]
            scale = read_doubles(off, cnt)
        if 33922 in tags:   # ModelTiepointTag
            _, cnt, off = tags[33922]
            tp = read_doubles(off, cnt)
            tiepoint = tp  # [i,j,k, x,y,z]

        if tiepoint and scale:
            lon = tiepoint[3]
            lat = tiepoint[4]
            gsd = scale[0]
            if gsd < 0.01:   # degrees
                gsd = gsd * 111_111
            return {"lat": round(lat, 6), "lon": round(lon, 6), "gsd": round(gsd, 4)}
    return None


# ── Image resizing ─────────────────────────────────────────────────────────

def resize_image(src: Path, dst: Path, max_px: int = TILE_SIZE):
    """Resize to max_px on longest side, save as JPEG."""
    try:
        from PIL import Image
        img = Image.open(src)
        # Ensure RGB
        if img.mode not in ("RGB", "L"):
            img = img.convert("RGB")
        w, h = img.size
        if max(w, h) > max_px:
            scale = max_px / max(w, h)
            img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
        img.save(dst, "JPEG", quality=90)
        return True
    except Exception as exc:
        print(f"    ✗ PIL resize failed ({exc}) — copying raw")
        shutil.copy2(src, dst.with_suffix(src.suffix))
        return False


# ── Ground truth loading ───────────────────────────────────────────────────

def load_gt_buildings(geojson_path: Path) -> list[dict]:
    """Return list of building polygon dicts from SpaceNet GeoJSON."""
    if not geojson_path.exists():
        return []
    with open(geojson_path) as f:
        data = json.load(f)
    return [feat for feat in data.get("features", [])
            if feat.get("geometry") and feat["geometry"].get("type") in ("Polygon", "MultiPolygon")]


def bbox_from_geometry(geom: dict, gt: dict) -> Optional[tuple]:
    """Convert a WGS84 polygon to pixel bbox using geotransform (ox, oy, gsd)."""
    ox, oy, gsd = gt.get("lon"), gt.get("lat"), gt.get("gsd", SN4_GSD)
    if ox is None:
        return None
    coords = geom["coordinates"][0] if geom["type"] == "Polygon" else geom["coordinates"][0][0]
    xs = [_lon_to_px(c[0], ox, gsd) for c in coords]
    ys = [_lat_to_px(c[1], oy, gsd) for c in coords]
    return int(min(xs)), int(min(ys)), int(max(xs)), int(max(ys))


def _lon_to_px(lon: float, origin_lon: float, gsd_m: float) -> float:
    dx = (lon - origin_lon) * 111_111 * math.cos(math.radians(origin_lon))
    return dx / gsd_m


def _lat_to_px(lat: float, origin_lat: float, gsd_m: float) -> float:
    dy = (lat - origin_lat) * 111_111
    return -dy / gsd_m   # y increases downward in image space


# ── Detection evaluation ───────────────────────────────────────────────────

def iou(a: tuple, b: tuple) -> float:
    ax1, ay1, ax2, ay2 = a
    bx1, by1, bx2, by2 = b
    ix1 = max(ax1, bx1); iy1 = max(ay1, by1)
    ix2 = min(ax2, bx2); iy2 = min(ay2, by2)
    if ix2 <= ix1 or iy2 <= iy1:
        return 0.0
    inter = (ix2 - ix1) * (iy2 - iy1)
    union = (ax2-ax1)*(ay2-ay1) + (bx2-bx1)*(by2-by1) - inter
    return inter / max(union, 1)


def evaluate(det_result: dict, gt_buildings: list[dict], gt_meta: dict) -> dict:
    """Compute precision / recall for building detection at IoU ≥ 0.5."""
    gt_bboxes = []
    for feat in gt_buildings:
        bb = bbox_from_geometry(feat["geometry"], gt_meta)
        if bb:
            gt_bboxes.append(bb)

    pred_bboxes = [
        (d["bbox"]["x"], d["bbox"]["y"],
         d["bbox"]["x"] + d["bbox"]["w"],
         d["bbox"]["y"] + d["bbox"]["h"])
        for d in det_result.get("detections", [])
        if d["category"] == "building"
    ]

    if not gt_bboxes or not pred_bboxes:
        return {"gt_count": len(gt_bboxes), "pred_count": len(pred_bboxes),
                "tp": 0, "precision": 0.0, "recall": 0.0, "f1": 0.0}

    matched_gt = set()
    tp = 0
    for pred in pred_bboxes:
        for j, gt_bb in enumerate(gt_bboxes):
            if j not in matched_gt and iou(pred, gt_bb) >= 0.5:
                tp += 1
                matched_gt.add(j)
                break

    precision = tp / len(pred_bboxes) if pred_bboxes else 0.0
    recall    = tp / len(gt_bboxes)   if gt_bboxes   else 0.0
    f1 = 2 * precision * recall / (precision + recall + 1e-9)
    return {
        "gt_count":   len(gt_bboxes),
        "pred_count": len(pred_bboxes),
        "tp":         tp,
        "precision":  round(precision, 3),
        "recall":     round(recall, 3),
        "f1":         round(f1, 3),
    }


# ── Dataset traversal ──────────────────────────────────────────────────────

def find_image_geojson_pairs(base_dir: Path) -> list[tuple[Path, Optional[Path]]]:
    """
    Walk the SpaceNet directory tree and return (image_path, gt_geojson_path) pairs.
    SpaceNet SN4 structure (may vary by download):
      AOI_6_Atlanta_Train/
        RGB-PAN-MS/   *.tif   (3-band RGB, pan-sharpened)
        geojson/buildings/    *.geojson
    """
    pairs = []
    # Search for RGB or PAN images
    for img in sorted(base_dir.rglob("*.tif")):
        # Prefer RGB-PAN-MS or 3-band images; skip MUL (8-band)
        parts = img.parts
        if any(p in ("MUL", "PAN") for p in parts) and "RGB" not in str(img):
            continue
        # Locate matching GT geojson by stem
        stem = img.stem   # e.g. RGB-PAN-MS_AOI_6_Atlanta_img1
        # GT files: buildings_AOI_6_Atlanta_img1.geojson
        tile_id = stem.split("_img")[-1] if "_img" in stem else stem
        gt_candidates = list(base_dir.rglob(f"*img{tile_id}*.geojson"))
        if not gt_candidates:
            gt_candidates = list(base_dir.rglob(f"*{tile_id}*.geojson"))
        gt = gt_candidates[0] if gt_candidates else None
        pairs.append((img, gt))
    return pairs


# ── Main pipeline ──────────────────────────────────────────────────────────

def extract_tar(tar_path: Path, dest: Path) -> Path:
    print(f"  → Extracting {tar_path} …")
    dest.mkdir(parents=True, exist_ok=True)
    with tarfile.open(tar_path, "r:gz") as tf:
        tf.extractall(dest)
    print(f"  ✓ Extracted to {dest}/")
    return dest


def prepare_samples(pairs: list[tuple[Path, Optional[Path]]], evaluate_mode: bool = False):
    SAMPLES_DIR.mkdir(exist_ok=True)

    # Filter: prefer tiles with GT buildings
    scored = []
    for img, gt_path in pairs:
        n_gt = len(load_gt_buildings(gt_path)) if gt_path else 0
        scored.append((n_gt, img, gt_path))

    # Sort by GT count descending, take best N
    scored.sort(key=lambda x: x[0], reverse=True)
    selected = [x for x in scored if x[0] >= MIN_BUILDINGS][:N_SAMPLES]
    if not selected:
        print("  ⚠  No tiles with ≥5 GT buildings found — using first N images")
        selected = scored[:N_SAMPLES]

    manifest = []
    eval_results = []

    for rank, (n_gt, img_path, gt_path) in enumerate(selected, 1):
        meta = geotiff_metadata(img_path)
        stem = f"spacenet_{rank:02d}"
        dst  = SAMPLES_DIR / f"{stem}.jpg"

        print(f"\n  [{rank}/{len(selected)}] {img_path.name}")
        print(f"    GT buildings : {n_gt}")
        print(f"    GSD          : {meta['gsd']} m/px")
        print(f"    Origin       : {meta['lat']:.4f}°N  {meta['lon']:.4f}°E")

        ok = resize_image(img_path, dst, max_px=TILE_SIZE)
        if not ok:
            dst = SAMPLES_DIR / f"{stem}{img_path.suffix}"
        print(f"    ✓ Saved → {dst}")

        entry = {
            "file":  dst.name,
            "label": f"SpaceNet SN4 — Atlanta tile {rank}",
            "desc":  f"WorldView-2 pan-sharpened · {n_gt} annotated buildings · {meta['gsd']} m/px GSD",
            "lat":   meta["lat"],
            "lon":   meta["lon"],
            "gsd":   meta["gsd"],
            "url":   f"/samples/{dst.name}",
            "available": True,
            "source": "SpaceNet SN4 / AWS Open Data",
            "gt_buildings": n_gt,
        }
        if gt_path:
            shutil.copy2(gt_path, SAMPLES_DIR / f"{stem}_gt.geojson")
            entry["gt_geojson"] = f"/samples/{stem}_gt.geojson"
        manifest.append(entry)

        # Optional evaluation
        if evaluate_mode:
            print(f"    → Running detector for evaluation…")
            try:
                sys.path.insert(0, str(Path(__file__).parent))
                from detector import SpatialAssetDetector
                det = SpatialAssetDetector()
                result = det.detect(str(dst), gsd_m=meta["gsd"],
                                    lat=meta["lat"], lon=meta["lon"],
                                    job_id=stem, out_dir=str(SAMPLES_DIR / "eval" / stem))
                if gt_path:
                    gt_bldgs = load_gt_buildings(gt_path)
                    metrics  = evaluate(result, gt_bldgs, meta)
                    entry["eval"] = metrics
                    eval_results.append((stem, metrics))
                    print(f"    Precision {metrics['precision']:.2%}  "
                          f"Recall {metrics['recall']:.2%}  F1 {metrics['f1']:.2%}")
            except Exception as exc:
                print(f"    ✗ Evaluation failed: {exc}")

    # Write / merge manifest
    existing_manifest = SAMPLES_DIR / "manifest.json"
    existing = []
    if existing_manifest.exists():
        try:
            existing = [e for e in json.loads(existing_manifest.read_text())
                        if not e.get("source", "").startswith("SpaceNet")]
        except Exception:
            pass
    final_manifest = existing + manifest
    existing_manifest.write_text(json.dumps(final_manifest, indent=2))
    print(f"\n  ✓ Manifest updated → {existing_manifest}  ({len(final_manifest)} total samples)")

    if eval_results:
        avg_p = sum(m["precision"] for _, m in eval_results) / len(eval_results)
        avg_r = sum(m["recall"]    for _, m in eval_results) / len(eval_results)
        avg_f = sum(m["f1"]        for _, m in eval_results) / len(eval_results)
        print(f"\n  ══ Evaluation summary ({len(eval_results)} tiles) ══")
        print(f"  Avg Precision : {avg_p:.2%}")
        print(f"  Avg Recall    : {avg_r:.2%}")
        print(f"  Avg F1        : {avg_f:.2%}")
        (SAMPLES_DIR / "eval_summary.json").write_text(
            json.dumps({"tiles": len(eval_results),
                        "avg_precision": round(avg_p, 3),
                        "avg_recall":    round(avg_r, 3),
                        "avg_f1":        round(avg_f, 3),
                        "per_tile": [{"tile": s, **m} for s, m in eval_results]},
                       indent=2))
        print(f"  ✓ Eval report → samples/eval_summary.json")


# ── CLI ────────────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser(description="SpaceNet SN4 dataset processor")
    ap.add_argument("--tar",      type=Path, help="Path to summaryData.tar.gz")
    ap.add_argument("--dir",      type=Path, help="Path to already-extracted directory")
    ap.add_argument("--download", action="store_true",
                    help="Download from S3 first (requires AWS CLI)")
    ap.add_argument("--evaluate", action="store_true",
                    help="Run detector and report precision/recall vs GT")
    ap.add_argument("--n",        type=int, default=N_SAMPLES,
                    help=f"Number of sample tiles to prepare (default {N_SAMPLES})")
    args = ap.parse_args()

    print("\n  SpaceNet SN4 Dataset Processor")
    print("  ─────────────────────────────────────────────\n")

    base_dir: Optional[Path] = None

    if args.download:
        print(f"  → Downloading from {S3_URI} …")
        tar_out = Path("summaryData.tar.gz")
        ret = subprocess.run(
            ["aws", "s3", "cp", S3_URI, str(tar_out)],
            capture_output=False,
        )
        if ret.returncode != 0:
            # Try with --no-sign-request (public bucket)
            print("  ⚠  Retrying with --no-sign-request …")
            subprocess.run(
                ["aws", "s3", "cp", "--no-sign-request", S3_URI, str(tar_out)],
            )
        args.tar = tar_out

    if args.tar:
        if not args.tar.exists():
            print(f"  ✗ File not found: {args.tar}")
            sys.exit(1)
        base_dir = extract_tar(args.tar, EXTRACT_DIR)
    elif args.dir:
        base_dir = args.dir
        if not base_dir.exists():
            print(f"  ✗ Directory not found: {base_dir}")
            sys.exit(1)
    else:
        ap.print_help()
        print("\n  Example:\n    python process_spacenet.py --tar summaryData.tar.gz\n")
        sys.exit(0)

    print(f"\n  → Scanning {base_dir} for imagery…")
    pairs = find_image_geojson_pairs(base_dir)
    print(f"  Found {len(pairs)} image tiles")

    if not pairs:
        print("  ✗ No .tif images found. Check the directory structure.")
        sys.exit(1)

    global N_SAMPLES
    N_SAMPLES = args.n
    prepare_samples(pairs, evaluate_mode=args.evaluate)

    print("\n  All done. Start the backend and refresh the app to see SpaceNet samples.\n")


if __name__ == "__main__":
    main()
