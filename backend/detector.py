import cv2
import math
import uuid
import numpy as np
from pathlib import Path
from typing import Optional

try:
    from ultralytics import YOLO
    _YOLO_OK = True
except ImportError:
    _YOLO_OK = False

# BGR colors for OpenCV annotation
_CAT_BGR = {
    "building": (60,  60, 220),
    "tree":     (34, 139,  34),
    "park":     (50, 205,  50),
    "water":    (205, 100,  40),
    "road":     (130, 130, 130),
    "drain":    (0,  165, 255),
    "vehicle":  (160,   0, 160),
}

# Hex colors sent to the frontend
CAT_HEX = {
    "building": "#dc3545",
    "tree":     "#22863a",
    "park":     "#28a745",
    "water":    "#1f6feb",
    "road":     "#8b949e",
    "drain":    "#e36209",
    "vehicle":  "#8957e5",
}

VEHICLE_COCO = {2: "car", 3: "motorcycle", 5: "bus", 7: "truck"}


class SpatialAssetDetector:
    def __init__(self):
        self.yolo = None
        self.yolo_available = False
        self._loaded = False

    def _ensure_yolo(self):
        if self._loaded:
            return
        self._loaded = True
        if _YOLO_OK:
            try:
                self.yolo = YOLO("yolov8n.pt")
                self.yolo_available = True
                print("[detector] YOLOv8n loaded")
            except Exception as exc:
                print(f"[detector] YOLOv8 unavailable: {exc}")

    # ------------------------------------------------------------------ public

    def detect(
        self,
        img_path: str,
        gsd_m: float = 0.5,
        lat: Optional[float] = None,
        lon: Optional[float] = None,
        job_id: str = "",
        out_dir: str = "results",
    ) -> dict:
        self._ensure_yolo()
        img = cv2.imread(img_path)
        if img is None:
            raise ValueError(f"Cannot read image: {img_path}")

        H, W = img.shape[:2]
        detections: list = []
        detections += self._color_segment(img, gsd_m, lat, lon, W, H)
        if self.yolo:
            detections += self._yolo_detect(img, gsd_m, lat, lon, W, H)

        Path(out_dir).mkdir(parents=True, exist_ok=True)
        ann_path = str(Path(out_dir) / "annotated.jpg")
        self._draw(img.copy(), detections, ann_path)

        return {
            "job_id": job_id,
            "image_width": W,
            "image_height": H,
            "gsd_m": gsd_m,
            "origin": {"lat": lat, "lon": lon} if lat and lon else None,
            "detections": detections,
            "summary": self._summarize(detections),
            "annotated_url": f"/results/{job_id}/annotated.jpg",
        }

    # ----------------------------------------------------------------- private

    def _color_segment(self, img, gsd_m, lat, lon, W, H):
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        dets = []

        # ── Water ────────────────────────────────────────────────────────────
        water_mask = cv2.inRange(hsv, np.array([95, 50, 20]), np.array([135, 255, 210]))
        dets += self._mask_to_dets(water_mask, "water", 500, gsd_m, lat, lon, W, H)

        # ── Vegetation → split into trees (small) and parks (large) ──────────
        veg_mask = cv2.inRange(hsv, np.array([35, 40, 20]), np.array([85, 255, 200]))
        k5 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        veg_clean = cv2.morphologyEx(veg_mask, cv2.MORPH_OPEN, k5)
        cnts, _ = cv2.findContours(veg_clean, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for cnt in cnts:
            area_px = cv2.contourArea(cnt)
            if area_px < 120:
                continue
            cat = "park" if area_px > 6000 else "tree"
            x, y, bw, bh = cv2.boundingRect(cnt)
            conf = min(0.95, 0.62 + area_px / (W * H) * 6)
            dets.append(self._make(cat, x, y, bw, bh, conf, area_px, gsd_m, lat, lon, W, H))

        # ── Roads (gray, low-saturation, NOT water/veg) ───────────────────────
        road_raw = cv2.inRange(hsv, np.array([0, 0, 80]), np.array([180, 30, 180]))
        road_raw = cv2.bitwise_and(road_raw, cv2.bitwise_not(water_mask))
        road_raw = cv2.bitwise_and(road_raw, cv2.bitwise_not(veg_mask))
        dets += self._mask_to_dets(road_raw, "road", 800, gsd_m, lat, lon, W, H, min_aspect=2.0)

        # ── Buildings (bright + structured + not water/veg) ───────────────────
        _, bright = cv2.threshold(gray, 185, 255, cv2.THRESH_BINARY)
        low_sat = cv2.inRange(hsv, np.array([0, 0, 170]), np.array([180, 55, 255]))
        bld_mask = cv2.bitwise_and(bright, low_sat)
        bld_mask = cv2.bitwise_and(bld_mask, cv2.bitwise_not(water_mask))
        bld_mask = cv2.bitwise_and(bld_mask, cv2.bitwise_not(veg_mask))
        k3 = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        bld_mask = cv2.morphologyEx(bld_mask, cv2.MORPH_CLOSE, k3)
        bld_mask = cv2.morphologyEx(bld_mask, cv2.MORPH_OPEN, k3)
        b_cnts, _ = cv2.findContours(bld_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for cnt in b_cnts:
            area_px = cv2.contourArea(cnt)
            if area_px < 250:
                continue
            x, y, bw, bh = cv2.boundingRect(cnt)
            if max(bw, bh) / max(min(bw, bh), 1) > 8:
                continue
            conf = min(0.92, 0.58 + area_px / (W * H) * 6)
            dets.append(self._make("building", x, y, bw, bh, conf, area_px, gsd_m, lat, lon, W, H))

        # ── Drains (dark, elongated) ──────────────────────────────────────────
        dark = cv2.inRange(hsv, np.array([0, 0, 0]), np.array([180, 80, 65]))
        dark = cv2.bitwise_and(dark, cv2.bitwise_not(water_mask))
        kH = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 15))
        kV = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 3))
        drain_mask = cv2.bitwise_or(
            cv2.morphologyEx(dark, cv2.MORPH_OPEN, kH),
            cv2.morphologyEx(dark, cv2.MORPH_OPEN, kV),
        )
        dets += self._mask_to_dets(drain_mask, "drain", 300, gsd_m, lat, lon, W, H, min_aspect=2.5)

        return dets

    def _mask_to_dets(self, mask, cat, min_px, gsd_m, lat, lon, W, H, min_aspect=None):
        k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, k)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, k)
        cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        dets = []
        for cnt in cnts:
            area_px = cv2.contourArea(cnt)
            if area_px < min_px:
                continue
            x, y, bw, bh = cv2.boundingRect(cnt)
            if min_aspect:
                if max(bw, bh) / max(min(bw, bh), 1) < min_aspect:
                    continue
            conf = min(0.95, 0.60 + area_px / (W * H) * 5)
            dets.append(self._make(cat, x, y, bw, bh, conf, area_px, gsd_m, lat, lon, W, H))
        return dets

    def _make(self, cat, x, y, bw, bh, conf, area_px, gsd_m, lat, lon, W, H):
        area_sqm = area_px * (gsd_m ** 2)
        centroid = self._px2geo(x + bw / 2, y + bh / 2, lat, lon, W, H, gsd_m)
        geometry = None
        if lat and lon:
            corners = [
                self._px2geo(x,      y,      lat, lon, W, H, gsd_m),
                self._px2geo(x + bw, y,      lat, lon, W, H, gsd_m),
                self._px2geo(x + bw, y + bh, lat, lon, W, H, gsd_m),
                self._px2geo(x,      y + bh, lat, lon, W, H, gsd_m),
            ]
            coords = [[c["lon"], c["lat"]] for c in corners]
            coords.append(coords[0])
            geometry = {"type": "Polygon", "coordinates": [coords]}
        return {
            "id": uuid.uuid4().hex[:8],
            "category": cat,
            "color": CAT_HEX.get(cat, "#888888"),
            "confidence": round(conf, 3),
            "bbox": {"x": x, "y": y, "w": bw, "h": bh},
            "area_sqm": round(area_sqm, 1),
            "centroid": centroid,
            "geometry": geometry,
        }

    def _yolo_detect(self, img, gsd_m, lat, lon, W, H):
        results = self.yolo(img, verbose=False)[0]
        dets = []
        if results.boxes is None:
            return dets
        for box in results.boxes:
            cls = int(box.cls[0])
            if cls not in VEHICLE_COCO:
                continue
            conf = float(box.conf[0])
            if conf < 0.30:
                continue
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            bw, bh = x2 - x1, y2 - y1
            d = self._make("vehicle", x1, y1, bw, bh, conf, bw * bh, gsd_m, lat, lon, W, H)
            d["sub_type"] = VEHICLE_COCO[cls]
            dets.append(d)
        return dets

    def _px2geo(self, px, py, lat, lon, W, H, gsd_m):
        if lat is None or lon is None:
            return {"lat": None, "lon": None}
        dx = (px - W / 2) * gsd_m
        dy = (py - H / 2) * gsd_m
        dlat = -dy / 111_111.0
        dlon = dx / (111_111.0 * math.cos(math.radians(lat)))
        return {"lat": round(lat + dlat, 7), "lon": round(lon + dlon, 7)}

    def _draw(self, img, detections, path):
        for det in detections:
            color = _CAT_BGR.get(det["category"], (200, 200, 200))
            b = det["bbox"]
            x, y, bw, bh = b["x"], b["y"], b["w"], b["h"]
            ov = img.copy()
            cv2.rectangle(ov, (x, y), (x + bw, y + bh), color, -1)
            img = cv2.addWeighted(ov, 0.18, img, 0.82, 0)
            cv2.rectangle(img, (x, y), (x + bw, y + bh), color, 2)
            label = f"{det['category']} {det['confidence']:.0%}"
            (lw, lh), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.42, 1)
            cv2.rectangle(img, (x, y - lh - 8), (x + lw + 4, y), color, -1)
            cv2.putText(img, label, (x + 2, y - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (255, 255, 255), 1)
        cv2.imwrite(path, img)

    def _summarize(self, detections):
        by_cat: dict = {}
        for d in detections:
            c = d["category"]
            if c not in by_cat:
                by_cat[c] = {"count": 0, "total_area_sqm": 0.0, "avg_confidence": 0.0, "_cs": 0.0}
            by_cat[c]["count"] += 1
            by_cat[c]["total_area_sqm"] += d.get("area_sqm", 0)
            by_cat[c]["_cs"] += d.get("confidence", 0)
        for c in by_cat:
            n = by_cat[c]["count"]
            by_cat[c]["avg_confidence"] = round(by_cat[c]["_cs"] / n, 3)
            by_cat[c]["total_area_sqm"] = round(by_cat[c]["total_area_sqm"], 1)
            del by_cat[c]["_cs"]
        return {"total": len(detections), "by_category": by_cat}
