# ── Stage 1: build React frontend ─────────────────────────────────────────────
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Python + FastAPI backend ─────────────────────────────────────────
FROM python:3.11-slim
WORKDIR /app

# System libs required by OpenCV headless (libgl1 provides libGL.so.1)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 libsm6 libxext6 libxrender-dev libgomp1 libgl1 \
    && rm -rf /var/lib/apt/lists/*

# Limit PyTorch thread spawning to reduce memory overhead
ENV OMP_NUM_THREADS=1 \
    MKL_NUM_THREADS=1 \
    TORCH_NUM_THREADS=1

# Install CPU-only PyTorch before other deps so ultralytics reuses these
# wheels instead of pulling the CUDA variant (~1.5 GB, ~500 MB resident RAM)
RUN pip install --no-cache-dir \
    torch torchvision \
    --index-url https://download.pytorch.org/whl/cpu

# Remaining Python deps
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Backend source + model weights
COPY backend/ ./

# Pre-download YOLOv8n so the first request is not slow
RUN python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')" 2>&1 | tail -1

# React build — served by FastAPI as a SPA
COPY --from=frontend-build /app/dist ./static

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
