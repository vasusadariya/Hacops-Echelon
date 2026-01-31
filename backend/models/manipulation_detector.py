import os
import io
import numpy as np
from PIL import Image, ImageChops, ImageEnhance
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl
import httpx

from tensorflow.keras.models import load_model

# ------------------------
# Router
# ------------------------
router = APIRouter(
    prefix="/manipulation",
    tags=["Image Manipulation Detection"]
)

# ------------------------
# Configuration
# ------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "trained_model.h5")

IMAGE_SIZE = (128, 128)
ELA_QUALITY = 90

# ------------------------
# Load model ONCE
# ------------------------
if not os.path.exists(MODEL_PATH):
    raise RuntimeError(f"Manipulation model not found at {MODEL_PATH}")

model = load_model(MODEL_PATH)

# ------------------------
# Request schema
# ------------------------
class ManipulationRequest(BaseModel):
    image_url: HttpUrl


# ------------------------
# Core ELA Functions
# ------------------------
def convert_to_ela_image(image: Image.Image, quality=90) -> Image.Image:
    image = image.convert("RGB")

    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=quality)
    buffer.seek(0)

    resaved = Image.open(buffer)
    ela_image = ImageChops.difference(image, resaved)

    extrema = ela_image.getextrema()
    max_diff = max(channel[1] for channel in extrema) or 1
    scale = 255.0 / max_diff

    ela_image = ImageEnhance.Brightness(ela_image).enhance(scale)
    return ela_image


def prepare_image(image: Image.Image) -> np.ndarray:
    ela_image = convert_to_ela_image(image, ELA_QUALITY)
    ela_image = ela_image.resize(IMAGE_SIZE)

    image_array = np.array(ela_image).astype("float32") / 255.0
    return image_array.reshape(-1, IMAGE_SIZE[0], IMAGE_SIZE[1], 3)


def predict_manipulation(image: Image.Image) -> dict:
    class_names = ["Forged", "Authentic"]

    test_image = prepare_image(image)
    y_pred = model.predict(test_image, verbose=0)

    raw_score = float(y_pred[0][0])
    predicted_class = int(round(raw_score))

    confidence = raw_score if predicted_class == 1 else 1 - raw_score

    return {
        "prediction": class_names[predicted_class],
        "is_authentic": predicted_class == 1,
        "confidence": round(confidence, 4),
        "raw_output": round(raw_score, 4),
        "decision": "PASS" if predicted_class == 1 else "FAIL"
    }


# ------------------------
# Helper: fetch image from URL
# ------------------------
async def fetch_image(url: str) -> Image.Image:
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(url)
            response.raise_for_status()

        return Image.open(io.BytesIO(response.content)).convert("RGB")

    except Exception:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to load image from URL: {url}"
        )


# ------------------------
# API Endpoint
# ------------------------
@router.post("/check")
async def check_manipulation(payload: ManipulationRequest):
    image = await fetch_image(str(payload.image_url))

    result = predict_manipulation(image)

    return {
        "check_type": "image_manipulation",
        "method": "ELA + CNN",
        "result": result
    }
