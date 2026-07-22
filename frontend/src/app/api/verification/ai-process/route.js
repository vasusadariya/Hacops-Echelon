import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calculateOverallAssessment, getVerificationStatus, checkIsHighRisk } from '@/lib/assessment';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

async function pushStatusHistory(verificationId, entry) {
  const current = await prisma.verification.findUnique({
    where: { id: verificationId },
    select: { statusHistory: true },
  });
  return [...(current?.statusHistory || []), entry];
}

export async function POST(request) {
  try {
    const { verificationId } = await request.json();

    if (!verificationId) {
      return NextResponse.json({ error: 'Verification ID required' }, { status: 400 });
    }

    const verification = await prisma.verification.findUnique({ where: { id: verificationId } });

    if (!verification) {
      return NextResponse.json({ error: 'Verification not found' }, { status: 404 });
    }

    await prisma.verification.update({
      where: { id: verificationId },
      data: {
        status: 'under_automated_verification',
        statusHistory: await pushStatusHistory(verificationId, {
          status: 'under_automated_verification',
          changedAt: new Date().toISOString(),
          remarks: 'AI verification processing started',
        }),
      },
    });

    const startTime = Date.now();
    const timings = {};
    const errors = [];

    let verificationResult = await prisma.verificationResult.create({
      data: {
        userId: verification.userId,
        verificationId,
        sessionId: `session_${verificationId}_${Date.now()}`,
        status: 'under_automated_verification',
      },
    });

    let faceVerification = null;
    let panCardOCR = null;
    let aadhaarCardOCR = null;
    const manipulationDetection = { panCard: null, aadhaarCard: null };

    // ============ 1. AADHAAR OCR ============
    const aadhaarStartTime = Date.now();
    try {
      const aadhaarResponse = await fetch(`${BACKEND_URL}/aadhar/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: verification.aadhaarCardImage.secureUrl }),
      });

      if (aadhaarResponse.ok) {
        const aadhaarData = await aadhaarResponse.json();

        const extractedFields = aadhaarData.result?.extracted_fields || {};
        // The backend now also returns a best-effort normalized mapping alongside the
        // raw Roboflow-labeled fields (see backend/models/ocraadhar.py) — prefer that,
        // falling back to the raw fields for anything it didn't confidently map.
        const normalized = aadhaarData.result?.normalized_fields || {};

        aadhaarCardOCR = {
          biometric_type: 'aadhar_card',
          model: 'roboflow/aadhar-card-entity-detection',
          timestamp: new Date().toISOString(),
          result: {
            detected: aadhaarData.result?.detected || false,
            extracted_fields: extractedFields,
            raw_predictions: aadhaarData.result?.raw_predictions || [],
          },
          imageUrl: verification.aadhaarCardImage.secureUrl,
          verified: aadhaarData.result?.detected || false,
          extractedData: {
            aadhaarNumber: normalized.aadhaar_number || '',
            name: normalized.name || '',
            gender: ['MALE', 'FEMALE', 'OTHER'].includes(normalized.gender?.toUpperCase()) ? normalized.gender.toUpperCase() : null,
            dateOfBirth: normalized.dob || '',
            address: normalized.address || '',
          },
        };

        timings.aadhaarOCR = Date.now() - aadhaarStartTime;
      } else {
        const errorData = await aadhaarResponse.json();
        throw new Error(errorData.detail || 'Aadhaar OCR failed');
      }
    } catch (error) {
      console.error('Aadhaar OCR error:', error);
      errors.push({ stage: 'aadhaar_ocr', message: error.message, code: 'AADHAAR_OCR_FAILED' });
      timings.aadhaarOCR = Date.now() - aadhaarStartTime;
    }

    // ============ 2. PAN CARD OCR ============
    const panStartTime = Date.now();
    try {
      const panResponse = await fetch(`${BACKEND_URL}/pan/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: verification.panCardImage.secureUrl }),
      });

      if (panResponse.ok) {
        const panData = await panResponse.json();
        const resultData = panData.result || {};
        const extracted = resultData.extracted_data || {};

        panCardOCR = {
          biometric_type: 'pan_card',
          model: 'foduucom/pan-card-detection',
          timestamp: new Date().toISOString(),
          result: {
            detected: resultData.detected || false,
            boxes: resultData.boxes || [],
            text_data: resultData.text_data || [],
          },
          imageUrl: verification.panCardImage.secureUrl,
          verified: resultData.detected || false,
          extractedData: {
            panNumber: extracted.pan_number || '',
            name: extracted.name || '',
            dateOfBirth: extracted.date_of_birth || '',
            fatherName: extracted.father_name || '',
          },
        };

        timings.panOCR = Date.now() - panStartTime;
      } else {
        const errorData = await panResponse.json();
        throw new Error(errorData.detail || 'PAN OCR failed');
      }
    } catch (error) {
      console.error('PAN OCR error:', error);
      errors.push({ stage: 'pan_ocr', message: error.message, code: 'PAN_OCR_FAILED' });
      timings.panOCR = Date.now() - panStartTime;
    }

    // ============ 3. FACE BIOMETRICS ============
    const faceStartTime = Date.now();
    try {
      const faceUrls = [];
      if (verification.biometricSelfies) {
        for (const angle of ['front', 'left', 'right', 'up']) {
          if (verification.biometricSelfies[angle]?.secureUrl) {
            faceUrls.push(verification.biometricSelfies[angle].secureUrl);
          }
        }
      }

      if (faceUrls.length === 4) {
        const faceResponse = await fetch(`${BACKEND_URL}/face/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ frame_urls: faceUrls }),
        });

        if (faceResponse.ok) {
          const faceData = await faceResponse.json();
          const resultData = faceData.result || {};

          faceVerification = {
            biometric_type: 'face',
            model: 'prithivMLmods/deepfake-detector-model-v1',
            timestamp: new Date().toISOString(),
            result: {
              num_frames: resultData.num_frames || 0,
              fake_probability: resultData.fake_probability || 0,
              real_probability: resultData.real_probability || 0,
              decision: resultData.decision || 'REVIEW',
            },
            faceImageUrls: faceUrls,
            verified: resultData.decision === 'PASS',
          };

          timings.faceVerification = Date.now() - faceStartTime;
        } else {
          const errorData = await faceResponse.json();
          throw new Error(errorData.detail || 'Face verification failed');
        }
      } else if (faceUrls.length > 0) {
        // Partial capture — fail fast with a clear reason instead of hitting the
        // backend's blunt "exactly 4 frames required" 400.
        throw new Error(`Face verification requires exactly 4 selfie angles, only ${faceUrls.length} were captured`);
      }
    } catch (error) {
      console.error('Face Biometrics error:', error);
      errors.push({ stage: 'face_biometrics', message: error.message, code: 'FACE_BIOMETRICS_FAILED' });
      timings.faceVerification = Date.now() - faceStartTime;
    }

    // ============ 4. MANIPULATION DETECTION — AADHAAR + PAN ============
    const manipStartTime = Date.now();
    try {
      const aadhaarManipResponse = await fetch(`${BACKEND_URL}/manipulation/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: verification.aadhaarCardImage.secureUrl }),
      });

      if (aadhaarManipResponse.ok) {
        const data = await aadhaarManipResponse.json();
        const resultData = data.result || {};
        manipulationDetection.aadhaarCard = {
          check_type: data.check_type || 'image_manipulation',
          method: data.method || 'ELA + CNN',
          timestamp: new Date().toISOString(),
          result: {
            prediction: resultData.prediction || 'Authentic',
            is_authentic: resultData.is_authentic || false,
            confidence: resultData.confidence || 0,
            raw_output: resultData.raw_output || 0,
            decision: resultData.decision || (resultData.is_authentic ? 'PASS' : 'FAIL'),
          },
          imageUrl: verification.aadhaarCardImage.secureUrl,
          verified: resultData.is_authentic || false,
        };
      } else {
        const errorData = await aadhaarManipResponse.json();
        throw new Error(errorData.detail || 'Aadhaar manipulation check failed');
      }
    } catch (error) {
      console.error('Aadhaar Manipulation Detection error:', error);
      errors.push({ stage: 'aadhaar_manipulation', message: error.message, code: 'AADHAAR_MANIPULATION_FAILED' });
    }

    try {
      const panManipResponse = await fetch(`${BACKEND_URL}/manipulation/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: verification.panCardImage.secureUrl }),
      });

      if (panManipResponse.ok) {
        const data = await panManipResponse.json();
        const resultData = data.result || {};
        manipulationDetection.panCard = {
          check_type: data.check_type || 'image_manipulation',
          method: data.method || 'ELA + CNN',
          timestamp: new Date().toISOString(),
          result: {
            prediction: resultData.prediction || 'Authentic',
            is_authentic: resultData.is_authentic || false,
            confidence: resultData.confidence || 0,
            raw_output: resultData.raw_output || 0,
            decision: resultData.decision || (resultData.is_authentic ? 'PASS' : 'FAIL'),
          },
          imageUrl: verification.panCardImage.secureUrl,
          verified: resultData.is_authentic || false,
        };
        timings.manipulationCheck = Date.now() - manipStartTime;
      } else {
        const errorData = await panManipResponse.json();
        throw new Error(errorData.detail || 'PAN manipulation check failed');
      }
    } catch (error) {
      console.error('PAN Manipulation Detection error:', error);
      errors.push({ stage: 'pan_manipulation', message: error.message, code: 'PAN_MANIPULATION_FAILED' });
    }

    // ============ FINALIZE ============
    const totalTime = Date.now() - startTime;
    const assessment = calculateOverallAssessment({ faceVerification, manipulationDetection, panCardOCR, aadhaarCardOCR });
    const isHighRisk = checkIsHighRisk(assessment);
    const newVerificationStatus = getVerificationStatus();

    verificationResult = await prisma.verificationResult.update({
      where: { id: verificationResult.id },
      data: {
        faceVerification,
        panCardOCR,
        aadhaarCardOCR,
        manipulationDetection,
        processingTime: {
          total: totalTime,
          faceVerification: timings.faceVerification || 0,
          panOCR: timings.panOCR || 0,
          aadhaarOCR: timings.aadhaarOCR || 0,
          manipulationCheck: timings.manipulationCheck || 0,
        },
        errors,
        status: errors.length > 0 ? 'under_officer_review' : 'under_automated_verification',
        totalScore: assessment.totalScore,
        passedChecks: assessment.passedChecks,
        failedChecks: assessment.failedChecks,
        reviewRequiredChecks: assessment.reviewRequiredChecks,
        finalDecision: assessment.finalDecision,
        riskLevel: assessment.riskLevel,
        confidence: assessment.confidence,
        summary: assessment.summary,
        issues: assessment.issues,
        recommendations: assessment.recommendations,
        isHighRisk,
        completedAt: new Date(),
      },
    });

    const aiVerificationResults = {
      overallScore: assessment.totalScore,
      riskLevel: assessment.riskLevel,
      decision: assessment.finalDecision,
      passedChecks: assessment.passedChecks,
      failedChecks: assessment.failedChecks,
      reviewRequiredChecks: assessment.reviewRequiredChecks,
      issues: assessment.issues,
      recommendations: assessment.recommendations,
      completedAt: new Date().toISOString(),
    };

    await prisma.verification.update({
      where: { id: verificationId },
      data: {
        status: newVerificationStatus,
        isHighRisk,
        aiVerificationResults,
        statusHistory: await pushStatusHistory(verificationId, {
          status: newVerificationStatus,
          changedAt: new Date().toISOString(),
          remarks: `AI verification completed. Score: ${assessment.totalScore}/100, Risk: ${assessment.riskLevel}${isHighRisk ? ' — HIGH RISK' : ''}`,
        }),
      },
    });

    await prisma.user.update({
      where: { id: verification.userId },
      data: { verificationStatus: newVerificationStatus },
    });

    return NextResponse.json({
      success: true,
      verificationId,
      resultId: verificationResult.id,
      status: verificationResult.status,
      newVerificationStatus,
      isHighRisk,
      overallAssessment: assessment,
      processingTime: totalTime,
    });

  } catch (error) {
    console.error('AI processing error:', error);
    return NextResponse.json(
      {
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
