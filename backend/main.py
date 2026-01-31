# backend/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import existing routers

from routes.behavioral_analysis import router as behavioral_router
from models.face_biometrics import router as face_router
from models.manipulation_detector import router as manipulation_router

# Import the new PAN OCR router (from the file we just fixed)
from models.ocrpan import router as pan_router

app = FastAPI(
    title="KYC Fraud Detection API",
    description="Synthetic Identity Fraud Detection for KYC Systems",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(behavioral_router)
app.include_router(manipulation_router)
app.include_router(face_router)
app.include_router(pan_router)  # <--- Added PAN router here

@app.get("/")
async def root():
    return {
        "message": "KYC Fraud Detection API",
        "version": "1.0.0",
        "endpoints": {
            "behavioral_analysis": "/api/behavioral/analyze",
            "quick_bot_check": "/api/behavioral/quick-check",
            "face_verification": "/face/verify",
            "pan_verification": "/pan/verify",  # <--- Added documentation for new endpoint
            "manipulation_check": "/manipulation/detect"
        }
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}