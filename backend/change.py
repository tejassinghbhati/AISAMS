"""
change.py — Temporal change detection between two satellite images.

Algorithm
---------
Both images are converted to HSV colour space and three binary masks are
computed per image: vegetation (hue 35-85), bright surfaces (value > 185,
low saturation — proxy for buildings/concrete), and water (hue 95-135).

Four change types are derived by comparing before/after masks:

  new_construction  — bright pixels in "after" that were NOT bright in "before"
  vegetation_loss   — vegetation pixels in "before" that are gone in "after"
  new_water         — water pixels in "after" that were NOT water in "before"
  encroachment      — pixels that were vegetation in "before" AND bright in "after"
                      (vegetation replaced by built surface — strongest encroachment signal)

Each raw difference mask is cleaned with morphological close + open (7×7 kernel)
to remove noise, then contours below 400 px² are discarded as artefacts.

Outputs saved to out_dir/
  change_overlay.jpg  — "after" image with coloured bounding boxes
  comparison.jpg      — side-by-side: before | after | overlay
"""

import cv2
import numpy as np
from pathlib import Path


class ChangeDetector:
    def detect_changes(self, before_path: str, after_path: str, job_id: str, out_dir: str) -> dict:
        """
        Compare two images and return detected changes with bounding boxes.

        Parameters
        ----------
        before_path : path to the earlier (reference) image
        after_path  : path to the later (query) image
        job_id      : unique identifier used to build result URLs
        out_dir     : directory where output images are saved

        Returns
        -------
        dict with keys: job_id, changes (list), total_changes, change_summary,
        overlay_url, comparison_url
        """
        before = cv2.imread(before_path)
        after = cv2.imread(after_path)
        if before is None or after is None:
            raise ValueError("Cannot read one or both images")

        h, w = before.shape[:2]
        after = cv2.resize(after, (w, h))

        b_hsv = cv2.cvtColor(before, cv2.COLOR_BGR2HSV)
        a_hsv = cv2.cvtColor(after, cv2.COLOR_BGR2HSV)

        overlay = after.copy()
        all_changes = []

        b_veg = cv2.inRange(b_hsv, np.array([35, 40, 20]), np.array([85, 255, 200]))
        a_veg = cv2.inRange(a_hsv, np.array([35, 40, 20]), np.array([85, 255, 200]))
        b_bright = cv2.inRange(b_hsv, np.array([0, 0, 185]), np.array([180, 50, 255]))
        a_bright = cv2.inRange(a_hsv, np.array([0, 0, 185]), np.array([180, 50, 255]))
        b_water = cv2.inRange(b_hsv, np.array([95, 50, 20]), np.array([135, 255, 210]))
        a_water = cv2.inRange(a_hsv, np.array([95, 50, 20]), np.array([135, 255, 210]))

        k = cv2.getStructuringElement(cv2.MORPH_RECT, (7, 7))

        specs = [
            ("new_construction", cv2.bitwise_and(a_bright, cv2.bitwise_not(b_bright)), (0, 0, 220)),
            ("vegetation_loss",  cv2.bitwise_and(b_veg,    cv2.bitwise_not(a_veg)),    (0, 140, 255)),
            ("new_water",        cv2.bitwise_and(a_water,  cv2.bitwise_not(b_water)),  (200, 80, 0)),
            ("encroachment",     cv2.bitwise_and(b_veg,    a_bright),                  (0, 0, 255)),
        ]

        for change_type, raw_mask, color in specs:
            mask = cv2.morphologyEx(raw_mask, cv2.MORPH_CLOSE, k)
            mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, k)
            contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            for cnt in contours:
                area_px = cv2.contourArea(cnt)
                if area_px < 400:
                    continue
                x, y, bw, bh = cv2.boundingRect(cnt)
                ov2 = overlay.copy()
                cv2.rectangle(ov2, (x, y), (x + bw, y + bh), color, -1)
                overlay = cv2.addWeighted(ov2, 0.3, overlay, 0.7, 0)
                cv2.rectangle(overlay, (x, y), (x + bw, y + bh), color, 2)
                label = change_type.replace("_", " ").title()
                cv2.putText(overlay, label, (x + 2, y - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.42, color, 1)
                all_changes.append({"type": change_type, "bbox": {"x": x, "y": y, "w": bw, "h": bh}, "area_px": round(area_px)})

        Path(out_dir).mkdir(parents=True, exist_ok=True)
        cv2.imwrite(str(Path(out_dir) / "change_overlay.jpg"), overlay)
        cv2.imwrite(str(Path(out_dir) / "comparison.jpg"), np.hstack([before, after, overlay]))

        summary: dict = {}
        for c in all_changes:
            summary[c["type"]] = summary.get(c["type"], 0) + 1

        return {
            "job_id": job_id,
            "changes": all_changes,
            "total_changes": len(all_changes),
            "change_summary": summary,
            "overlay_url": f"/results/{job_id}/change_overlay.jpg",
            "comparison_url": f"/results/{job_id}/comparison.jpg",
        }
