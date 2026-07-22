from fastapi import APIRouter, HTTPException, FastAPI
from typing import Dict, Optional, Any
from pydantic import BaseModel, HttpUrl
from datetime import datetime, timezone
import base64
import cv2
import numpy as np
import easyocr
import httpx
import torch
from ultralyticsplus import YOLO

app = FastAPI()
router = APIRouter(prefix="/pan", tags=["PAN Card OCR"])

# ------------------------
# Globals (lazy-loaded)
# ------------------------
model: Optional[YOLO] = None
reader: Optional[object] = None
validator: Optional[object] = None

# ------------------------
# Constants
# ------------------------
CLASS_MAP = {
    0: "PAN NUMBER",
    1: "FATHER'S NAME",
    2: "NAME",
    3: "DOB"
}

# ------------------------
# Request schema
# ------------------------
class PanVerifyRequest(BaseModel):
    image_url: HttpUrl

# ------------------------
# 1. Structure Validator Class
# ------------------------
class PanStructureValidator:
    def __init__(self):
        # The "Golden Standard" coordinates
        reference_tensor = torch.tensor([
            [3.42000e+02, 2.84000e+02, 8.39000e+02, 3.89000e+02, 9.56220e-01, 3.00000e+00],
            [6.50000e+01, 5.46000e+02, 4.45000e+02, 6.25000e+02, 9.19104e-01, 1.00000e+00],
            [6.00000e+01, 4.45000e+02, 2.50000e+02, 5.14000e+02, 9.07028e-01, 2.00000e+00],
            [6.90000e+01, 7.39000e+02, 2.29000e+02, 7.75000e+02, 8.23229e-01, 0.00000e+00]
        ])
        self.ref_fingerprint = self._get_geometry_fingerprint(reference_tensor)

    def _get_geometry_fingerprint(self, boxes):
        if len(boxes) == 0: return {}
        
        # Handle both Tensor and Numpy inputs
        data = boxes.cpu().numpy() if hasattr(boxes, 'cpu') else boxes
        
        coords = data[:, :4] 
        class_ids = data[:, 5]

        super_min_x = np.min(coords[:, 0])
        super_min_y = np.min(coords[:, 1])
        super_max_x = np.max(coords[:, 2])
        super_max_y = np.max(coords[:, 3])
        
        super_w = super_max_x - super_min_x
        super_h = super_max_y - super_min_y
        
        if super_w == 0 or super_h == 0: return {}

        fingerprint = {}
        for i, box in enumerate(coords):
            cid = int(class_ids[i])
            center_x = (box[0] + box[2]) / 2
            center_y = (box[1] + box[3]) / 2
            
            rel_x = (center_x - super_min_x) / super_w
            rel_y = (center_y - super_min_y) / super_h
            fingerprint[cid] = np.array([rel_x, rel_y])
            
        return fingerprint

    def calculate_structure_score(self, new_results):
        new_fingerprint = self._get_geometry_fingerprint(new_results.boxes.data)
        
        if not new_fingerprint:
            return 0.0, "No boxes detected"

        total_error = 0
        matches = 0

        for cid, ref_pos in self.ref_fingerprint.items():
            if cid in new_fingerprint:
                dist = np.linalg.norm(ref_pos - new_fingerprint[cid])
                total_error += dist
                matches += 1
            else:
                total_error += 0.5 

        if matches == 0:
            return 0.0, "No matching fields found"

        final_score = np.exp(-total_error) * 100
        return round(final_score, 2), f"Based on {matches} common fields"

# ------------------------
# 2. Visual Generator (Returns Base64)
# ------------------------
def generate_hud_image(img_array: np.ndarray, results, score: float, status: str) -> str:
    """Draws the Tech/HUD visuals and returns a Base64 string."""
    img = img_array.copy()
    overlay = img.copy()
    boxes = results.boxes.data.cpu().numpy()
    
    if len(boxes) == 0:
        # Return original image if no detection
        _, buffer = cv2.imencode('.jpg', img)
        return base64.b64encode(buffer).decode('utf-8')

    # Calculate Geometry
    min_x, min_y = np.min(boxes[:, 0]), np.min(boxes[:, 1])
    max_x, max_y = np.max(boxes[:, 2]), np.max(boxes[:, 3])
    sb_center_x = int((min_x + max_x) / 2)
    sb_center_y = int((min_y + max_y) / 2)

    # A. Draw Super Box (Green Geometry Container)
    cv2.rectangle(overlay, (int(min_x), int(min_y)), (int(max_x), int(max_y)), (0, 255, 0), -1)
    cv2.addWeighted(overlay, 0.1, img, 0.9, 0, img)
    cv2.rectangle(img, (int(min_x), int(min_y)), (int(max_x), int(max_y)), (0, 255, 0), 2)

    # B. Draw Constellation
    for box in boxes:
        x1, y1, x2, y2, conf, cls = box
        cx, cy = int((x1 + x2)/2), int((y1 + y2)/2)
        class_name = CLASS_MAP.get(int(cls), "UNKNOWN")
        
        color = (255, 191, 0)
        cv2.rectangle(img, (int(x1), int(y1)), (int(x2), int(y2)), color, 2)
        cv2.line(img, (sb_center_x, sb_center_y), (cx, cy), (0, 255, 255), 1, cv2.LINE_AA)
        cv2.circle(img, (cx, cy), 4, (0, 0, 255), -1)
        
        # Label
        label = f"{class_name}"
        (w, h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
        cv2.rectangle(img, (int(x1), int(y1) - 20), (int(x1) + w, int(y1)), color, -1)
        cv2.putText(img, label, (int(x1), int(y1) - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1, cv2.LINE_AA)

    # C. HUD Panel
    h, w, _ = img.shape
    cv2.rectangle(img, (0, h - 80), (w, h), (30, 30, 30), -1)
    cv2.putText(img, "STRUCTURAL INTEGRITY:", (20, h - 45), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 1)
    
    score_color = (0, 255, 0) if score > 80 else (0, 0, 255)
    cv2.putText(img, f"{score}%", (240, h - 40), cv2.FONT_HERSHEY_SIMPLEX, 1, score_color, 2)
    cv2.putText(img, f"STATUS: {status}", (w - 250, h - 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, score_color, 2)
    
    # Encode to Base64 (High Quality JPEG)
    _, buffer = cv2.imencode('.jpg', img, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
    return base64.b64encode(buffer).decode('utf-8')

# ------------------------
# Lazy loaders
# ------------------------
def get_model() -> YOLO:
    global model
    if model is None:
        try:
            model = YOLO("./models_data/pan-card-detection/best.pt")
            model.overrides.update({
                "conf": 0.25, "iou": 0.45, "agnostic_nms": False, "max_det": 1000
            })
        except Exception as e:
            print(f"Failed to load PAN model: {e}. Falling back...")
            model = YOLO("yolov8n.pt")
            model.overrides.update({"conf": 0.25, "iou": 0.45})
    return model

def get_reader():
    global reader
    if reader is None:
        reader = easyocr.Reader(["en"])
    return reader

def get_validator():
    global validator
    if validator is None:
        validator = PanStructureValidator()
    return validator

# ------------------------
# Core OCR logic (Updated)
# ------------------------
def extract_pan_ocr(image_bytes: bytes) -> Dict:
    ocr_model = get_model()
    ocr_reader = get_reader()
    ocr_validator = get_validator() # Load validator

    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise ValueError("Invalid image")

    results = ocr_model.predict(img)

    # Default values for empty result
    if not results or len(results[0].boxes) == 0:
        return {
            "detected": False,
            "boxes": [],
            "text_data": [],
            "extracted_data": {"pan_number": "", "name": "", "date_of_birth": "", "father_name": ""},
            "structure_score": 0.0,
            "verification_status": "FAILED",
            "visual_report": ""
        }

    # --- 1. OCR Logic (Existing) ---
    boxes = results[0].boxes.xyxy.cpu().numpy()
    # Class ids are a parallel array to xyxy — this is what tells us which box is the
    # PAN number vs name vs DOB vs father's name (via CLASS_MAP below). Previously this
    # was never read, so `text_data` had no field label and `extracted_data` was never
    # built at all — that's why PAN OCR data was always blank on the frontend.
    class_ids = results[0].boxes.cls.cpu().numpy()
    text_data = []
    box_list = []
    extracted_data = {}

    field_key_by_label = {
        "PAN NUMBER": "pan_number",
        "NAME": "name",
        "DOB": "date_of_birth",
        "FATHER'S NAME": "father_name",
    }

    for idx, box in enumerate(boxes):
        x1, y1, x2, y2 = map(int, box)
        cropped_img = img[y1:y2, x1:x2]

        ocr_results = ocr_reader.readtext(cropped_img)
        extracted_text = "\n".join([t[1] for t in ocr_results]) if ocr_results else ""
        confidence_scores = [round(float(t[2]), 4) for t in ocr_results] if ocr_results else []

        class_id = int(class_ids[idx]) if idx < len(class_ids) else None
        field_label = CLASS_MAP.get(class_id)
        field_key = field_key_by_label.get(field_label)

        text_data.append({
            "box_id": idx + 1,
            "class_id": class_id,
            "field": field_label,
            "coordinates": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
            "text": extracted_text,
            "confidence_scores": confidence_scores
        })

        if field_key and extracted_text:
            extracted_data[field_key] = extracted_text.replace("\n", " ").strip()

        box_list.append({"x1": x1, "y1": y1, "x2": x2, "y2": y2})

    # --- 2. New Logic: Structure Score ---
    score, reason = ocr_validator.calculate_structure_score(results[0])
    status = "VERIFIED" if score > 80 else "SUSPICIOUS"

    # --- 3. New Logic: Visual Generation ---
    visual_b64 = generate_hud_image(img, results[0], score, status)

    return {
        "detected": True,
        "boxes": box_list,
        "text_data": text_data,
        "extracted_data": {
            "pan_number": extracted_data.get("pan_number", ""),
            "name": extracted_data.get("name", ""),
            "date_of_birth": extracted_data.get("date_of_birth", ""),
            "father_name": extracted_data.get("father_name", ""),
        },
        # --- NEW FIELDS APPENDED HERE ---
        "structure_score": score,
        "verification_status": status,
        "visual_report": visual_b64 # The HUD image Base64 Encoded Image
    }

# ------------------------
# Helper: fetch image
# ------------------------
async def fetch_image_bytes(url: str) -> bytes:
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(url)
            response.raise_for_status()
            return response.content
    except Exception:
        raise HTTPException(status_code=400, detail=f"Failed to load image from URL: {url}")

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
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")

    # Returning EXACTLY the same top-level structure
    return {
        "biometric_type": "pan_card",
        "model": "foduucom/pan-card-detection",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "result": ocr_result # Now contains the extra fields inside
    }

app.include_router(router)
