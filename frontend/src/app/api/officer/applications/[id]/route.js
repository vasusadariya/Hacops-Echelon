import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

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

export async function GET(request, context) {
  console.log('=== Get Single Application API ===');
  
  try {
    const { id } = await context.params;
    const cleanId = id?.trim();
    
    console.log('Requested ID:', cleanId);

    if (!cleanId) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
    }

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
    
    const user = await db.collection('users').findOne({ 
      _id: new mongoose.Types.ObjectId(decoded.userId) 
    });

    if (!user || user.role !== 'officer') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(cleanId);
    
    if (!isValidObjectId) {
      console.log('Invalid ObjectId format:', cleanId);
      
      const allApps = await db.collection('verifications').find({}).limit(100).toArray();
      const matchByPartial = allApps.find(app => 
        app._id.toString().endsWith(cleanId) || 
        app._id.toString().includes(cleanId) ||
        cleanId.includes(app._id.toString().slice(-8))
      );
      
      if (matchByPartial) {
        console.log('Found by partial match:', matchByPartial._id);
        // Continue with this ID
        return await fetchFullApplicationData(db, matchByPartial._id.toString(), matchByPartial);
      }
      
      return NextResponse.json({ error: 'Invalid application ID format' }, { status: 400 });
    }

    // Find application
    const application = await db.collection('verifications').findOne({
      _id: new mongoose.Types.ObjectId(cleanId)
    });

    if (!application) {
      console.log('Application not found for ID:', cleanId);
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return await fetchFullApplicationData(db, cleanId, application);

  } catch (error) {
    console.error('Get application error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function fetchFullApplicationData(db, applicationId, application) {
  // ============ FETCH VERIFICATION RESULTS FROM verificationresults COLLECTION ============
  let verificationResults = null;
  
  try {
    // Try to find by verificationId first (this links to the verification/application)
    verificationResults = await db.collection('verificationresults').findOne({
      verificationId: new mongoose.Types.ObjectId(applicationId)
    });
    
    if (verificationResults) {
      console.log('📊 Found VerificationResults by verificationId:', verificationResults._id);
    }
  } catch (e) {
    console.log('Could not fetch by verificationId:', e.message);
  }
  
  // If not found by verificationId, try by userId
  if (!verificationResults && application.userId) {
    try {
      verificationResults = await db.collection('verificationresults').findOne(
        { userId: new mongoose.Types.ObjectId(application.userId) },
        { sort: { createdAt: -1 } }
      );
      
      if (verificationResults) {
        console.log('📊 Found VerificationResults by userId:', verificationResults._id);
      }
    } catch (e) {
      console.log('Could not fetch by userId:', e.message);
    }
  }

  // ============ FETCH BEHAVIORAL ANALYSIS ============
  let detailedBehavioralAnalysis = null;
  
  if (application.behavioralAnalysisId) {
    try {
      detailedBehavioralAnalysis = await db.collection('behavioralanalyses').findOne({
        _id: new mongoose.Types.ObjectId(application.behavioralAnalysisId)
      });
      console.log('📊 Fetched detailed behavioral analysis');
    } catch (e) {
      console.log('Could not fetch behavioral analysis:', e.message);
    }
  }
  
  if (!detailedBehavioralAnalysis) {
    try {
      detailedBehavioralAnalysis = await db.collection('behavioralanalyses').findOne({
        verificationId: new mongoose.Types.ObjectId(applicationId)
      });
      if (detailedBehavioralAnalysis) {
        console.log('📊 Found behavioral analysis by verificationId');
      }
    } catch (e) {
      console.log('Could not fetch behavioral analysis by verificationId:', e.message);
    }
  }

  // ============ BUILD RESPONSE WITH FULL VERIFICATION RESULTS ============
  const response = {
    ...application,
    _id: application._id.toString(),
    
    // ============ FULL VERIFICATION RESULTS FROM ML MODELS ============
    verificationResults: verificationResults ? {
      _id: verificationResults._id?.toString(),
      sessionId: verificationResults.sessionId,
      status: verificationResults.status,
      
      // -------- FACE VERIFICATION (Deepfake Detection) --------
      faceVerification: verificationResults.faceVerification ? {
        biometric_type: verificationResults.faceVerification.biometric_type || 'face',
        model: verificationResults.faceVerification.model,
        timestamp: verificationResults.faceVerification.timestamp,
        result: {
          num_frames: verificationResults.faceVerification.result?.num_frames || 0,
          fake_probability: verificationResults.faceVerification.result?.fake_probability || 0,
          real_probability: verificationResults.faceVerification.result?.real_probability || 0,
          decision: verificationResults.faceVerification.result?.decision || 'PENDING'
        },
        faceImageUrls: verificationResults.faceVerification.faceImageUrls || [],
        verified: verificationResults.faceVerification.verified || false
      } : null,
      
      // -------- PAN CARD OCR --------
      panCardOCR: verificationResults.panCardOCR ? {
        biometric_type: verificationResults.panCardOCR.biometric_type || 'pan_card',
        model: verificationResults.panCardOCR.model,
        timestamp: verificationResults.panCardOCR.timestamp,
        result: {
          detected: verificationResults.panCardOCR.result?.detected || false,
          boxes: verificationResults.panCardOCR.result?.boxes || [],
          text_data: verificationResults.panCardOCR.result?.text_data || []
        },
        imageUrl: verificationResults.panCardOCR.imageUrl,
        verified: verificationResults.panCardOCR.verified || false,
        extractedData: {
          panNumber: verificationResults.panCardOCR.extractedData?.panNumber || '',
          name: verificationResults.panCardOCR.extractedData?.name || '',
          dateOfBirth: verificationResults.panCardOCR.extractedData?.dateOfBirth || '',
          fatherName: verificationResults.panCardOCR.extractedData?.fatherName || ''
        }
      } : null,
      
      // -------- AADHAAR CARD OCR --------
      aadhaarCardOCR: verificationResults.aadhaarCardOCR ? {
        biometric_type: verificationResults.aadhaarCardOCR.biometric_type || 'aadhar_card',
        model: verificationResults.aadhaarCardOCR.model,
        timestamp: verificationResults.aadhaarCardOCR.timestamp,
        result: {
          detected: verificationResults.aadhaarCardOCR.result?.detected || false,
          extracted_fields: verificationResults.aadhaarCardOCR.result?.extracted_fields || {},
          raw_predictions: verificationResults.aadhaarCardOCR.result?.raw_predictions || []
        },
        imageUrl: verificationResults.aadhaarCardOCR.imageUrl,
        verified: verificationResults.aadhaarCardOCR.verified || false,
        extractedData: {
          aadhaarNumber: verificationResults.aadhaarCardOCR.extractedData?.aadhaarNumber || '',
          name: verificationResults.aadhaarCardOCR.extractedData?.name || '',
          gender: verificationResults.aadhaarCardOCR.extractedData?.gender || '',
          dateOfBirth: verificationResults.aadhaarCardOCR.extractedData?.dateOfBirth || '',
          address: verificationResults.aadhaarCardOCR.extractedData?.address || ''
        }
      } : null,
      
      // -------- MANIPULATION DETECTION (ELA + CNN) --------
      manipulationDetection: verificationResults.manipulationDetection ? {
        panCard: verificationResults.manipulationDetection.panCard ? {
          check_type: verificationResults.manipulationDetection.panCard.check_type || 'image_manipulation',
          method: verificationResults.manipulationDetection.panCard.method || 'ELA + CNN',
          timestamp: verificationResults.manipulationDetection.panCard.timestamp,
          result: {
            prediction: verificationResults.manipulationDetection.panCard.result?.prediction || 'Unknown',
            is_authentic: verificationResults.manipulationDetection.panCard.result?.is_authentic || false,
            confidence: verificationResults.manipulationDetection.panCard.result?.confidence || 0,
            raw_output: verificationResults.manipulationDetection.panCard.result?.raw_output || 0,
            decision: verificationResults.manipulationDetection.panCard.result?.decision || 'PENDING'
          },
          imageUrl: verificationResults.manipulationDetection.panCard.imageUrl,
          verified: verificationResults.manipulationDetection.panCard.verified || false
        } : null,
        aadhaarCard: verificationResults.manipulationDetection.aadhaarCard ? {
          check_type: verificationResults.manipulationDetection.aadhaarCard.check_type || 'image_manipulation',
          method: verificationResults.manipulationDetection.aadhaarCard.method || 'ELA + CNN',
          timestamp: verificationResults.manipulationDetection.aadhaarCard.timestamp,
          result: {
            prediction: verificationResults.manipulationDetection.aadhaarCard.result?.prediction || 'Unknown',
            is_authentic: verificationResults.manipulationDetection.aadhaarCard.result?.is_authentic || false,
            confidence: verificationResults.manipulationDetection.aadhaarCard.result?.confidence || 0,
            raw_output: verificationResults.manipulationDetection.aadhaarCard.result?.raw_output || 0,
            decision: verificationResults.manipulationDetection.aadhaarCard.result?.decision || 'PENDING'
          },
          imageUrl: verificationResults.manipulationDetection.aadhaarCard.imageUrl,
          verified: verificationResults.manipulationDetection.aadhaarCard.verified || false
        } : null
      } : null,
      
      // -------- OVERALL ASSESSMENT --------
      overallAssessment: verificationResults.overallAssessment ? {
        totalScore: verificationResults.overallAssessment.totalScore || 0,
        passedChecks: verificationResults.overallAssessment.passedChecks || 0,
        failedChecks: verificationResults.overallAssessment.failedChecks || 0,
        reviewRequiredChecks: verificationResults.overallAssessment.reviewRequiredChecks || 0,
        finalDecision: verificationResults.overallAssessment.finalDecision || 'PENDING',
        riskLevel: verificationResults.overallAssessment.riskLevel || 'MEDIUM',
        confidence: verificationResults.overallAssessment.confidence || 0,
        summary: verificationResults.overallAssessment.summary || '',
        issues: verificationResults.overallAssessment.issues || [],
        recommendations: verificationResults.overallAssessment.recommendations || []
      } : null,
      
      // -------- PROCESSING TIME --------
      processingTime: verificationResults.processingTime ? {
        total: verificationResults.processingTime.total || 0,
        faceVerification: verificationResults.processingTime.faceVerification || 0,
        panOCR: verificationResults.processingTime.panOCR || 0,
        aadhaarOCR: verificationResults.processingTime.aadhaarOCR || 0,
        manipulationCheck: verificationResults.processingTime.manipulationCheck || 0
      } : null,
      
      // -------- ERRORS --------
      errors: verificationResults.errors || [],
      
      // -------- TIMESTAMPS --------
      processedBy: verificationResults.processedBy || 'automated_system',
      startedAt: verificationResults.startedAt,
      completedAt: verificationResults.completedAt,
      createdAt: verificationResults.createdAt,
      updatedAt: verificationResults.updatedAt
    } : null,
    
    // ============ BEHAVIORAL ANALYSIS ============
    detailedBehavioralAnalysis: detailedBehavioralAnalysis ? {
      _id: detailedBehavioralAnalysis._id?.toString(),
      overallTrustScore: detailedBehavioralAnalysis.overallTrustScore,
      botLikelihood: detailedBehavioralAnalysis.botLikelihood,
      riskLevel: detailedBehavioralAnalysis.riskLevel,
      recommendation: detailedBehavioralAnalysis.recommendation,
      isHuman: detailedBehavioralAnalysis.isHuman,
      confidence: detailedBehavioralAnalysis.confidence,
      flagsDetected: detailedBehavioralAnalysis.flagsDetected || [],
      flagCount: detailedBehavioralAnalysis.flagCount || 0,
      componentScores: detailedBehavioralAnalysis.componentScores,
      keystrokeAnalysis: detailedBehavioralAnalysis.keystrokeAnalysis,
      mouseAnalysis: detailedBehavioralAnalysis.mouseAnalysis,
      pasteAnalysis: detailedBehavioralAnalysis.pasteAnalysis,
      speedAnalysis: detailedBehavioralAnalysis.speedAnalysis,
      rawMetrics: detailedBehavioralAnalysis.rawMetrics,
      analyzedAt: detailedBehavioralAnalysis.analyzedAt
    } : null,
    
    // ============ BEHAVIOR SUMMARY (for backward compatibility) ============
    behaviorSummary: application.behaviorSummary || {
      overallTrustScore: application.behaviorAnalysis?.riskScore ? (100 - application.behaviorAnalysis.riskScore) : 50,
      botLikelihood: application.behaviorAnalysis?.riskScore || 50,
      riskLevel: (application.behaviorAnalysis?.riskScore || 0) >= 70 ? 'high' : 
                 (application.behaviorAnalysis?.riskScore || 0) >= 40 ? 'medium' : 'low',
      isHuman: !(application.behaviorAnalysis?.suspiciousActivity || false),
      recommendation: (application.behaviorAnalysis?.riskScore || 0) > 50 ? 'manual_review' : 'auto_approve'
    }
  };

  console.log('✅ Application found:', application._id);
  console.log('✅ Has VerificationResults:', !!verificationResults);
  console.log('✅ Has Behavioral Analysis:', !!detailedBehavioralAnalysis);
  
  return NextResponse.json(response);
}