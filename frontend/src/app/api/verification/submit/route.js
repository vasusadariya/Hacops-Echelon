import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-middleware';
import { uploadDocument, uploadSelfieBase64 } from '@/lib/cloudinary';
import { verifyRecaptcha } from '@/lib/recaptcha';

function toImageRecord(result, originalFilename) {
  return {
    publicId: result.public_id,
    secureUrl: result.secure_url,
    url: result.url,
    format: result.format,
    width: result.width,
    height: result.height,
    bytes: result.bytes,
    originalFilename: originalFilename || result.original_filename,
    createdAt: new Date().toISOString(),
  };
}

function buildBehavioralAnalysisData(userId, behaviorData) {
  if (!behaviorData || Object.keys(behaviorData).length === 0) {
    return {
      userId,
      overallTrustScore: 50,
      botLikelihood: 50,
      riskLevel: 'medium',
      recommendation: 'standard_flow',
      isHuman: true,
      confidence: 0.5,
      flagsDetected: [],
      flagCount: 0,
      componentScores: { typing: 50, mouse: 50, paste: 50, speed: 50 },
      keystrokeAnalysis: { insufficient_data: true, trustScore: 50 },
      mouseAnalysis: { insufficient_data: true, trustScore: 50 },
      pasteAnalysis: { insufficient_data: true, trustScore: 50 },
      speedAnalysis: { insufficient_data: true, trustScore: 50 },
      rawMetrics: { totalKeystrokes: 0, totalMouseMovements: 0, totalFields: 0, sessionDurationMs: 0 },
      analyzedAt: new Date(),
    };
  }

  const {
    overallTrustScore = 50,
    botLikelihood = 50,
    riskLevel = 'medium',
    recommendation = 'standard_flow',
    flagsDetected = [],
    keystrokeAnalysis = {},
    mouseAnalysis = {},
    pasteAnalysis = {},
    speedAnalysis = {},
    rawMetrics = {},
  } = behaviorData;

  const isHuman = botLikelihood < 40;
  const confidence = Math.round(((100 - botLikelihood) / 100) * 100) / 100;

  return {
    userId,
    overallTrustScore: Math.round(overallTrustScore),
    botLikelihood: Math.round(botLikelihood),
    riskLevel,
    recommendation,
    isHuman,
    confidence,
    flagsDetected: flagsDetected || [],
    flagCount: (flagsDetected || []).length,
    componentScores: {
      typing: keystrokeAnalysis.trustScore ?? 50,
      mouse: mouseAnalysis.trustScore ?? 50,
      paste: pasteAnalysis.trustScore ?? 50,
      speed: speedAnalysis.trustScore ?? 50,
    },
    keystrokeAnalysis,
    mouseAnalysis,
    pasteAnalysis,
    speedAnalysis,
    rawMetrics,
    analyzedAt: new Date(),
  };
}

export async function POST(request) {
  try {
    const { user, response } = await requireAuth(request);
    if (response) return response;

    const formData = await request.formData();

    const fullName = formData.get('fullName');
    const gender = formData.get('gender');
    const addressLine1 = formData.get('addressLine1');
    const addressLine2 = formData.get('addressLine2') || '';
    const city = formData.get('city');
    const taluka = formData.get('taluka');
    const district = formData.get('district');
    const state = formData.get('state');
    const pincode = formData.get('pincode');
    const mobileNumber = formData.get('mobileNumber');

    const aadhaarCard = formData.get('aadhaarCard');
    const panCard = formData.get('panCard');
    const recaptchaToken = formData.get('recaptchaToken');

    const recaptchaResult = await verifyRecaptcha(recaptchaToken, 'verification_submit');
    if (!recaptchaResult.success) {
      return NextResponse.json(
        { error: 'reCAPTCHA verification failed. Please refresh the page and try again.' },
        { status: 400 }
      );
    }

    let faceCaptures = null;
    try {
      faceCaptures = JSON.parse(formData.get('faceCaptures'));
    } catch (e) {
      // no face captures provided
    }

    let behaviorData = {};
    try {
      behaviorData = JSON.parse(formData.get('behaviorData'));
    } catch (e) {
      // no behavior data provided
    }

    const errors = [];
    if (!fullName || fullName.length < 3) errors.push('Full name is required');
    if (!gender) errors.push('Gender is required');
    if (!addressLine1 || addressLine1.length < 10) errors.push('Address is required');
    if (!city) errors.push('City is required');
    if (!taluka) errors.push('Taluka is required');
    if (!district) errors.push('District is required');
    if (!state) errors.push('State is required');
    if (!pincode || pincode.length !== 6) errors.push('Valid pincode is required');
    if (!mobileNumber || mobileNumber.length !== 10) errors.push('Valid mobile number is required');
    if (!aadhaarCard) errors.push('Aadhaar card is required');
    if (!panCard) errors.push('PAN card is required');

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(', '), errors }, { status: 400 });
    }

    let aadhaarUpload, panUpload;
    try {
      const [aadhaarBuffer, panBuffer] = await Promise.all([
        aadhaarCard.arrayBuffer().then(Buffer.from),
        panCard.arrayBuffer().then(Buffer.from),
      ]);

      const [aadhaarResult, panResult] = await Promise.all([
        uploadDocument(aadhaarBuffer, 'aadhaar', user.id),
        uploadDocument(panBuffer, 'pan', user.id),
      ]);

      aadhaarUpload = toImageRecord(aadhaarResult, aadhaarCard.name);
      panUpload = toImageRecord(panResult, panCard.name);
    } catch (uploadError) {
      console.error('Document upload failed:', uploadError);
      return NextResponse.json({ error: 'Failed to upload documents: ' + uploadError.message }, { status: 500 });
    }

    let biometricSelfies = {};
    if (faceCaptures) {
      try {
        for (const angle of ['front', 'left', 'right', 'up']) {
          if (faceCaptures[angle]) {
            const result = await uploadSelfieBase64(faceCaptures[angle], `${user.id}_${angle}`);
            biometricSelfies[angle] = toImageRecord(result);
          }
        }
        biometricSelfies.capturedAt = new Date().toISOString();
      } catch (faceError) {
        console.error('Face upload failed:', faceError);
        // Continue without face uploads - don't fail the whole submission
      }
    }

    const now = new Date();
    const behaviorSummary = {
      overallTrustScore: behaviorData.overallTrustScore || 50,
      botLikelihood: behaviorData.botLikelihood || 50,
      riskLevel: behaviorData.riskLevel || 'medium',
      isHuman: (behaviorData.botLikelihood || 50) < 40,
      recommendation: behaviorData.recommendation || 'standard_flow',
    };

    const { verification, behavioralAnalysis } = await prisma.$transaction(async (tx) => {
      const verification = await tx.verification.create({
        data: {
          userId: user.id,
          fullName,
          gender,
          addressLine1,
          addressLine2,
          city,
          taluka,
          district,
          state,
          pincode,
          mobileNumber,
          aadhaarCardImage: aadhaarUpload,
          panCardImage: panUpload,
          biometricSelfies,
          behaviorSummary,
          status: 'submitted',
          statusHistory: [
            {
              status: 'submitted',
              changedAt: now.toISOString(),
              remarks: `Application submitted. Trust: ${behaviorSummary.overallTrustScore}, Bot: ${behaviorSummary.botLikelihood}%`,
            },
          ],
          submittedAt: now,
        },
      });

      const behavioralAnalysis = await tx.behavioralAnalysis.create({
        data: {
          ...buildBehavioralAnalysisData(user.id, behaviorData),
          verificationId: verification.id,
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: { verificationStatus: 'submitted', updatedAt: now },
      });

      return { verification, behavioralAnalysis };
    });

    triggerAIVerification(verification.id);

    return NextResponse.json({
      success: true,
      verificationId: verification.id,
      behavioralAnalysisId: behavioralAnalysis.id,
      status: 'submitted',
      behavioralAnalysis: behaviorSummary,
    });

  } catch (error) {
    console.error('Submit error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Trigger AI verification asynchronously
function triggerAIVerification(verificationId) {
  setTimeout(async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
      await fetch(`${baseUrl}/api/verification/ai-process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationId }),
      });
    } catch (e) {
      console.error('Failed to trigger AI verification:', e);
    }
  }, 2000);
}
