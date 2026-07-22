import io
import os
import re
import cv2
import numpy as np
from typing import Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl
from inference_sdk import InferenceHTTPClient
import easyocr
import httpx

# ------------------------
# CONFIGURATION
# ------------------------
ROBOFLOW_API_URL = "https://serverless.roboflow.com"
ROBOFLOW_API_KEY = os.environ["ROBOFLOW_API_KEY"]
ROBOFLOW_MODEL_ID = "aadhar-card-entity-detection/1"

CLIENT = InferenceHTTPClient(
    api_url=ROBOFLOW_API_URL,
    api_key=ROBOFLOW_API_KEY
)

# ------------------------
# Best-effort normalization of Roboflow's raw class labels to a fixed set of
# canonical keys. The exact label taxonomy of the aadhar-card-entity-detection
# model can't be verified offline, so this matches by keyword rather than an
# exact label list — it's a mitigation, not a guarantee, and callers should
# still fall back to `extracted_fields` (the raw labeled dict) if a canonical
# key comes back empty.
# ------------------------
_NORMALIZED_KEY_PATTERNS = {
    "aadhaar_number": re.compile(r"aadhar|aadhaar|uid|number", re.IGNORECASE),
    "name": re.compile(r"^name$|full[_ ]?name", re.IGNORECASE),
    "dob": re.compile(r"dob|birth", re.IGNORECASE),
    "gender": re.compile(r"gender|sex", re.IGNORECASE),
    "address": re.compile(r"address", re.IGNORECASE),
}


def normalize_extracted_fields(extracted_fields: Dict[str, str]) -> Dict[str, str]:
    normalized = {}
    for canonical_key, pattern in _NORMALIZED_KEY_PATTERNS.items():
        for label, text in extracted_fields.items():
            if pattern.search(label):
                normalized[canonical_key] = text
                break
    return normalized

router = APIRouter(prefix="/aadhar", tags=["Aadhar Card OCR"])

# ------------------------
# Lazy EasyOCR loader
# ------------------------
_reader = None

def get_reader():
    global _reader
    if _reader is None:
        print("Loading EasyOCR model...")
        _reader = easyocr.Reader(["en"], gpu=False)
    return _reader


# ------------------------
# Request schema
# ------------------------
class AadharVerifyRequest(BaseModel):
    image_url: HttpUrl


# ------------------------
# Helpers
# ------------------------
async def fetch_image_bytes(url: str) -> bytes:
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(url)
            response.raise_for_status()
            return response.content
    except Exception:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to load image from URL: {url}"
        )


def decode_image(image_bytes: bytes) -> np.ndarray:
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image")
    return img


def crop_and_ocr(image: np.ndarray, prediction: Dict[str, Any]) -> str:
    reader = get_reader()

    x, y = prediction["x"], prediction["y"]
    w, h = prediction["width"], prediction["height"]

    x1 = int(x - w / 2)
    y1 = int(y - h / 2)
    x2 = int(x + w / 2)
    y2 = int(y + h / 2)

    img_h, img_w = image.shape[:2]
    x1, y1 = max(0, x1), max(0, y1)
    x2, y2 = min(img_w, x2), min(img_h, y2)

    cropped = image[y1:y2, x1:x2]

    if cropped.size == 0:
        return ""

    result = reader.readtext(cropped, detail=0)
    return " ".join(result) if result else ""


# ------------------------
# API Endpoint
# ------------------------
@router.post("/verify")
async def verify_aadhar_card(payload: AadharVerifyRequest):
    try:
        # 1. Fetch image from Cloudinary
        image_bytes = await fetch_image_bytes(str(payload.image_url))

        # 2. Decode image
        image = decode_image(image_bytes)

        # 3. Roboflow detection
        response = CLIENT.infer(image, model_id=ROBOFLOW_MODEL_ID)
        predictions = response.get("predictions", [])

        if not predictions:
            return {
                "biometric_type": "aadhar_card",
                "model": "roboflow/aadhar-card-entity-detection",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "result": {
                    "detected": False,
                    "message": "No Aadhar card entities detected.",
                    "extracted_fields": {},
                    "normalized_fields": {}
                }
            }

        # 4. OCR extraction
        extracted_data = {}

        for pred in predictions:
            if pred.get("confidence", 0) < 0.4:
                continue

            label = pred["class"]
            text = crop_and_ocr(image, pred)
            extracted_data[label] = text

        return {
            "biometric_type": "aadhar_card",
            "model": "roboflow/aadhar-card-entity-detection",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "result": {
                "detected": True,
                "extracted_fields": extracted_data,
                "normalized_fields": normalize_extracted_fields(extracted_data),
                "raw_predictions": predictions
            }
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Processing error: {str(e)}"
        )
