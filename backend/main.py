"""
main.py — FastAPI application entry point for DRISHYA.

Route map
---------
GET  /api/health                        — liveness check, reports yolo_available
GET  /api/samples                       — list demo sample images from manifest.json
GET  /api/eval                          — return SpaceNet evaluation summary
POST /api/samples/{filename}/detect     — run detection on a bundled demo image
POST /api/detect                        — run detection on an uploaded image
POST /api/change                        — run change detection on before/after pair
GET  /api/jobs/{job_id}                 — retrieve a cached job result
GET  /api/export/{job_id}/geojson       — download GeoJSON for a job
GET  /api/export/{job_id}/csv           — download CSV for a job
GET  /api/export/{job_id}/shapefile     — download Shapefile zip for a job
GET  /api/seg/status                    — report whether segmentation model is ready
POST /api/segment                       — run land cover segmentation on uploaded image
POST /api/samples/{filename}/segment    — run segmentation on a bundled demo image
POST /api/satellite/fetch               — fetch live satellite tile and run detection
POST /api/digit/push/{job_id}           — push job detections to mock DIGIT registry

Job lifecycle
-------------
Each POST that runs inference generates a UUID job_id, stores results in
results/<job_id>/, caches the result dict in the in-memory _jobs store, and
returns the dict to the client. GET routes read from _jobs (restarting the
server clears the cache — results on disk persist but are not re-indexed).

Lazy model loading
------------------
SpatialAssetDetector._ensure_yolo() defers YOLOv8 weight loading to the first
/api/detect call. _ensure_seg() defers segmentation PyTorch import to the first
/api/segment or /api/seg/status call. This keeps startup RAM under 80 MB so
Render's health check passes immediately.

Static serving
--------------
/results and /samples are mounted as StaticFiles directories.
The compiled React SPA (frontend/dist → static/) is mounted last at / so all
non-API paths serve index.html (client-side routing).
"""

import io
import json
import shutil
import uuid
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

from detector import SpatialAssetDetector
from change import ChangeDetector
from geo import build_geojson, build_csv

# Segmentation — imports deferred to first request to avoid loading PyTorch at startup
_seg_available: Optional[bool] = None  # None = not yet checked
_seg_infer = None
_seg_classes: list = []
_seg_hex: list = []

def _ensure_seg():
    global _seg_available, _seg_infer, _seg_classes, _seg_hex
    if _seg_available is not None:
        return
    try:
        from segmentation.inference import segment_image as _fn
        from segmentation.dataset import CLASS_NAMES, CLASS_HEX
        _seg_infer = _fn
        _seg_classes = CLASS_NAMES
        _seg_hex = CLASS_HEX
        _seg_available = Path("segmentation/deepglobe_seg.pt").exists()
    except ImportError:
        _seg_available = False

app = FastAPI(title="AI Spatial Asset Management System", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR  = Path("uploads")
RESULTS_DIR = Path("results")
SAMPLES_DIR = Path("samples")
for d in (UPLOAD_DIR, RESULTS_DIR, SAMPLES_DIR):
    d.mkdir(exist_ok=True)

app.mount("/results", StaticFiles(directory="results"), name="results")
app.mount("/samples", StaticFiles(directory="samples"),  name="samples")

detector        = SpatialAssetDetector()
change_detector = ChangeDetector()

_jobs: dict = {}

ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".tif", ".tiff"}


def _save_upload(file: UploadFile, stem: str) -> Path:
    suffix = Path(file.filename or "x.jpg").suffix.lower()
    if suffix not in ALLOWED_EXT:
        raise HTTPException(400, f"Unsupported format: {suffix}")
    path = UPLOAD_DIR / f"{stem}{suffix}"
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return path


# ──────────────────────────────────────────────────────────────────── health ──

@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "yolo_available": detector.yolo_available or Path("yolov8n.pt").exists(),
    }


# ─────────────────────────────────────────────────────────────────── samples ──

@app.get("/api/samples")
def list_samples():
    """Return manifest of available demo sample images, including SpaceNet tiles."""
    manifest_path = SAMPLES_DIR / "manifest.json"
    if not manifest_path.exists():
        return {
            "samples": [],
            "hint": "Run  python download_samples.py  OR  python process_spacenet.py --tar summaryData.tar.gz",
        }
    items = json.loads(manifest_path.read_text())
    for item in items:
        item["url"]       = f"/samples/{item['file']}"
        item["available"] = (SAMPLES_DIR / item["file"]).exists()
        if item.get("gt_geojson"):
            item["gt_url"] = f"/samples/{Path(item['gt_geojson']).name}"
    return {"samples": items}


@app.get("/api/eval")
def get_eval_summary():
    """Return detector evaluation summary produced by process_spacenet.py --evaluate."""
    eval_path = SAMPLES_DIR / "eval_summary.json"
    if not eval_path.exists():
        return {"available": False, "hint": "Run process_spacenet.py --evaluate to generate"}
    data = json.loads(eval_path.read_text())
    data["available"] = True
    return data


@app.post("/api/samples/{filename}/detect")
def detect_sample(filename: str):
    """Run detection on one of the bundled demo images."""
    safe = Path(filename).name
    img_path = SAMPLES_DIR / safe
    if not img_path.exists():
        raise HTTPException(404, f"Sample '{safe}' not found. Run download_samples.py first.")

    manifest_path = SAMPLES_DIR / "manifest.json"
    meta = {}
    if manifest_path.exists():
        for item in json.loads(manifest_path.read_text()):
            if item["file"] == safe:
                meta = item
                break

    job_id  = uuid.uuid4().hex[:8]
    out_dir = RESULTS_DIR / job_id
    out_dir.mkdir(parents=True, exist_ok=True)

    try:
        result = detector.detect(
            str(img_path),
            gsd_m=meta.get("gsd", 0.5),
            lat=meta.get("lat"),
            lon=meta.get("lon"),
            job_id=job_id,
            out_dir=str(out_dir),
        )
        result["sample_label"] = meta.get("label", safe)
        _jobs[job_id] = result
        return result
    except Exception as exc:
        raise HTTPException(500, str(exc))


# ──────────────────────────────────────────────────────────────────── detect ──

@app.post("/api/detect")
async def detect_assets(
    file: UploadFile = File(...),
    gsd_m: Optional[float] = Form(0.5),
    lat:   Optional[float] = Form(None),
    lon:   Optional[float] = Form(None),
):
    job_id   = uuid.uuid4().hex[:8]
    img_path = _save_upload(file, job_id)
    out_dir  = RESULTS_DIR / job_id
    out_dir.mkdir(parents=True, exist_ok=True)

    try:
        result = detector.detect(
            str(img_path),
            gsd_m=gsd_m or 0.5,
            lat=lat,
            lon=lon,
            job_id=job_id,
            out_dir=str(out_dir),
        )
        _jobs[job_id] = result
        return result
    except Exception as exc:
        raise HTTPException(500, str(exc))


# ────────────────────────────────────────────────────────────── change detect ──

@app.post("/api/change")
async def detect_changes(
    before: UploadFile = File(...),
    after:  UploadFile = File(...),
    gsd_m:  Optional[float] = Form(0.5),
):
    job_id      = uuid.uuid4().hex[:8]
    before_path = _save_upload(before, f"{job_id}_before")
    after_path  = _save_upload(after,  f"{job_id}_after")
    out_dir     = RESULTS_DIR / job_id
    out_dir.mkdir(parents=True, exist_ok=True)

    try:
        result = change_detector.detect_changes(
            str(before_path), str(after_path), job_id, str(out_dir)
        )
        _jobs[job_id] = result
        return result
    except Exception as exc:
        raise HTTPException(500, str(exc))


# ──────────────────────────────────────────────────────────────────── export ──

@app.get("/api/jobs/{job_id}")
def get_job(job_id: str):
    if job_id not in _jobs:
        raise HTTPException(404, "Job not found")
    return _jobs[job_id]


@app.get("/api/export/{job_id}/geojson")
def export_geojson(job_id: str):
    if job_id not in _jobs:
        raise HTTPException(404, "Job not found")
    return JSONResponse(
        content=build_geojson(_jobs[job_id]),
        headers={"Content-Disposition": f"attachment; filename=assets_{job_id}.geojson"},
    )


@app.get("/api/export/{job_id}/csv")
def export_csv(job_id: str):
    if job_id not in _jobs:
        raise HTTPException(404, "Job not found")
    return PlainTextResponse(
        build_csv(_jobs[job_id]),
        headers={"Content-Disposition": f"attachment; filename=assets_{job_id}.csv"},
    )


# ────────────────────────────────────────────────── segmentation (DeepGlobe) ──

@app.get("/api/seg/status")
def seg_status():
    _ensure_seg()
    return {
        "available": _seg_available,
        "model_path": "segmentation/deepglobe_seg.pt",
        "classes": _seg_classes,
        "class_colors": _seg_hex,
    }


@app.post("/api/segment")
async def segment_assets(
    file: UploadFile = File(...),
):
    _ensure_seg()
    if not _seg_available:
        raise HTTPException(503, "Segmentation model not trained yet. Run: python train_segmentation.py --data <path>")

    job_id   = uuid.uuid4().hex[:8]
    img_path = _save_upload(file, f"seg_{job_id}")
    out_dir  = RESULTS_DIR / job_id
    out_dir.mkdir(parents=True, exist_ok=True)

    try:
        result = _seg_infer(str(img_path), str(out_dir))
        result["job_id"] = job_id
        result["seg_url"]     = f"/results/{job_id}/seg_mask.png"
        result["overlay_url"] = f"/results/{job_id}/seg_overlay.jpg"
        _jobs[job_id] = result
        return result
    except Exception as exc:
        raise HTTPException(500, str(exc))


@app.post("/api/samples/{filename}/segment")
def segment_sample(filename: str):
    _ensure_seg()
    if not _seg_available:
        raise HTTPException(503, "Segmentation model not trained yet.")

    safe = Path(filename).name
    img_path = SAMPLES_DIR / safe
    if not img_path.exists():
        raise HTTPException(404, f"Sample '{safe}' not found.")

    job_id  = uuid.uuid4().hex[:8]
    out_dir = RESULTS_DIR / job_id
    out_dir.mkdir(parents=True, exist_ok=True)

    try:
        result = _seg_infer(str(img_path), str(out_dir))
        result["job_id"]      = job_id
        result["seg_url"]     = f"/results/{job_id}/seg_mask.png"
        result["overlay_url"] = f"/results/{job_id}/seg_overlay.jpg"
        _jobs[job_id] = result
        return result
    except Exception as exc:
        raise HTTPException(500, str(exc))


# ──────────────────────────────────────────────── live satellite fetch + detect ──

@app.post("/api/satellite/fetch")
async def satellite_fetch(
    lat:    float = Form(...),
    lon:    float = Form(...),
    zoom:   int   = Form(18),
    source: str   = Form("esri"),
):
    """Fetch a live satellite tile from ESRI or Bhuvan, then run asset detection."""
    from satellite import fetch_satellite_image

    job_id  = uuid.uuid4().hex[:8]
    out_dir = RESULTS_DIR / job_id
    out_dir.mkdir(parents=True, exist_ok=True)

    try:
        img, gsd_m = fetch_satellite_image(lat, lon, zoom=zoom, source=source)
    except Exception as exc:
        raise HTTPException(502, f"Satellite fetch failed: {exc}")

    # Save raw tile so the frontend can use it as the canvas base image
    src_path = out_dir / "source.jpg"
    img.save(src_path, "JPEG", quality=92)

    # Save a copy to uploads for the detector
    img_path = UPLOAD_DIR / f"{job_id}_sat.jpg"
    img.save(img_path, "JPEG", quality=92)

    try:
        result = detector.detect(
            str(img_path), gsd_m=gsd_m, lat=lat, lon=lon,
            job_id=job_id, out_dir=str(out_dir),
        )
        result["source_url"] = f"/results/{job_id}/source.jpg"
        _jobs[job_id] = result
        return result
    except Exception as exc:
        raise HTTPException(500, str(exc))


# ──────────────────────────────────────────────────────── shapefile export ──

@app.get("/api/export/{job_id}/shapefile")
def export_shapefile(job_id: str):
    if job_id not in _jobs:
        raise HTTPException(404, "Job not found")

    try:
        import shapefile  # pyshp
    except ImportError:
        raise HTTPException(501, "pyshp not installed")

    import tempfile, zipfile

    job = _jobs[job_id]
    buf = io.BytesIO()

    with tempfile.TemporaryDirectory() as tmp:
        base = Path(tmp) / f"assets_{job_id}"
        w = shapefile.Writer(str(base), shapeType=shapefile.POLYGON)
        w.field("ID",         "C",  8)
        w.field("CATEGORY",   "C", 20)
        w.field("CONFIDENCE", "N",  6, 3)
        w.field("AREA_SQM",   "N", 12, 2)

        for det in job.get("detections", []):
            geom = det.get("geometry")
            if geom and geom.get("type") == "Polygon":
                w.poly([geom["coordinates"][0]])
                w.record(
                    det["id"], det["category"],
                    det["confidence"], det.get("area_sqm", 0),
                )
        w.close()

        # WGS-84 projection file
        (Path(tmp) / f"assets_{job_id}.prj").write_text(
            'GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",'
            'SPHEROID["WGS_1984",6378137.0,298.257223563]],'
            'PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]]'
        )

        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
            for ext in (".shp", ".shx", ".dbf", ".prj"):
                f = Path(tmp) / f"assets_{job_id}{ext}"
                if f.exists():
                    zf.write(f, f.name)

    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=assets_{job_id}.zip"},
    )


# ────────────────────────────────────────── mock DIGIT Urban Asset Registry ──

_DIGIT_CATEGORY_MAP = {
    "building":  "BUILDING",
    "road":      "ROAD",
    "water":     "WATER_BODY",
    "tree":      "TREE",
    "park":      "PARK",
    "drain":     "DRAIN",
    "vehicle":   "VEHICLE",
}

@app.post("/api/digit/push/{job_id}")
def digit_push(job_id: str):
    if job_id not in _jobs:
        raise HTTPException(404, "Job not found")

    job = _jobs[job_id]
    assets = []
    for det in job.get("detections", []):
        c = det.get("centroid", {})
        assets.append({
            "tenantId":      "in.railways",
            "assetId":       det["id"],
            "assetCategory": _DIGIT_CATEGORY_MAP.get(det["category"], det["category"].upper()),
            "assetStatus":   "ACTIVE",
            "source":        "DRISHYA_AI",
            "confidence":    det["confidence"],
            "areaSqm":       det.get("area_sqm"),
            "geoLocation": {
                "latitude":  c.get("lat"),
                "longitude": c.get("lon"),
            },
        })

    return {
        "responseInfo": {"status": "SUCCESSFUL", "apiId": "asset-registry", "ver": "v1"},
        "registryId":   f"DRISHYA-{job_id.upper()}",
        "pushed":       len(assets),
        "endpoint":     "https://digit.org/api/asset-registry/v1/assets (mock)",
        "assets":       assets[:10],
    }


# Serve the React SPA for all non-API paths (must be mounted last)
_STATIC = Path("static")
if _STATIC.exists():
    app.mount("/", StaticFiles(directory="static", html=True), name="spa")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
