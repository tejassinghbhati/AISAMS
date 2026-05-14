"""
Train DeepLabV3-MobileNetV3 on the DeepGlobe Land Cover dataset.

Usage
-----
  python train_segmentation.py --data "e:/Hackzilla 2026" --epochs 15 --batch 8

The trained model is saved to:
  backend/segmentation/deepglobe_seg.pt

Typical runtime on RTX 2050 (4GB): ~35-45 minutes for 15 epochs.
"""

import argparse
import time
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR

from segmentation.dataset import DeepGlobeDataset, NUM_CLASSES, CLASS_NAMES
from segmentation.model import build_model

SAVE_PATH = Path("segmentation/deepglobe_seg.pt")


# ── Loss: CrossEntropy + Dice ───────────────────────────────────────────────

def dice_loss(pred, target, smooth=1.0):
    pred   = torch.softmax(pred, dim=1)
    target_oh = torch.zeros_like(pred).scatter_(1, target.unsqueeze(1), 1)
    inter  = (pred * target_oh).sum(dim=(2, 3))
    union  = pred.sum(dim=(2, 3)) + target_oh.sum(dim=(2, 3))
    dice   = (2 * inter + smooth) / (union + smooth)
    return 1 - dice.mean()


# ── mIoU metric ─────────────────────────────────────────────────────────────

def compute_miou(preds, targets, n_classes=NUM_CLASSES):
    ious = []
    preds   = preds.view(-1)
    targets = targets.view(-1)
    for cls in range(n_classes):
        p = (preds == cls)
        t = (targets == cls)
        inter = (p & t).sum().item()
        union = (p | t).sum().item()
        if union > 0:
            ious.append(inter / union)
    return float(np.mean(ious)) if ious else 0.0


# ── Training loop ────────────────────────────────────────────────────────────

def train(data_root: str, epochs: int, batch: int, lr: float):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"\n  Device : {device}")
    if device.type == "cuda":
        print(f"  GPU    : {torch.cuda.get_device_name(0)}")

    # Datasets
    train_ds = DeepGlobeDataset(data_root, split="train")
    val_ds   = DeepGlobeDataset(data_root, split="valid")
    print(f"  Train  : {len(train_ds)} samples")
    print(f"  Valid  : {len(val_ds)} samples")

    train_loader = DataLoader(train_ds, batch_size=batch, shuffle=True,
                              num_workers=2, pin_memory=True)
    val_loader   = DataLoader(val_ds,   batch_size=batch, shuffle=False,
                              num_workers=2, pin_memory=True)

    model = build_model(pretrained=True).to(device)
    optimizer = AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = CosineAnnealingLR(optimizer, T_max=epochs, eta_min=lr * 0.01)
    ce_loss   = nn.CrossEntropyLoss(ignore_index=255)

    best_miou = 0.0
    SAVE_PATH.parent.mkdir(exist_ok=True)

    for epoch in range(1, epochs + 1):
        # ── Train ──
        model.train()
        t0 = time.time()
        total_loss = 0.0
        for imgs, masks in train_loader:
            imgs, masks = imgs.to(device), masks.to(device)
            out  = model(imgs)["out"]
            loss = ce_loss(out, masks) + 0.5 * dice_loss(out, masks)
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            total_loss += loss.item()

        scheduler.step()
        avg_loss = total_loss / len(train_loader)

        # ── Validate ──
        model.eval()
        all_preds, all_tgts = [], []
        with torch.no_grad():
            for imgs, masks in val_loader:
                imgs = imgs.to(device)
                out  = model(imgs)["out"]
                pred = out.argmax(dim=1).cpu()
                all_preds.append(pred)
                all_tgts.append(masks)
        all_preds = torch.cat(all_preds)
        all_tgts  = torch.cat(all_tgts)
        miou = compute_miou(all_preds, all_tgts)

        elapsed = time.time() - t0
        print(f"  Epoch {epoch:2d}/{epochs}  loss={avg_loss:.4f}  mIoU={miou:.3f}  ({elapsed:.0f}s)")

        if miou > best_miou:
            best_miou = miou
            torch.save(model.state_dict(), SAVE_PATH)
            print(f"    ✓ Saved best model (mIoU={best_miou:.3f})")

    print(f"\n  Training complete. Best mIoU: {best_miou:.3f}")
    print(f"  Model saved to: {SAVE_PATH}\n")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--data",   default="e:/Hackzilla 2026",
                    help="Root directory containing train/ valid/ test/ folders")
    ap.add_argument("--epochs", type=int, default=15)
    ap.add_argument("--batch",  type=int, default=8)
    ap.add_argument("--lr",     type=float, default=3e-4)
    args = ap.parse_args()

    print("\n  DeepGlobe Land Cover — Segmentation Training")
    print("  ─────────────────────────────────────────────")
    train(args.data, args.epochs, args.batch, args.lr)
