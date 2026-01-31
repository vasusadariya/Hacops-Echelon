import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';
import cloudinary from '@/lib/cloudinary';

// ============ RECAPTCHA VERIFICATION ============
async function verifyRecaptcha(token) {
  if (!token) return false;
  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`
    });
    const data = await response.json();
    return data.success && data.score >= 0.5;
  } catch {
    return false;
  }
}

// ============ UPLOAD TO CLOUDINARY ============
async function uploadToCloudinary(file, folder) {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: `kyc_verification/${folder}`,
      resource_type: 'auto'
    });

    return {
      publicId: result.public_id,
      secureUrl: result.secure_url,
      url: result.url,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      originalFilename: file.name,
      createdAt: new Date()
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}

// ============ SAVE BEHAVIORAL ANALYSIS TO SEPARATE COLLECTION ============
async function saveBehavioralAnalysis(db, userId, verificationId, behaviorData) {
  const behavioralAnalysisCollection = db.collection('behavioralanalyses');
  
  // If no data, return defaults
  if (!behaviorData || Object.keys(behaviorData).length === 0) {
    const defaultDoc = {
      userId: new mongoose.Types.ObjectId(userId),
      verificationId: new mongoose.Types.ObjectId(verificationId),
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
      createdAt: new Date()
    };
    
    const result = await behavioralAnalysisCollection.insertOne(defaultDoc);
    return {
      analysisId: result.insertedId,
      summary: {
        overallTrustScore: 50,
        botLikelihood: 50,
        riskLevel: 'medium',
        isHuman: true,
        recommendation: 'standard_flow'
      }
    };
  }

  // Parse the comprehensive data from frontend
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
    rawMetrics = {}
  } = behaviorData;

  const isHuman = botLikelihood < 40;
  const confidence = (100 - botLikelihood) / 100;

  const analysisDocument = {
    userId: new mongoose.Types.ObjectId(userId),
    verificationId: new mongoose.Types.ObjectId(verificationId),
    
    // Overall scores
    overallTrustScore: Math.round(overallTrustScore),
    botLikelihood: Math.round(botLikelihood),
    riskLevel,
    recommendation,
    isHuman,
    confidence: Math.round(confidence * 100) / 100,
    
    // Flags
    flagsDetected: flagsDetected || [],
    flagCount: (flagsDetected || []).length,
    
    // Component scores
    componentScores: {
      typing: keystrokeAnalysis.trustScore || 50,
      mouse: mouseAnalysis.trustScore || 50,
      paste: pasteAnalysis.trustScore || 50,
      speed: speedAnalysis.trustScore || 50
    },
    
    // Detailed keystroke analysis
    keystrokeAnalysis: {
      totalKeystrokes: keystrokeAnalysis.totalKeystrokes || 0,
      avgIntervalMs: keystrokeAnalysis.avgIntervalMs || 0,
      typingVariance: keystrokeAnalysis.typingVariance || 0,
      stdDeviation: keystrokeAnalysis.stdDeviation || 0,
      correctionRate: keystrokeAnalysis.correctionRate || 0,
      corrections: keystrokeAnalysis.corrections || 0,
      trustScore: keystrokeAnalysis.trustScore || 50,
      flags: {
        botLikeUniformity: keystrokeAnalysis.flags?.botLikeUniformity || false,
        superhumanSpeed: keystrokeAnalysis.flags?.superhumanSpeed || false,
        minimalCorrections: keystrokeAnalysis.flags?.minimalCorrections || false,
        naturalTyping: keystrokeAnalysis.flags?.naturalTyping || false
      },
      insufficient_data: keystrokeAnalysis.insufficient_data || false
    },
    
    // Detailed mouse analysis
    mouseAnalysis: {
      totalMovements: mouseAnalysis.totalMovements || 0,
      linearSegments: mouseAnalysis.linearSegments || 0,
      linearityRatio: mouseAnalysis.linearityRatio || 0,
      pathEfficiency: mouseAnalysis.pathEfficiency || 0,
      totalDistance: mouseAnalysis.totalDistance || 0,
      trustScore: mouseAnalysis.trustScore || 50,
      flags: {
        botLikeMovement: mouseAnalysis.flags?.botLikeMovement || false,
        tooLinear: mouseAnalysis.flags?.tooLinear || false,
        tooEfficient: mouseAnalysis.flags?.tooEfficient || false
      },
      insufficient_data: mouseAnalysis.insufficient_data || false
    },
    
    // Detailed paste analysis
    pasteAnalysis: {
      totalFields: pasteAnalysis.totalFields || 0,
      pastedFields: pasteAnalysis.pastedFields || 0,
      pastePercentage: pasteAnalysis.pastePercentage || 0,
      criticalFieldsPasted: pasteAnalysis.criticalFieldsPasted || 0,
      trustScore: pasteAnalysis.trustScore || 50,
      flags: {
        excessivePasting: pasteAnalysis.flags?.excessivePasting || false,
        criticalFieldPaste: pasteAnalysis.flags?.criticalFieldPaste || false
      },
      insufficient_data: pasteAnalysis.insufficient_data || false
    },
    
    // Detailed speed analysis
    speedAnalysis: {
      totalTimeSeconds: speedAnalysis.totalTimeSeconds || 0,
      timePerFieldSeconds: speedAnalysis.timePerFieldSeconds || 0,
      fieldCount: speedAnalysis.fieldCount || 0,
      pauseCount: speedAnalysis.pauseCount || 0,
      trustScore: speedAnalysis.trustScore || 50,
      flags: {
        unnaturallyFast: speedAnalysis.flags?.unnaturallyFast || false,
        unusuallySlow: speedAnalysis.flags?.unusuallySlow || false,
        naturalPace: speedAnalysis.flags?.naturalPace || false
      },
      insufficient_data: speedAnalysis.insufficient_data || false
    },
    
    // Raw metrics
    rawMetrics: {
      totalKeystrokes: rawMetrics.totalKeystrokes || 0,
      totalMouseMovements: rawMetrics.totalMouseMovements || 0,
      totalFields: rawMetrics.totalFields || 0,
      sessionDurationMs: rawMetrics.sessionDurationMs || 0
    },
    
    // Timestamps
    analyzedAt: new Date(),
    createdAt: new Date()
  };

  // Check if analysis already exists for this verification
  const existingAnalysis = await behavioralAnalysisCollection.findOne({
    verificationId: new mongoose.Types.ObjectId(verificationId)
  });

  let analysisId;
  
  if (existingAnalysis) {
    await behavioralAnalysisCollection.updateOne(
      { _id: existingAnalysis._id },
      { $set: { ...analysisDocument, updatedAt: new Date() } }
    );
    analysisId = existingAnalysis._id;
    console.log('📊 Updated behavioral analysis:', analysisId.toString());
  } else {
    const result = await behavioralAnalysisCollection.insertOne(analysisDocument);
    analysisId = result.insertedId;
    console.log('📊 Created behavioral analysis:', analysisId.toString());
  }

  return {
    analysisId,
    summary: {
      overallTrustScore: Math.round(overallTrustScore),
      botLikelihood: Math.round(botLikelihood),
      riskLevel,
      isHuman,
      recommendation
    }
  };
}

// ============ MAIN POST HANDLER ============
export async function POST(request) {
  const uploadedFiles = [];

  try {
    console.log('=== Verification Submit Started ===');
    
    // ============ AUTH CHECK ============
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.userId;
    console.log('User ID:', userId);

    // ============ CONNECT TO DB ============
    await connectDB();
    const db = mongoose.connection.db;
    const verificationsCollection = db.collection('verifications');

    // ============ PARSE FORM DATA ============
    const formData = await request.formData();

    // ============ VERIFY RECAPTCHA ============
    const recaptchaToken = formData.get('recaptchaToken');
    if (!(await verifyRecaptcha(recaptchaToken))) {
      return NextResponse.json({ error: 'reCAPTCHA verification failed' }, { status: 400 });
    }

    // ============ GET FORM FIELDS ============
    const fullName = formData.get('fullName');
    const gender = formData.get('gender');
    const documentIdNumber = formData.get('documentIdNumber') || '';
    const addressLine1 = formData.get('addressLine1');
    const addressLine2 = formData.get('addressLine2') || '';
    const city = formData.get('city');
    const taluka = formData.get('taluka');
    const district = formData.get('district');
    const state = formData.get('state');
    const pincode = formData.get('pincode');
    const mobileNumber = formData.get('mobileNumber');

    // ============ GET FILES ============
    const aadhaarFile = formData.get('aadhaarCard');
    const panFile = formData.get('panCard');

    // ============ PARSE BEHAVIOR DATA ============
    let behaviorData = {};
    try {
      const rawBehaviorData = formData.get('behaviorData');
      if (rawBehaviorData) {
        behaviorData = JSON.parse(rawBehaviorData);
        console.log('📊 Behavioral data received:', {
          overallTrustScore: behaviorData.overallTrustScore,
          botLikelihood: behaviorData.botLikelihood,
          riskLevel: behaviorData.riskLevel,
          flagsCount: behaviorData.flagsDetected?.length || 0
        });
      }
    } catch (e) {
      console.warn('Failed to parse behavior data:', e.message);
    }

    // ============ PARSE AI VERIFICATION RESULTS ============
    let aiVerificationResults = {};
    const aiResultsJson = formData.get('aiVerificationResults');
    if (aiResultsJson) {
      try {
        aiVerificationResults = JSON.parse(aiResultsJson);
        console.log('🤖 AI Verification Results received:', {
          faceVerification: !!aiVerificationResults.faceVerification,
          panCardOCR: !!aiVerificationResults.panCardOCR,
          manipulationDetection: !!aiVerificationResults.manipulationDetection
        });
      } catch (e) {
        console.warn('Failed to parse AI verification results:', e);
      }
    }

    // ============ PARSE FACE CAPTURES ============
    let faceCaptures = {};
    const faceCapturesJson = formData.get('faceCaptures');
    if (faceCapturesJson) {
      try {
        faceCaptures = JSON.parse(faceCapturesJson);
      } catch (e) {
        console.warn('Failed to parse face captures:', e);
      }
    }

    // Get face image URLs if provided
    let faceImageUrls = [];
    const faceImageUrlsJson = formData.get('faceImageUrls');
    if (faceImageUrlsJson) {
      try {
        faceImageUrls = JSON.parse(faceImageUrlsJson);
      } catch (e) {
        console.warn('Failed to parse face image URLs:', e);
      }
    }

    // ============ VALIDATION ============
    const errors = [];
    if (!fullName || fullName.length < 3) errors.push('Full name required (min 3 chars)');
    if (!['male', 'female', 'other'].includes(gender)) errors.push('Valid gender required');
    if (!addressLine1 || addressLine1.length < 10) errors.push('Address required (min 10 chars)');
    if (!city) errors.push('City required');
    if (!taluka) errors.push('Taluka required');
    if (!district) errors.push('District required');
    if (!state) errors.push('State required');
    if (!/^\d{6}$/.test(pincode)) errors.push('Valid 6-digit pincode required');
    if (!/^\d{10}$/.test(mobileNumber)) errors.push('Valid 10-digit mobile required');

    if (errors.length > 0) {
      return NextResponse.json({ error: 'Validation failed', errors }, { status: 400 });
    }

    // ============ CHECK EXISTING VERIFICATION ============
    const existingVerification = await verificationsCollection.findOne(
      { userId: new mongoose.Types.ObjectId(userId) },
      { sort: { createdAt: -1 } }
    );

    const now = new Date();

    // ============ UPLOAD DOCUMENTS TO CLOUDINARY ============
    let aadhaarCardImage = existingVerification?.aadhaarCardImage || null;
    let panCardImage = existingVerification?.panCardImage || null;

    if (aadhaarFile && aadhaarFile.size > 0) {
      console.log('Uploading Aadhaar card...');
      aadhaarCardImage = await uploadToCloudinary(aadhaarFile, 'aadhaar');
      uploadedFiles.push(aadhaarCardImage.publicId);
    }

    if (panFile && panFile.size > 0) {
      console.log('Uploading PAN card...');
      panCardImage = await uploadToCloudinary(panFile, 'pan');
      uploadedFiles.push(panCardImage.publicId);
    }

    // ============ PREPARE BIOMETRIC SELFIES ============
    let biometricSelfies = existingVerification?.biometricSelfies || {};
    
    if (faceImageUrls.length >= 4) {
      biometricSelfies = {
        front: { secureUrl: faceImageUrls[0], capturedAt: now },
        left: { secureUrl: faceImageUrls[1], capturedAt: now },
        right: { secureUrl: faceImageUrls[2], capturedAt: now },
        up: { secureUrl: faceImageUrls[3], capturedAt: now },
        capturedAt: now
      };
    }

    // Primary selfie (front view)
    const biometricSelfie = {
      secureUrl: faceImageUrls[0] || existingVerification?.biometricSelfie?.secureUrl,
      capturedAt: now,
      faceDetected: true,
      faceConfidence: aiVerificationResults.faceVerification?.result?.real_probability || null
    };

    // ============ CALCULATE AI DECISION ============
    let finalOverallScore = 70;
    let aiDecision = 'REVIEW';

    // Factor in face verification
    if (aiVerificationResults.faceVerification?.result?.decision === 'PASS') {
      finalOverallScore += 10;
    } else if (aiVerificationResults.faceVerification?.result?.decision === 'SUSPECT') {
      finalOverallScore -= 20;
    }

    // Factor in manipulation detection
    if (aiVerificationResults.manipulationDetection?.panCard?.result?.decision === 'PASS') {
      finalOverallScore += 10;
    } else if (aiVerificationResults.manipulationDetection?.panCard?.result?.decision === 'FAIL') {
      finalOverallScore -= 30;
    }

    // Factor in behavioral analysis
    const behaviorBotLikelihood = behaviorData.botLikelihood || 50;
    if (behaviorBotLikelihood > 60) {
      finalOverallScore -= 25;
    } else if (behaviorBotLikelihood > 40) {
      finalOverallScore -= 10;
    } else if (behaviorBotLikelihood < 25) {
      finalOverallScore += 5;
    }

    // Determine AI decision
    finalOverallScore = Math.max(0, Math.min(100, finalOverallScore));
    if (finalOverallScore >= 75) {
      aiDecision = 'PASS';
    } else if (finalOverallScore >= 50) {
      aiDecision = 'REVIEW';
    } else {
      aiDecision = 'REJECT';
    }

    // ============ BUILD VERIFICATION DOCUMENT ============
    const verificationData = {
      userId: new mongoose.Types.ObjectId(userId),
      fullName,
      gender,
      documentIdNumber,
      
      // Document images
      aadhaarCardImage,
      panCardImage,
      
      // Biometric selfies
      biometricSelfies,
      biometricSelfie,
      
      // Address
      addressLine1,
      addressLine2,
      city,
      taluka,
      district,
      state,
      pincode,
      
      // Contact
      mobileNumber,
      
      // Behavioral Analysis - will be updated after saving
      behavioralAnalysisId: null,
      behaviorSummary: {
        overallTrustScore: behaviorData.overallTrustScore || 50,
        botLikelihood: behaviorData.botLikelihood || 50,
        riskLevel: behaviorData.riskLevel || 'medium',
        isHuman: (behaviorData.botLikelihood || 50) < 40,
        recommendation: behaviorData.recommendation || 'standard_flow'
      },
      
      // AI Verification Results
      aiVerificationResults: {
        faceVerification: aiVerificationResults.faceVerification ? {
          model: aiVerificationResults.faceVerification.model || 'face_liveness_v1',
          timestamp: new Date(aiVerificationResults.faceVerification.timestamp) || now,
          result: aiVerificationResults.faceVerification.result,
          faceImageUrls: faceImageUrls,
          verified: aiVerificationResults.faceVerification.result?.decision === 'PASS'
        } : undefined,
        
        panCardOCR: aiVerificationResults.panCardOCR ? {
          model: aiVerificationResults.panCardOCR.model || 'pan_ocr_v1',
          timestamp: new Date(aiVerificationResults.panCardOCR.timestamp) || now,
          result: aiVerificationResults.panCardOCR.result,
          imageUrl: aiVerificationResults.panCardOCR.imageUrl,
          verified: aiVerificationResults.panCardOCR.result?.detected === true
        } : undefined,
        
        manipulationDetection: {
          panCard: aiVerificationResults.manipulationDetection?.panCard ? {
            model: aiVerificationResults.manipulationDetection.panCard.model || 'manipulation_detect_v1',
            timestamp: new Date(aiVerificationResults.manipulationDetection.panCard.timestamp) || now,
            result: aiVerificationResults.manipulationDetection.panCard.result,
            imageUrl: aiVerificationResults.manipulationDetection.panCard.imageUrl,
            verified: aiVerificationResults.manipulationDetection.panCard.result?.decision === 'PASS'
          } : undefined,
          aadhaarCard: aiVerificationResults.manipulationDetection?.aadhaarCard || undefined
        },
        
        overallScore: finalOverallScore,
        aiDecision: aiDecision,
        verifiedAt: now
      },
      
      // Status
      status: 'submitted',
      submittedAt: now,
      updatedAt: now
    };

    // ============ SAVE VERIFICATION ============
    let verificationId;

    if (existingVerification) {
      console.log('Updating existing verification...');
      await verificationsCollection.updateOne(
        { _id: existingVerification._id },
        { 
          $set: verificationData,
          $push: {
            statusHistory: {
              status: 'submitted',
              changedAt: now,
              remarks: `Resubmitted. AI Score: ${finalOverallScore}%, Decision: ${aiDecision}`
            }
          }
        }
      );
      verificationId = existingVerification._id;
    } else {
      console.log('Creating new verification...');
      verificationData.createdAt = now;
      verificationData.statusHistory = [{
        status: 'submitted',
        changedAt: now,
        remarks: `Initial submission. AI Score: ${finalOverallScore}%, Decision: ${aiDecision}`
      }];
      const result = await verificationsCollection.insertOne(verificationData);
      verificationId = result.insertedId;
    }

    console.log('✅ Verification saved:', verificationId.toString());

    // ============ SAVE BEHAVIORAL ANALYSIS SEPARATELY ============
    const behavioralResult = await saveBehavioralAnalysis(
      db,
      userId,
      verificationId.toString(),
      behaviorData
    );

    // Update verification with behavioral analysis reference
    await verificationsCollection.updateOne(
      { _id: verificationId },
      {
        $set: {
          behavioralAnalysisId: behavioralResult.analysisId,
          behaviorSummary: behavioralResult.summary
        }
      }
    );

    console.log('✅ Behavioral analysis saved:', behavioralResult.analysisId.toString());
    console.log('📊 Behavior Summary:', behavioralResult.summary);

    // ============ RETURN SUCCESS ============
    return NextResponse.json({
      success: true,
      verificationId: verificationId.toString(),
      behavioralAnalysisId: behavioralResult.analysisId.toString(),
      message: 'Verification submitted successfully',
      aiDecision: aiDecision,
      overallScore: finalOverallScore,
      behavioralAnalysis: behavioralResult.summary
    });

  } catch (error) {
    console.error('❌ Verification submit error:', error);
    
    // Cleanup uploaded files on error
    for (const publicId of uploadedFiles) {
      try {
        await cloudinary.uploader.destroy(publicId);
        console.log('Cleaned up:', publicId);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}