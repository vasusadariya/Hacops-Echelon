from fastapi import APIRouter, HTTPException
from typing import Dict, Optional
from pydantic import BaseModel, HttpUrl
from datetime import datetime, timezone
import io
import os
import cv2
import numpy as np
import easyocr
import httpx

from ultralyticsplus import YOLO

router = APIRouter(prefix="/pan", tags=["PAN Card OCR"])

# ------------------------
# Globals (lazy-loaded)
# ------------------------
model: Optional[YOLO] = None
reader: Optional[object] = None


# ------------------------
# Request schema
# ------------------------
class PanVerifyRequest(BaseModel):
    image_url: HttpUrl


# ------------------------
# Lazy loaders
# ------------------------
def get_model() -> YOLO:
    global model
    if model is None:
        try:
            model = YOLO("./models_data/pan-card-detection/best.pt")
            model.overrides.update({
                "conf": 0.25,
                "iou": 0.45,
                "agnostic_nms": False,
                "max_det": 1000
            })
        except Exception as e:
            print(f"Failed to load PAN model: {e}")
            print("Falling back to yolov8n")
            model = YOLO("./models_data/yolov8n.pt")
            model.overrides.update({
                "conf": 0.25,
                "iou": 0.45,
                "agnostic_nms": False,
                "max_det": 1000
            })
    return model


def get_reader():
    global reader
    if reader is None:
        reader = easyocr.Reader(["en"])
    return reader


# ------------------------
# Core OCR logic
# ------------------------
def extract_pan_ocr(image_bytes: bytes) -> Dict:
    ocr_model = get_model()
    ocr_reader = get_reader()

    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise ValueError("Invalid image")

    results = ocr_model.predict(img)

    if not results or len(results[0].boxes) == 0:
        return {
            "detected": False,
            "boxes": [],
            "text_data": []
        }

    boxes = results[0].boxes.xyxy.cpu().numpy()
    text_data = []
    box_list = []

    for idx, box in enumerate(boxes):
        x1, y1, x2, y2 = map(int, box)
        cropped_img = img[y1:y2, x1:x2]

        ocr_results = ocr_reader.readtext(cropped_img)

        extracted_text = "\n".join([t[1] for t in ocr_results]) if ocr_results else ""
        confidence_scores = (
            [round(float(t[2]), 4) for t in ocr_results] if ocr_results else []
        )

        text_data.append({
            "box_id": idx + 1,
            "coordinates": {
                "x1": x1, "y1": y1, "x2": x2, "y2": y2
            },
            "text": extracted_text,
            "confidence_scores": confidence_scores
        })

        box_list.append({
            "x1": x1, "y1": y1, "x2": x2, "y2": y2
        })

    return {
        "detected": True,
        "boxes": box_list,
        "text_data": text_data
    }


# ------------------------
# Helper: fetch image from URL
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


# ------------------------
# API Endpoint
# ------------------------
@router.post("/verify")
async def verify_pan_card(payload: PanVerifyRequest):
    image_bytes = await fetch_image_bytes(str(payload.image_url))

    try:
        ocr_result = extract_pan_ocr(image_bytes)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Processing error: {str(e)}"
        )

    return {
        "biometric_type": "pan_card",
        "model": "foduucom/pan-card-detection",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "result": ocr_result
    }
