"""Segmentation inference: image → class mask + stats."""

import io
import base64
import numpy as np
from pathlib import Path
from PIL import Image
import torch
import torchvision.transforms.functional as TF

from .dataset import (
    NUM_CLASSES, CLASS_NAMES, CLASS_HEX, tensor_to_rgb, COLOR_TO_CLASS
)
from .model import MODEL_PATH

INFER_SIZE = 512

_model = None
_device = None


def _load():
    global _model, _device
    if _model is not None:
        return
    from .model import load_model
    _device = "cuda" if torch.cuda.is_available() else "cpu"
    model_path = Path(__file__).parent.parent / MODEL_PATH
    _model = load_model(str(model_path), device=_device)


def segment_image(img_path: str, out_dir: str) -> dict:
    """
    Run segmentation on img_path.
    Returns dict with:
      - seg_url: path to saved RGB segmentation PNG
      - overlay_url: path to saved blended overlay PNG
      - class_stats: [{class_name, hex, area_pct, area_sqm}]
      - class_mask_b64: base64-encoded grayscale class index PNG
    """
    _load()

    img = Image.open(img_path).convert("RGB")
    orig_w, orig_h = img.size

    # Preprocess
    resized = img.resize((INFER_SIZE, INFER_SIZE), Image.BILINEAR)
    t = TF.to_tensor(resized)
    t = TF.normalize(t, mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    t = t.unsqueeze(0).to(_device)

    with torch.no_grad():
        out  = _model(t)["out"]
        pred = out.argmax(dim=1).squeeze(0).cpu()  # (512, 512)

    # Back to original resolution
    pred_np = pred.numpy().astype(np.uint8)
    pred_full = np.array(
        Image.fromarray(pred_np).resize((orig_w, orig_h), Image.NEAREST)
    )

    # RGB segmentation map
    seg_rgb = tensor_to_rgb(torch.from_numpy(pred_full))
    seg_img = Image.fromarray(seg_rgb)

    # Overlay (blend original + seg)
    seg_rgba = seg_img.convert("RGBA")
    seg_rgba.putalpha(160)
    orig_rgba = img.convert("RGBA")
    overlay = Image.alpha_composite(orig_rgba, seg_rgba).convert("RGB")

    # Save outputs
    out_path = Path(out_dir)
    out_path.mkdir(parents=True, exist_ok=True)
    seg_path = out_path / "seg_mask.png"
    ov_path  = out_path / "seg_overlay.jpg"
    seg_img.save(seg_path)
    overlay.save(ov_path, quality=92)

    # Per-class stats
    total_px = pred_full.size
    stats = []
    for cls_idx in range(NUM_CLASSES):
        px = int((pred_full == cls_idx).sum())
        if px == 0:
            continue
        stats.append({
            "class_id":   cls_idx,
            "class_name": CLASS_NAMES[cls_idx],
            "hex":        CLASS_HEX[cls_idx],
            "area_pct":   round(px / total_px * 100, 2),
            "pixel_count": px,
        })
    stats.sort(key=lambda x: x["area_pct"], reverse=True)

    # Class index mask as base64 (for frontend canvas overlay)
    idx_img = Image.fromarray(pred_np)  # 512×512 grayscale class indices
    buf = io.BytesIO()
    idx_img.save(buf, format="PNG")
    mask_b64 = base64.b64encode(buf.getvalue()).decode()

    return {
        "seg_url":        str(seg_path).replace("\\", "/"),
        "overlay_url":    str(ov_path).replace("\\", "/"),
        "class_stats":    stats,
        "class_mask_b64": mask_b64,
        "seg_size":       INFER_SIZE,
    }
