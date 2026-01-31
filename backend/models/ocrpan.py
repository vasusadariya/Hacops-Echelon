# backend/models/ocrpan.py

from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List, Dict, Optional
from PIL import Image
import io
from datetime import datetime, timezone
import torch
from ultralytics.nn.tasks import DetectionModel
import cv2
import numpy as np
import easyocr
from ultralyticsplus import YOLO

# Note: We do NOT need add_safe_globals here because your PyTorch version
# is older than 2.6. It will load the model without strict security checks by default.

router = APIRouter(prefix="/pan", tags=["PAN Card OCR"])

# Global model and reader instances (lazy loaded)
model: Optional[YOLO] = None
reader: Optional[object] = None


def get_model() -> YOLO:
    """Lazy load the PAN detection model"""
    global model
    if model is None:
        try:
            # Load the PAN-specific model
            model = YOLO('./models_data/pan-card-detection/best.pt')
            # Set model parameters
            model.overrides['conf'] = 0.25 
            model.overrides['iou'] = 0.45   
            model.overrides['agnostic_nms'] = False  
            model.overrides['max_det'] = 1000 
        except Exception as e:
            print(f"Failed to load PAN model: {e}")
            print("Falling back to local YOLOv8n model")
            try:
                model = YOLO('./models_data/yolov8n.pt')
                model.overrides['conf'] = 0.25
                model.overrides['iou'] = 0.45
                model.overrides['agnostic_nms'] = False
                model.overrides['max_det'] = 1000
            except Exception as e2:
                print(f"Failed to load fallback model: {e2}")
                raise
    return model


def get_reader() -> object:
    """Lazy load the OCR reader"""
    global reader
    if reader is None:
        reader = easyocr.Reader(['en'])
    return reader


def extract_pan_ocr(image_bytes: bytes) -> Dict:
    """
    Detect PAN card and extract text using OCR
    """
    # Get lazy-loaded models
    ocr_model = get_model()
    ocr_reader = get_reader()
    
    # Load image from bytes
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        raise ValueError("Invalid image")
    
    # Perform inference
    results = ocr_model.predict(img)
    
    if not results or len(results[0].boxes) == 0:
        return {
            "detected": False,
            "boxes": [],
            "text_data": []
        }
    
    # Extract text from detected boxes
    boxes = results[0].boxes.xyxy.cpu().numpy()
    text_data = []
    box_list = []
    
    for idx, box in enumerate(boxes):
        x1, y1, x2, y2 = map(int, box)
        
        # Crop the region
        cropped_img = img[y1:y2, x1:x2]
        
        # Apply EasyOCR
        ocr_results = ocr_reader.readtext(cropped_img)
        
        # Extract text and confidence
        if ocr_results:
            extracted_text = "\n".join([text[1] for text in ocr_results])
            confidence_scores = [round(float(text[2]), 4) for text in ocr_results]
        else:
            extracted_text = ""
            confidence_scores = []
        
        text_data.append({
            "box_id": idx + 1,
            "coordinates": {
                "x1": x1,
                "y1": y1,
                "x2": x2,
                "y2": y2
            },
            "text": extracted_text,
            "confidence_scores": confidence_scores
        })
        
        box_list.append({
            "x1": x1,
            "y1": y1,
            "x2": x2,
            "y2": y2
        })
    
    return {
        "detected": True,
        "boxes": box_list,
        "text_data": text_data
    }


@router.post("/verify")
async def verify_pan_card(file: UploadFile = File(...)):
    """
    Verify PAN card and extract OCR data
    """
    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(
            status_code=400,
            detail="Only JPG and PNG images are allowed"
        )
    
    image_bytes = await file.read()
    
    try:
        ocr_result = extract_pan_ocr(image_bytes)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Image processing error: {str(e)}"
        )
    except Exception as e:
        import traceback
        print(f"Error in PAN verification: {str(e)}")
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