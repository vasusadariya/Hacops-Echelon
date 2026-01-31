"""
Behavioral Analysis API Endpoints
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from services.behavioral_analyzer import BehavioralTrustAnalyzer

router = APIRouter(prefix="/api/behavioral", tags=["Behavioral Analysis"])


class BehaviorDataRequest(BaseModel):
    """Request model for behavioral analysis"""
    overallTrustScore: Optional[int] = None
    botLikelihood: Optional[int] = None
    riskLevel: Optional[str] = None
    recommendation: Optional[str] = None
    flagsDetected: Optional[List[str]] = []
    keystrokeAnalysis: Optional[Dict[str, Any]] = {}
    mouseAnalysis: Optional[Dict[str, Any]] = {}
    pasteAnalysis: Optional[Dict[str, Any]] = {}
    speedAnalysis: Optional[Dict[str, Any]] = {}
    rawMetrics: Optional[Dict[str, Any]] = {}
    analyzedAt: Optional[str] = None


class BehaviorAnalysisResponse(BaseModel):
    """Response model for behavioral analysis"""
    success: bool
    analysis: Dict[str, Any]
    is_human: bool
    confidence: float
    action_required: str


@router.post("/analyze", response_model=BehaviorAnalysisResponse)
async def analyze_behavior(data: BehaviorDataRequest):
    """
    Analyze behavioral data from KYC form submission
    """
    try:
        behavior_dict = data.model_dump()
        
        # Run comprehensive analysis
        analysis_result = BehavioralTrustAnalyzer.calculate_overall_trust(behavior_dict)
        
        # Determine if human
        is_human = analysis_result["bot_likelihood"] < 40
        confidence = (100 - analysis_result["bot_likelihood"]) / 100
        
        # Determine action
        action_required = analysis_result["recommendation"]
        
        return BehaviorAnalysisResponse(
            success=True,
            analysis=analysis_result,
            is_human=is_human,
            confidence=round(confidence, 2),
            action_required=action_required
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/quick-check")
async def quick_bot_check(data: BehaviorDataRequest):
    """
    Quick bot detection check (faster, less detailed)
    """
    try:
        bot_likelihood = data.botLikelihood or 50
        flags = data.flagsDetected or []
        
        # Quick decision based on frontend analysis
        is_bot = bot_likelihood > 50 or len(flags) > 3
        
        return {
            "is_bot": is_bot,
            "bot_likelihood": bot_likelihood,
            "flags_count": len(flags),
            "recommendation": "block" if is_bot else "allow"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))