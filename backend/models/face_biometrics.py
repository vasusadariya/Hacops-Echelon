from fastapi import APIRouter, HTTPException
from typing import List
from pydantic import BaseModel, HttpUrl
from PIL import Image
from datetime import datetime
import numpy as np
import torch
import io
import httpx

from transformers.models.auto.image_processing_auto import AutoImageProcessor
from transformers import SiglipForImageClassification

router = APIRouter(prefix="/face", tags=["Face Biometrics"])

MODEL_NAME = "prithivMLmods/deepfake-detector-model-v1"

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

model = SiglipForImageClassification.from_pretrained(MODEL_NAME).to(device)
processor = AutoImageProcessor.from_pretrained(MODEL_NAME)
model.eval()

# -------------------------
# Request schema
# -------------------------
class FaceVerifyRequest(BaseModel):
    frame_urls: List[HttpUrl]


# -------------------------
# Core inference functions
# -------------------------
def predict_single_image(image: Image.Image) -> float:
    image = image.convert("RGB")
    inputs = processor(images=image, return_tensors="pt")

    inputs = {k: v.to(device) for k, v in inputs.items()}

    with torch.no_grad():
        outputs = model(**inputs)
        probs = torch.nn.functional.softmax(outputs.logits, dim=1).squeeze()

    # index 0 = fake, index 1 = real
    return probs[0].item()


def predict_multiple_frames(images: List[Image.Image]) -> dict:
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


# -------------------------
# Helper: fetch image from URL
# -------------------------
async def fetch_image(url: str) -> Image.Image:
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url)
            resp.raise_for_status()

        image = Image.open(io.BytesIO(resp.content)).convert("RGB")
        return image

    except Exception:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to load image from URL: {url}"
        )


# -------------------------
# API endpoint
# -------------------------
@router.post("/verify")
async def verify_face(payload: FaceVerifyRequest):
    frame_urls = payload.frame_urls

    if len(frame_urls) != 4:
        raise HTTPException(
            status_code=400,
            detail="Exactly 4 face frames are required"
        )

    images: List[Image.Image] = []

    for url in frame_urls:
        image = await fetch_image(str(url))
        images.append(image)

    result = predict_multiple_frames(images)

    return {
        "biometric_type": "face",
        "model": MODEL_NAME,
        "timestamp": datetime.utcnow().isoformat(),
        "result": result
    }
