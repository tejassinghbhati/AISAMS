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

# Segmentation (loaded lazily after training)
_seg_available = False
try:
    from segmentation.inference import segment_image as _seg_infer
    from segmentation.dataset import CLASS_NAMES, CLASS_HEX, NUM_CLASSES
    _seg_available = (Path("segmentation/deepglobe_seg.pt")).exists()
except ImportError:
    pass

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
    return {"status": "ok", "yolo_available": detector.yolo_available}


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
    return {
        "available": _seg_available,
        "model_path": "segmentation/deepglobe_seg.pt",
        "classes": CLASS_NAMES if _seg_available else [],
        "class_colors": CLASS_HEX if _seg_available else [],
    }


@app.post("/api/segment")
async def segment_assets(
    file: UploadFile = File(...),
):
    if not _seg_available:
        raise HTTPException(503, "Segmentation model not trained yet. Run: python train_segmentation.py --data <path>")

    job_id   = uuid.uuid4().hex[:8]
    img_path = _save_upload(file, f"seg_{job_id}")
    out_dir  = RESULTS_DIR / job_id
    out_dir.mkdir(parents=True, exist_ok=True)

    try:
        result = _seg_infer(str(img_path), str(out_dir))
        result["job_id"] = job_id
        # Rewrite paths to served URLs
        result["seg_url"]     = f"/results/{job_id}/seg_mask.png"
        result["overlay_url"] = f"/results/{job_id}/seg_overlay.jpg"
        _jobs[job_id] = result
        return result
    except Exception as exc:
        raise HTTPException(500, str(exc))


@app.post("/api/samples/{filename}/segment")
def segment_sample(filename: str):
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


# Serve the React SPA for all non-API paths (must be mounted last)
_STATIC = Path("static")
if _STATIC.exists():
    app.mount("/", StaticFiles(directory="static", html=True), name="spa")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
