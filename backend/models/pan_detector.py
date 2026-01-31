import torch
from ultralyticsplus import YOLO
from PIL import Image
import io
from fastapi import APIRouter, UploadFile, File, HTTPException

router = APIRouter(prefix="/pan", tags=["PAN Detection"])

MODEL_NAME = "foduucom/pan-card-detection"

# Load YOLO normally
model = YOLO(MODEL_NAME)

model.overrides["conf"] = 0.25
model.overrides["iou"] = 0.45
model.overrides["agnostic_nms"] = False
model.overrides["max_det"] = 1000


def detect_pan_card(image: Image.Image) -> dict:
    results = model.predict(image, verbose=False)
    num_boxes = len(results[0].boxes) if results and results[0].boxes is not None else 0

    if num_boxes == 0:
        return {
            "is_pan_card": False,
            "num_detections": 0,
            "confidence": 0.0,
            "decision": "FAIL"
        }

    confidence = 0.9 if num_boxes >= 4 else round(0.4 + (num_boxes * 0.1), 2)

    return {
        "is_pan_card": True,
        "num_detections": num_boxes,
        "confidence": confidence,
        "decision": "PASS"
    }


@router.post("/detect")
async def pan_detect(file: UploadFile = File(...)):
    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(400, "Only JPG and PNG images allowed")

    image = Image.open(io.BytesIO(await file.read())).convert("RGB")
    return {
        "document_type": "PAN",
        "model": MODEL_NAME,
        "result": detect_pan_card(image)
    }

