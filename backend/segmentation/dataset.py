"""
segmentation/dataset.py — DeepGlobe Land Cover dataset loader.

Dataset structure expected on disk
-----------------------------------
<root>/
  train/
    <id>_sat.jpg    — WorldView satellite image (2448×2448 px)
    <id>_mask.png   — RGB segmentation mask (same size)
  valid/
    ...

Colour → class mapping  (DeepGlobe challenge convention)
---------------------------------------------------------
  (0,   0,   0)   → 0  Background / Unknown
  (0,   0,   255) → 1  Water
  (0,   255, 0)   → 2  Forest
  (0,   255, 255) → 3  Urban / Built-up
  (255, 0,   255) → 4  Rangeland
  (255, 255, 0)   → 5  Agriculture
  (255, 255, 255) → 6  Barren land

Training augmentations (train split only)
-----------------------------------------
  - Resize to 1024×1024, then random 512×512 crop
  - Random horizontal flip (p=0.5)
  - Random vertical flip (p=0.5)
  ImageNet normalisation applied to the satellite image tensor.

Key exports
-----------
DeepGlobeDataset   — torch Dataset class
mask_to_tensor()   — RGB mask PIL Image → class-index LongTensor (H, W)
tensor_to_rgb()    — class-index tensor → RGB numpy array (for visualisation)
CLASS_NAMES, CLASS_HEX, NUM_CLASSES  — used by inference and the API
"""

import os
import numpy as np
from pathlib import Path
from PIL import Image
import torch
from torch.utils.data import Dataset
import torchvision.transforms.functional as TF
import random

# RGB mask color → class index
COLOR_TO_CLASS = {
    (0,   0,   0):   0,  # Background / Unknown
    (0,   0,   255): 1,  # Water
    (0,   255, 0):   2,  # Forest
    (0,   255, 255): 3,  # Urban / Built-up
    (255, 0,   255): 4,  # Rangeland / Vegetation
    (255, 255, 0):   5,  # Agriculture
    (255, 255, 255): 6,  # Barren land
}

CLASS_TO_COLOR = {v: k for k, v in COLOR_TO_CLASS.items()}

CLASS_NAMES = [
    "Background",
    "Water",
    "Forest",
    "Urban",
    "Rangeland",
    "Agriculture",
    "Barren",
]

# Colors for frontend display (hex)
CLASS_HEX = [
    "#1e293b",  # Background   — dark slate
    "#1f6feb",  # Water        — blue
    "#22863a",  # Forest       — green
    "#0ea5e9",  # Urban        — cyan/sky
    "#a855f7",  # Rangeland    — purple
    "#eab308",  # Agriculture  — yellow
    "#94a3b8",  # Barren       — slate
]

NUM_CLASSES = len(CLASS_NAMES)
CROP_SIZE   = 512


def mask_to_tensor(mask_img: Image.Image) -> torch.Tensor:
    """Convert RGB mask PNG to class-index LongTensor (H, W)."""
    arr = np.array(mask_img.convert("RGB"))
    out = np.zeros(arr.shape[:2], dtype=np.int64)
    for rgb, cls in COLOR_TO_CLASS.items():
        match = (arr[:, :, 0] == rgb[0]) & (arr[:, :, 1] == rgb[1]) & (arr[:, :, 2] == rgb[2])
        out[match] = cls
    return torch.from_numpy(out)


def tensor_to_rgb(tensor: torch.Tensor) -> np.ndarray:
    """Convert class-index tensor (H, W) back to RGB numpy array."""
    h, w = tensor.shape
    out = np.zeros((h, w, 3), dtype=np.uint8)
    for cls, rgb in CLASS_TO_COLOR.items():
        mask = tensor.numpy() == cls
        out[mask] = rgb
    return out


class DeepGlobeDataset(Dataset):
    def __init__(self, root: str, split: str = "train", crop_size: int = CROP_SIZE):
        self.root      = Path(root)
        self.split     = split
        self.crop_size = crop_size
        self.augment   = (split == "train")

        dir_path = self.root / split
        all_files = list(dir_path.glob("*_sat.jpg"))
        self.samples = []
        for sat_path in sorted(all_files):
            stem = sat_path.stem.replace("_sat", "")
            mask_path = dir_path / f"{stem}_mask.png"
            if mask_path.exists():
                self.samples.append((sat_path, mask_path))

        if not self.samples:
            raise FileNotFoundError(f"No sat/mask pairs found in {dir_path}")

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        sat_path, mask_path = self.samples[idx]
        img  = Image.open(sat_path).convert("RGB")
        mask = Image.open(mask_path).convert("RGB")

        # Resize to manageable size first
        img  = img.resize((1024, 1024), Image.BILINEAR)
        mask = mask.resize((1024, 1024), Image.NEAREST)

        if self.augment:
            # Random crop
            i = random.randint(0, 1024 - self.crop_size)
            j = random.randint(0, 1024 - self.crop_size)
            img  = TF.crop(img,  i, j, self.crop_size, self.crop_size)
            mask = TF.crop(mask, i, j, self.crop_size, self.crop_size)
            # Random flip
            if random.random() > 0.5:
                img  = TF.hflip(img)
                mask = TF.hflip(mask)
            if random.random() > 0.5:
                img  = TF.vflip(img)
                mask = TF.vflip(mask)
        else:
            img  = img.resize((self.crop_size, self.crop_size), Image.BILINEAR)
            mask = mask.resize((self.crop_size, self.crop_size), Image.NEAREST)

        img_t  = TF.to_tensor(img)
        img_t  = TF.normalize(img_t, mean=[0.485, 0.456, 0.406],
                                      std=[0.229, 0.224, 0.225])
        mask_t = mask_to_tensor(mask)
        return img_t, mask_t
