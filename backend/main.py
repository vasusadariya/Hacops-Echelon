from fastapi import FastAPI
from models.face_biometrics import router as face_router
from models.manipulation_detector import router as manipulation_router
# from models.pan_detector import router as pan_router

app = FastAPI(
    title="KYC Document Verification API",
    description="Image manipulation detection and biometric verification",
    version="1.0.0"
)

# app.include_router(pan_router)
app.include_router(manipulation_router)
app.include_router(face_router)