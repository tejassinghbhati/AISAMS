import uuid
import shutil
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles

from detector import SpatialAssetDetector
from change import ChangeDetector
from geo import build_geojson, build_csv

app = FastAPI(title="AI Spatial Asset Management System", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path("uploads")
RESULTS_DIR = Path("results")
UPLOAD_DIR.mkdir(exist_ok=True)
RESULTS_DIR.mkdir(exist_ok=True)

app.mount("/results", StaticFiles(directory="results"), name="results")

detector = SpatialAssetDetector()
change_detector = ChangeDetector()

# In-memory store — sufficient for a demo/hackathon
_jobs: dict = {}

ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".tif", ".tiff"}


def _save_upload(file: UploadFile, stem: str) -> Path:
    suffix = Path(file.filename).suffix.lower()
    if suffix not in ALLOWED_EXT:
        raise HTTPException(400, f"Unsupported format: {suffix}")
    path = UPLOAD_DIR / f"{stem}{suffix}"
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return path


@app.get("/api/health")
def health():
    return {"status": "ok", "yolo_available": detector.yolo_available}


@app.post("/api/detect")
async def detect_assets(
    file: UploadFile = File(...),
    gsd_m: Optional[float] = Form(0.5),
    lat: Optional[float] = Form(None),
    lon: Optional[float] = Form(None),
):
    job_id = uuid.uuid4().hex[:8]
    img_path = _save_upload(file, job_id)
    out_dir = RESULTS_DIR / job_id
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


@app.post("/api/change")
async def detect_changes(
    before: UploadFile = File(...),
    after: UploadFile = File(...),
    gsd_m: Optional[float] = Form(0.5),
):
    job_id = uuid.uuid4().hex[:8]
    before_path = _save_upload(before, f"{job_id}_before")
    after_path  = _save_upload(after,  f"{job_id}_after")
    out_dir = RESULTS_DIR / job_id
    out_dir.mkdir(parents=True, exist_ok=True)

    try:
        result = change_detector.detect_changes(
            str(before_path), str(after_path), job_id, str(out_dir)
        )
        _jobs[job_id] = result
        return result
    except Exception as exc:
        raise HTTPException(500, str(exc))


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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
