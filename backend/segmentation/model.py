"""Segmentation model: DeepLabV3-MobileNetV3 fine-tuned on DeepGlobe."""

import torch
import torch.nn as nn
from torchvision.models.segmentation import (
    deeplabv3_mobilenet_v3_large,
    DeepLabV3_MobileNet_V3_Large_Weights,
)
from .dataset import NUM_CLASSES

MODEL_PATH = "segmentation/deepglobe_seg.pt"


def build_model(pretrained: bool = True) -> nn.Module:
    weights = DeepLabV3_MobileNet_V3_Large_Weights.DEFAULT if pretrained else None
    model = deeplabv3_mobilenet_v3_large(weights=weights, aux_loss=True)
    # Replace final classifiers for NUM_CLASSES
    model.classifier[4]     = nn.Conv2d(256, NUM_CLASSES, kernel_size=1)
    model.aux_classifier[4] = nn.Conv2d(10,  NUM_CLASSES, kernel_size=1)
    return model


def load_model(path: str = MODEL_PATH, device: str = "cpu") -> nn.Module:
    model = build_model(pretrained=False)
    state = torch.load(path, map_location=device, weights_only=True)
    model.load_state_dict(state)
    model.to(device)
    model.eval()
    return model
