// Plain-function port of the old VerificationResults Mongoose instance methods
// (calculateOverallAssessment / getVerificationStatus / checkIsHighRisk) — Prisma
// models don't support instance methods, so this logic lives here instead and is
// called explicitly from the routes that used to call `verificationResult.calculateOverallAssessment()`.

const HIGH_RISK_SCORE_THRESHOLD = 40;

/**
 * @param {{faceVerification: object|null, manipulationDetection: object|null, panCardOCR: object|null, aadhaarCardOCR: object|null}} results
 */
export function calculateOverallAssessment({ faceVerification, manipulationDetection, panCardOCR, aadhaarCardOCR }) {
  let passedChecks = 0;
  let failedChecks = 0;
  let reviewRequiredChecks = 0;
  let totalScore = 0;
  const issues = [];
  const recommendations = [];

  if (faceVerification?.result) {
    const faceDecision = faceVerification.result.decision;
    if (faceDecision === 'PASS') {
      passedChecks++;
      totalScore += 25;
    } else if (faceDecision === 'REVIEW') {
      reviewRequiredChecks++;
      totalScore += 15;
      issues.push('Face verification requires manual review');
      recommendations.push('Review face biometric images manually');
    } else {
      failedChecks++;
      issues.push('Face verification failed - potential deepfake detected');
      recommendations.push('Request fresh face capture in controlled environment');
    }
  }

  if (manipulationDetection?.panCard?.result) {
    if (manipulationDetection.panCard.result.decision === 'PASS') {
      passedChecks++;
      totalScore += 20;
    } else {
      failedChecks++;
      issues.push('PAN card appears to be manipulated');
      recommendations.push('Request original PAN card document');
    }
  }

  if (manipulationDetection?.aadhaarCard?.result) {
    if (manipulationDetection.aadhaarCard.result.decision === 'PASS') {
      passedChecks++;
      totalScore += 20;
    } else {
      failedChecks++;
      issues.push('Aadhaar card appears to be manipulated');
      recommendations.push('Request original Aadhaar card document');
    }
  }

  if (panCardOCR?.result?.detected) {
    passedChecks++;
    totalScore += 15;
  } else {
    failedChecks++;
    issues.push('PAN card details could not be extracted');
    recommendations.push('Provide clearer image of PAN card');
  }

  if (aadhaarCardOCR?.result?.detected) {
    passedChecks++;
    totalScore += 20;
  } else {
    failedChecks++;
    issues.push('Aadhaar card details could not be extracted');
    recommendations.push('Provide clearer image of Aadhaar card');
  }

  let riskLevel = 'medium';
  if (failedChecks === 0 && reviewRequiredChecks === 0) {
    riskLevel = 'low';
  } else if (failedChecks >= 2) {
    riskLevel = 'critical';
  } else if (failedChecks === 1) {
    riskLevel = 'high';
  } else if (reviewRequiredChecks > 0) {
    riskLevel = 'medium';
  }

  const isHighRisk = totalScore < HIGH_RISK_SCORE_THRESHOLD || riskLevel === 'critical' || riskLevel === 'high';

  // The AI's own recommendation. This is NOT the workflow status — the officer always
  // makes the final call (see getVerificationStatus below) — but unlike the old code,
  // this is now actually computed instead of hardcoded to PENDING.
  let finalDecision = 'APPROVED';
  if (failedChecks >= 2) {
    finalDecision = 'REJECTED';
  } else if (failedChecks === 1 || reviewRequiredChecks > 0) {
    finalDecision = 'REVIEW_REQUIRED';
  }

  const confidence = totalScore / 100;

  return {
    totalScore,
    passedChecks,
    failedChecks,
    reviewRequiredChecks,
    finalDecision,
    riskLevel,
    confidence,
    summary: `Verification analysis completed with ${passedChecks}/${passedChecks + failedChecks + reviewRequiredChecks} checks passed. ${isHighRisk ? 'HIGH RISK - Requires careful review.' : 'Awaiting officer review.'}`,
    issues,
    recommendations,
    isHighRisk,
  };
}

// After AI processing completes, every application goes to officer review regardless
// of the AI's own recommendation above — the AI recommends, the officer decides.
export function getVerificationStatus() {
  return 'under_officer_review';
}

export function checkIsHighRisk(assessment) {
  return assessment?.isHighRisk || false;
}
