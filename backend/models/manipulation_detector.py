# backend/models/manipulation_detector.py

import os
import io
import numpy as np
from PIL import Image, ImageChops, ImageEnhance
from fastapi import APIRouter, UploadFile, File, HTTPException
from keras.models import load_model

# ------------------------
# Router
# ------------------------
router = APIRouter(prefix="/manipulation", tags=["Image Manipulation Detection"])

# ------------------------
# Configuration
# ------------------------
IMAGE_SIZE = (128, 128)
ELA_QUALITY = 90
MODEL_PATH = r"F:\HackOps-Ecleon\HackOps-echelon\backend\models\trained_model.h5"   # place this in backend/ or give absolute path

# ------------------------
# Load model ONCE
# ------------------------
if not os.path.exists(MODEL_PATH):
    raise RuntimeError(f"Manipulation model not found at {MODEL_PATH}")

model = load_model(MODEL_PATH)

# ------------------------
# Core ELA Functions
# ------------------------
def convert_to_ela_image(image: Image.Image, quality=90) -> Image.Image:
    """Generate Error Level Analysis (ELA) image."""
    temp_filename = "temp_ela.jpg"

    image = image.convert("RGB")
    image.save(temp_filename, "JPEG", quality=quality)
    resaved = Image.open(temp_filename)

    ela_image = ImageChops.difference(image, resaved)

    extrema = ela_image.getextrema()
    max_diff = max(channel[1] for channel in extrema) or 1
    scale = 255.0 / max_diff

    ela_image = ImageEnhance.Brightness(ela_image).enhance(scale)

    os.remove(temp_filename)
    return ela_image


def prepare_image(image: Image.Image) -> np.ndarray:
    """ELA + resize + normalize."""
    ela_image = convert_to_ela_image(image, ELA_QUALITY)
    ela_image = ela_image.resize(IMAGE_SIZE)

    image_array = np.array(ela_image).flatten() / 255.0
    return image_array.reshape(-1, IMAGE_SIZE[0], IMAGE_SIZE[1], 3)


def predict_manipulation(image: Image.Image) -> dict:
    """Run manipulation prediction."""
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
# API Endpoint
# ------------------------
@router.post("/check")
async def check_manipulation(file: UploadFile = File(...)):
    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(400, "Only JPG and PNG images allowed")

    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes))

    result = predict_manipulation(image)

    return {
        "check_type": "image_manipulation",
        "method": "ELA + CNN",
        "result": result
    }
