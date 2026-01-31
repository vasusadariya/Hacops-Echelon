from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
from PIL import Image
import io
from datetime import datetime
import numpy as np
import torch

from transformers import AutoImageProcessor, SiglipForImageClassification

router = APIRouter(prefix="/face", tags=["Face Biometrics"])

MODEL_NAME = "prithivMLmods/deepfake-detector-model-v1"

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

model = SiglipForImageClassification.from_pretrained(MODEL_NAME).to(device)
processor = AutoImageProcessor.from_pretrained(MODEL_NAME)
model.eval()

def predict_single_image(image: Image.Image) -> float:
    """
    Returns fake probability for a single image
    """
    image = image.convert("RGB")
    inputs = processor(images=image, return_tensors="pt").to(device)

    with torch.no_grad():
        outputs = model(**inputs)
        probs = torch.nn.functional.softmax(outputs.logits, dim=1).squeeze()

    # index 0 = fake, index 1 = real
    return probs[0].item()


def predict_multiple_frames(images: List[Image.Image]) -> dict:
    """
    Aggregate predictions across multiple frames using MEDIAN
    """
    fake_probs = [predict_single_image(img) for img in images]

    median_fake = float(np.median(fake_probs))
    real_prob = 1.0 - median_fake

    if median_fake < 0.30:
        decision = "PASS"
    elif median_fake < 0.60:
        decision = "REVIEW"
    else:
        decision = "SUSPECT"

    return {
        "num_frames": len(images),
        "fake_probability": round(median_fake, 4),
        "real_probability": round(real_prob, 4),
        "decision": decision
    }

@router.post("/verify")
async def verify_face(
    frames: List[UploadFile] = File(...)
):
    if len(frames) < 3:
        raise HTTPException(
            status_code=400,
            detail="At least 3 frames are required"
        )

    images = []

    for file in frames:
        if file.content_type not in ["image/jpeg", "image/png"]:
            raise HTTPException(
                status_code=400,
                detail="Only JPG and PNG images are allowed"
            )

        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        images.append(image)

    # Run deepfake / liveness model
    result = predict_multiple_frames(images)

    return {
        "biometric_type": "face",
        "model": MODEL_NAME,
        "timestamp": datetime.utcnow().isoformat(),
        "result": result
    }
