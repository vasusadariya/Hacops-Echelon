# main.py

from fastapi import FastAPI, UploadFile, File, HTTPException
from typing import List
from PIL import Image
import io
from datetime import datetime

from deepfake_service import predict_multiple_frames

app = FastAPI(
    title="Face Biometric Liveness Service",
    description="Face liveness detection using deepfake-detector-model-v1",
    version="1.0.0"
)


@app.post("/face/verify")
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
        "model": "prithivMLmods/deepfake-detector-model-v1",
        "timestamp": datetime.utcnow().isoformat(),
        "benchmark": {
            "pass": "fake_probability < 0.30",
            "review": "0.30 <= fake_probability < 0.60",
            "suspect": "fake_probability >= 0.60"
        },
        "result": result
    }
