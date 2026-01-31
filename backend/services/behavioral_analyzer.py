"""
Behavioral Trust Analyzer for Synthetic Identity Fraud Detection
Analyzes: Keystroke dynamics, mouse movements, paste behavior, form timing
"""
from datetime import datetime
from typing import Dict, List, Optional
from statistics import mean, stdev
import math


class BehavioralTrustAnalyzer:
    """
    Analyze user behavior during KYC to detect:
    - Bot-assisted form filling
    - Coached attempts (someone guiding the user)
    - Unnatural typing patterns
    - Copy-paste vs manual typing
    - Synthetic identity submission patterns
    """
    
    # Human typing thresholds
    HUMAN_TYPING_SPEED_MS = {"min": 100, "max": 600, "mean": 250}
    
    # Bot detection thresholds
    BOT_INDICATORS = {
        "uniform_typing_speed": 0.1,   # CV < 10% → bot
        "superhuman_speed": 80,         # < 80ms per keystroke → bot
        "no_corrections": 0.02,         # < 2% corrections → suspicious
        "linear_mouse_movement": 0.7,   # > 70% straight lines → bot
        "excessive_paste": 50,          # > 50% fields pasted → suspicious
        "too_fast_per_field": 3,        # < 3 seconds per field → bot
    }
    
    # Trust score weights
    WEIGHTS = {
        "typing": 0.35,
        "paste": 0.25,
        "mouse": 0.20,
        "speed": 0.20
    }

    @staticmethod
    def analyze_keystroke_dynamics(keystroke_analysis: Dict) -> Dict:
        """
        Validate and enrich keystroke analysis from frontend
        """
        if keystroke_analysis.get("insufficient_data"):
            return {
                "status": "insufficient_data",
                "trust_score": 50,
                "message": "Not enough keystroke data for analysis"
            }
        
        trust_score = keystroke_analysis.get("trustScore", 70)
        flags = keystroke_analysis.get("flags", {})
        
        # Additional server-side validation
        avg_interval = keystroke_analysis.get("avgIntervalMs", 250)
        variance = keystroke_analysis.get("typingVariance", 0.2)
        correction_rate = keystroke_analysis.get("correctionRate", 0.05)
        
        # Recalculate flags with stricter thresholds
        is_bot_like = (
            variance < BehavioralTrustAnalyzer.BOT_INDICATORS["uniform_typing_speed"] or
            avg_interval < BehavioralTrustAnalyzer.BOT_INDICATORS["superhuman_speed"] or
            correction_rate < BehavioralTrustAnalyzer.BOT_INDICATORS["no_corrections"]
        )
        
        if is_bot_like and trust_score > 50:
            trust_score = max(30, trust_score - 20)
        
        return {
            "status": "analyzed",
            "trust_score": trust_score,
            "metrics": {
                "avg_interval_ms": avg_interval,
                "typing_variance": variance,
                "correction_rate": correction_rate,
                "total_keystrokes": keystroke_analysis.get("totalKeystrokes", 0)
            },
            "flags": {
                **flags,
                "server_detected_bot": is_bot_like
            },
            "risk_indicators": []
        }

    @staticmethod
    def analyze_mouse_patterns(mouse_analysis: Dict) -> Dict:
        """
        Validate and enrich mouse movement analysis from frontend
        """
        if mouse_analysis.get("insufficient_data"):
            return {
                "status": "insufficient_data",
                "trust_score": 50,
                "message": "Not enough mouse movement data"
            }
        
        trust_score = mouse_analysis.get("trustScore", 70)
        linearity_ratio = mouse_analysis.get("linearityRatio", 0.3)
        path_efficiency = mouse_analysis.get("pathEfficiency", 0.5)
        
        # Additional checks
        is_bot_like = (
            linearity_ratio > BehavioralTrustAnalyzer.BOT_INDICATORS["linear_mouse_movement"] or
            path_efficiency > 0.9
        )
        
        if is_bot_like and trust_score > 50:
            trust_score = max(30, trust_score - 20)
        
        return {
            "status": "analyzed",
            "trust_score": trust_score,
            "metrics": {
                "linearity_ratio": linearity_ratio,
                "path_efficiency": path_efficiency,
                "total_movements": mouse_analysis.get("totalMovements", 0)
            },
            "flags": {
                **mouse_analysis.get("flags", {}),
                "server_detected_bot": is_bot_like
            }
        }

    @staticmethod
    def analyze_paste_patterns(paste_analysis: Dict) -> Dict:
        """
        Validate and enrich paste behavior analysis
        """
        if paste_analysis.get("insufficient_data"):
            return {
                "status": "insufficient_data", 
                "trust_score": 50,
                "message": "No field interaction data"
            }
        
        trust_score = paste_analysis.get("trustScore", 70)
        paste_percentage = paste_analysis.get("pastePercentage", 0)
        critical_pasted = paste_analysis.get("criticalFieldsPasted", 0)
        
        # High risk if critical fields were pasted
        is_suspicious = (
            paste_percentage > BehavioralTrustAnalyzer.BOT_INDICATORS["excessive_paste"] or
            critical_pasted > 0
        )
        
        if is_suspicious and trust_score > 50:
            trust_score = max(30, trust_score - 25)
        
        return {
            "status": "analyzed",
            "trust_score": trust_score,
            "metrics": {
                "paste_percentage": paste_percentage,
                "critical_fields_pasted": critical_pasted,
                "total_fields": paste_analysis.get("totalFields", 0)
            },
            "flags": {
                **paste_analysis.get("flags", {}),
                "high_paste_risk": is_suspicious
            }
        }

    @staticmethod
    def analyze_form_speed(speed_analysis: Dict) -> Dict:
        """
        Validate form completion speed
        """
        if speed_analysis.get("insufficient_data"):
            return {
                "status": "insufficient_data",
                "trust_score": 50,
                "message": "No timing data available"
            }
        
        trust_score = speed_analysis.get("trustScore", 70)
        time_per_field = speed_analysis.get("timePerFieldSeconds", 10)
        
        # Check for automation
        is_too_fast = time_per_field < BehavioralTrustAnalyzer.BOT_INDICATORS["too_fast_per_field"]
        
        if is_too_fast and trust_score > 50:
            trust_score = max(20, trust_score - 30)
        
        return {
            "status": "analyzed",
            "trust_score": trust_score,
            "metrics": {
                "time_per_field_seconds": time_per_field,
                "total_time_seconds": speed_analysis.get("totalTimeSeconds", 0),
                "field_count": speed_analysis.get("fieldCount", 0)
            },
            "flags": {
                **speed_analysis.get("flags", {}),
                "automation_suspected": is_too_fast
            }
        }

    @classmethod
    def calculate_overall_trust(cls, behavior_data: Dict) -> Dict:
        """
        Calculate comprehensive behavioral trust score
        """
        # Analyze each component
        keystroke_result = cls.analyze_keystroke_dynamics(
            behavior_data.get("keystrokeAnalysis", {})
        )
        mouse_result = cls.analyze_mouse_patterns(
            behavior_data.get("mouseAnalysis", {})
        )
        paste_result = cls.analyze_paste_patterns(
            behavior_data.get("pasteAnalysis", {})
        )
        speed_result = cls.analyze_form_speed(
            behavior_data.get("speedAnalysis", {})
        )
        
        # Calculate weighted overall score
        overall_score = (
            keystroke_result["trust_score"] * cls.WEIGHTS["typing"] +
            paste_result["trust_score"] * cls.WEIGHTS["paste"] +
            mouse_result["trust_score"] * cls.WEIGHTS["mouse"] +
            speed_result["trust_score"] * cls.WEIGHTS["speed"]
        )
        
        bot_likelihood = max(0, 100 - overall_score)
        
        # Aggregate all flags
        all_flags = []
        for result in [keystroke_result, mouse_result, paste_result, speed_result]:
            if "flags" in result:
                for flag, value in result["flags"].items():
                    if value is True:
                        all_flags.append(flag)
        
        # Determine risk level
        if bot_likelihood > 60:
            risk_level = "critical"
            recommendation = "reject"
        elif bot_likelihood > 40:
            risk_level = "high"
            recommendation = "manual_review"
        elif bot_likelihood > 25:
            risk_level = "medium"
            recommendation = "enhanced_verification"
        else:
            risk_level = "low"
            recommendation = "auto_approve"
        
        return {
            "overall_trust_score": round(overall_score, 1),
            "bot_likelihood": round(bot_likelihood, 1),
            "risk_level": risk_level,
            "recommendation": recommendation,
            "flags_detected": all_flags,
            "flag_count": len(all_flags),
            "component_scores": {
                "typing": keystroke_result["trust_score"],
                "mouse": mouse_result["trust_score"],
                "paste": paste_result["trust_score"],
                "speed": speed_result["trust_score"]
            },
            "detailed_analysis": {
                "keystroke": keystroke_result,
                "mouse": mouse_result,
                "paste": paste_result,
                "speed": speed_result
            },
            "analyzed_at": datetime.utcnow().isoformat()
        }