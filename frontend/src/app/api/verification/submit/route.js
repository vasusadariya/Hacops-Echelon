import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MONGODB_URI = process.env.MONGODB_URI;

async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection.db;
  }
  await mongoose.connect(MONGODB_URI);
  return mongoose.connection.db;
}

function verifyToken(token) {
  try {
    const jwt = require('jsonwebtoken');
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  } catch {
    return null;
  }
}

// Upload file to Cloudinary
async function uploadToCloudinary(file, folder) {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${base64}`;
    
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: folder,
      resource_type: 'auto',
    });
    
    return {
      publicId: result.public_id,
      secureUrl: result.secure_url,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload to Cloudinary: ${error.message}`);
  }
}

// Upload base64 image to Cloudinary
async function uploadBase64ToCloudinary(base64Data, folder) {
  try {
    const result = await cloudinary.uploader.upload(base64Data, {
      folder: folder,
      resource_type: 'auto',
    });
    
    return {
      publicId: result.public_id,
      secureUrl: result.secure_url,
    };
  } catch (error) {
    console.error('Cloudinary base64 upload error:', error);
    throw new Error(`Failed to upload to Cloudinary: ${error.message}`);
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
    
    // Detailed analysis
    keystrokeAnalysis: {
      totalKeystrokes: keystrokeAnalysis.totalKeystrokes || 0,
      avgIntervalMs: keystrokeAnalysis.avgIntervalMs || 0,
      typingVariance: keystrokeAnalysis.typingVariance || 0,
      stdDeviation: keystrokeAnalysis.stdDeviation || 0,
      correctionRate: keystrokeAnalysis.correctionRate || 0,
      corrections: keystrokeAnalysis.corrections || 0,
      trustScore: keystrokeAnalysis.trustScore || 50,
      flags: keystrokeAnalysis.flags || {},
      insufficient_data: keystrokeAnalysis.insufficient_data || false
    },
    
    mouseAnalysis: {
      totalMovements: mouseAnalysis.totalMovements || 0,
      linearSegments: mouseAnalysis.linearSegments || 0,
      linearityRatio: mouseAnalysis.linearityRatio || 0,
      pathEfficiency: mouseAnalysis.pathEfficiency || 0,
      totalDistance: mouseAnalysis.totalDistance || 0,
      trustScore: mouseAnalysis.trustScore || 50,
      flags: mouseAnalysis.flags || {},
      insufficient_data: mouseAnalysis.insufficient_data || false
    },
    
    pasteAnalysis: {
      totalFields: pasteAnalysis.totalFields || 0,
      pastedFields: pasteAnalysis.pastedFields || 0,
      pastePercentage: pasteAnalysis.pastePercentage || 0,
      criticalFieldsPasted: pasteAnalysis.criticalFieldsPasted || 0,
      trustScore: pasteAnalysis.trustScore || 50,
      flags: pasteAnalysis.flags || {},
      insufficient_data: pasteAnalysis.insufficient_data || false
    },
    
    speedAnalysis: {
      totalTimeSeconds: speedAnalysis.totalTimeSeconds || 0,
      timePerFieldSeconds: speedAnalysis.timePerFieldSeconds || 0,
      fieldCount: speedAnalysis.fieldCount || 0,
      pauseCount: speedAnalysis.pauseCount || 0,
      trustScore: speedAnalysis.trustScore || 50,
      flags: speedAnalysis.flags || {},
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

  // Insert new document
  const result = await behavioralAnalysisCollection.insertOne(analysisDocument);
  
  console.log('📊 Behavioral analysis saved:', result.insertedId.toString());

  return {
    analysisId: result.insertedId,
    summary: {
      overallTrustScore: Math.round(overallTrustScore),
      botLikelihood: Math.round(botLikelihood),
      riskLevel,
      isHuman,
      recommendation
    }
  };
}

export async function POST(request) {
  console.log('=== Verification Submit API Called ===');
  
  try {
    // Auth check
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const db = await connectToDatabase();
    const userId = new mongoose.Types.ObjectId(decoded.userId);

    // Parse form data
    const formData = await request.formData();
    
    // Extract fields
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
    
    // Extract files
    const aadhaarCard = formData.get('aadhaarCard');
    const panCard = formData.get('panCard');
    
    // Extract face captures (base64 JSON)
    const faceCapturesStr = formData.get('faceCaptures');
    let faceCaptures = null;
    try {
      faceCaptures = JSON.parse(faceCapturesStr);
    } catch (e) {
      console.log('Failed to parse face captures');
    }

    // Extract behavior data
    const behaviorDataStr = formData.get('behaviorData');
    let behaviorData = {};
    try {
      behaviorData = JSON.parse(behaviorDataStr);
      console.log('📊 Behavioral data received:', {
        overallTrustScore: behaviorData.overallTrustScore,
        botLikelihood: behaviorData.botLikelihood,
        riskLevel: behaviorData.riskLevel,
        flagsCount: behaviorData.flagsDetected?.length || 0
      });
    } catch (e) {
      console.log('No behavior data');
    }

    console.log('Form data received:', { fullName, gender, city, state });

    // Validate required fields
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

    console.log('Uploading documents to Cloudinary...');

    // Upload documents to Cloudinary
    let aadhaarUpload, panUpload;
    try {
      [aadhaarUpload, panUpload] = await Promise.all([
        uploadToCloudinary(aadhaarCard, 'verifications/aadhaar'),
        uploadToCloudinary(panCard, 'verifications/pan'),
      ]);
      console.log('Documents uploaded successfully');
    } catch (uploadError) {
      console.error('Document upload failed:', uploadError);
      return NextResponse.json({ error: 'Failed to upload documents: ' + uploadError.message }, { status: 500 });
    }

    // Upload face captures if available
    let biometricSelfies = {};
    if (faceCaptures) {
      console.log('Uploading face captures...');
      try {
        for (const angle of ['front', 'left', 'right', 'up']) {
          if (faceCaptures[angle]) {
            const result = await uploadBase64ToCloudinary(faceCaptures[angle], 'verifications/selfies');
            biometricSelfies[angle] = result;
          }
        }
        console.log('Face captures uploaded successfully');
      } catch (faceError) {
        console.error('Face upload failed:', faceError);
        // Continue without face uploads - don't fail the whole submission
      }
    }

    const now = new Date();

    // Create verification document (WITHOUT detailed behavioral analysis)
    const verificationData = {
      userId,
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
      
      // Behavioral analysis reference (will be updated after saving)
      behavioralAnalysisId: null,
      behaviorSummary: {
        overallTrustScore: behaviorData.overallTrustScore || 50,
        botLikelihood: behaviorData.botLikelihood || 50,
        riskLevel: behaviorData.riskLevel || 'medium',
        isHuman: (behaviorData.botLikelihood || 50) < 40,
        recommendation: behaviorData.recommendation || 'standard_flow'
      },
      
      // Legacy behavior analysis (for backward compatibility)
      behaviorAnalysis: {
        typingSpeed: behaviorData.keystrokeAnalysis?.avgIntervalMs ? Math.round(60000 / behaviorData.keystrokeAnalysis.avgIntervalMs) : 0,
        mouseMovements: behaviorData.rawMetrics?.totalMouseMovements || 0,
        totalTimeSpent: behaviorData.speedAnalysis?.totalTimeSeconds || Math.round((behaviorData.rawMetrics?.sessionDurationMs || 0) / 1000),
        riskScore: behaviorData.botLikelihood || 0,
        suspiciousActivity: (behaviorData.botLikelihood || 0) > 50,
      },
      
      status: 'submitted',
      statusHistory: [
        {
          status: 'submitted',
          changedAt: now,
          remarks: `Application submitted. Trust: ${behaviorData.overallTrustScore || 50}, Bot: ${behaviorData.botLikelihood || 50}%`
        }
      ],
      submittedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    // Insert verification into database
    const result = await db.collection('verifications').insertOne(verificationData);
    const verificationId = result.insertedId;

    console.log('✅ Verification created:', verificationId.toString());

    // ============ SAVE BEHAVIORAL ANALYSIS SEPARATELY ============
    const behavioralResult = await saveBehavioralAnalysis(
      db,
      userId.toString(),
      verificationId.toString(),
      behaviorData
    );

    // Update verification with behavioral analysis reference
    await db.collection('verifications').updateOne(
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

    // Update user record
    await db.collection('users').updateOne(
      { _id: userId },
      {
        $set: {
          verificationStatus: 'submitted',
          verificationId: verificationId,
          updatedAt: now,
        }
      }
    );

    // Trigger AI verification (async)
    triggerAIVerification(verificationId.toString());

    // ============ RETURN SUCCESS ============
    return NextResponse.json({
      success: true,
      verificationId: verificationId.toString(),
      behavioralAnalysisId: behavioralResult.analysisId.toString(),
      status: 'submitted',
      behavioralAnalysis: behavioralResult.summary
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
      const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      await fetch(`${baseUrl}/api/verification/ai-process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationId }),
      });
      console.log('AI verification triggered for:', verificationId);
    } catch (e) {
      console.error('Failed to trigger AI verification:', e);
    }
  }, 2000);
}