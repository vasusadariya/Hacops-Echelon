# backend/main.py

from fastapi import FastAPI
from models.face_biometrics import router as face_biometrics_router

app = FastAPI(
    title="KYC Face Biometric API",
    description="Face liveness verification for synthetic identity detection",
    version="1.0.0"
)

app.include_router(face_biometrics_router)
