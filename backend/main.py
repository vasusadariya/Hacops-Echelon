from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.behavioral_analysis import router as behavioral_router
from models.face_biometrics import router as face_router
from models.manipulation_detector import router as manipulation_router

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

# Include routers
app.include_router(behavioral_router)
app.include_router(manipulation_router)
app.include_router(face_router)


@app.get("/")
async def root():
    return {
        "message": "KYC Fraud Detection API",
        "version": "1.0.0",
        "endpoints": {
            "behavioral_analysis": "/api/behavioral/analyze",
            "quick_bot_check": "/api/behavioral/quick-check",
            "face_verification": "/face/verify"
        }
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
