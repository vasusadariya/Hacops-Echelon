import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';
import { uploadSelfieBase64, uploadDocument, deleteFromCloudinary } from '@/lib/cloudinary';
import Result from '@/models/result';

// ============ HELPER FUNCTIONS ============

// Verify reCAPTCHA token
async function verifyRecaptcha(token) {
  if (!token) {
    console.warn('No reCAPTCHA token provided');
    return true; // Skip in development
  }
  
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) {
    console.warn('No RECAPTCHA_SECRET_KEY configured');
    return true; // Skip if not configured
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${secretKey}&response=${token}`
    });
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('reCAPTCHA error:', error);
    return false;
  }
}

// Analyze behavior data for bot detection
function analyzeBehavior(data) {
  if (!data) {
    return {
      typingSpeed: 0,
      mouseMovements: 0,
      totalTimeSpent: 0,
      suspiciousActivity: false,
      riskScore: 0
    };
  }

  let riskScore = 0;
  if (data.typingSpeed > 600) riskScore += 30;
  if (data.mouseMovements < 10) riskScore += 25;
  if (data.totalTimeSpent < 30) riskScore += 35;

  return {
    typingSpeed: data.typingSpeed || 0,
    mouseMovements: data.mouseMovements || 0,
    totalTimeSpent: data.totalTimeSpent || 0,
    suspiciousActivity: riskScore > 50,
    riskScore: Math.min(riskScore, 100)
  };
}

// Convert file to buffer
async function fileToBuffer(file) {
  const bytes = await file.arrayBuffer();
  return Buffer.from(bytes);
}

// Process Cloudinary upload result for documents
function processDocumentUpload(result, filename) {
  return {
    publicId: result.public_id,
    secureUrl: result.secure_url,
    url: result.url,
    format: result.format,
    width: result.width,
    height: result.height,
    bytes: result.bytes,
    originalFilename: filename || 'document',
    createdAt: new Date()
  };
}

// Process Cloudinary upload result for face images
function processFaceUpload(result) {
  return {
    publicId: result.public_id,
    secureUrl: result.secure_url,
    url: result.url,
    format: result.format,
    width: result.width,
    height: result.height,
    bytes: result.bytes,
    capturedAt: new Date()
  };
}

// ============ MAIN HANDLER ============

export async function POST(request) {
  const uploadedFiles = []; // Track uploaded files for cleanup on error

  try {
    console.log('=== Verification Submit Started ===');

    // ============ AUTHENTICATION ============
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const userId = decoded.userId;
    console.log('User ID:', userId);

    // ============ DATABASE CONNECTION ============
    await connectDB();
    console.log('MongoDB connected');

    // ============ PARSE FORM DATA ============
    const formData = await request.formData();
    console.log('Form data received');

    // ============ RECAPTCHA VERIFICATION ============
    const recaptchaToken = formData.get('recaptchaToken');
    if (!(await verifyRecaptcha(recaptchaToken))) {
      return NextResponse.json({ error: 'reCAPTCHA verification failed' }, { status: 400 });
    }
    console.log('reCAPTCHA verified');

    // ============ EXTRACT FORM FIELDS ============
    const fullName = formData.get('fullName')?.trim() || '';
    const gender = formData.get('gender') || '';
    const documentIdNumber = (formData.get('documentIdNumber') || '').toUpperCase();
    const addressLine1 = formData.get('addressLine1') || '';
    const addressLine2 = formData.get('addressLine2') || '';
    const city = formData.get('city') || '';
    const taluka = formData.get('taluka') || '';
    const district = formData.get('district') || '';
    const state = formData.get('state') || '';
    const pincode = formData.get('pincode') || '';
    const mobileNumber = formData.get('mobileNumber') || '';

    // Get document files
    const aadhaarFile = formData.get('aadhaarCard');
    const panFile = formData.get('panCard');

    // Parse behavior data
    let behaviorData = {};
    try {
      behaviorData = JSON.parse(formData.get('behaviorData') || '{}');
    } catch {}
    const behaviorAnalysis = analyzeBehavior(behaviorData);

    // Parse AI verification results
    let aiVerificationResults = {};
    const aiResultsJson = formData.get('aiVerificationResults');
    if (aiResultsJson) {
      try {
        aiVerificationResults = JSON.parse(aiResultsJson);
        console.log('AI Verification Results received:', {
          faceVerification: !!aiVerificationResults.faceVerification,
          panCardOCR: !!aiVerificationResults.panCardOCR,
          manipulationDetection: !!aiVerificationResults.manipulationDetection
        });
      } catch (e) {
        console.warn('Failed to parse AI verification results:', e);
      }
    }

    // ============ PARSE FACE CAPTURES (4 ANGLES) ============
    let faceCaptures = {};
    
    // Try to get from JSON first
    const faceCapturesJson = formData.get('faceCaptures');
    if (faceCapturesJson) {
      try {
        faceCaptures = JSON.parse(faceCapturesJson);
      } catch {
        console.warn('Failed to parse faceCaptures JSON');
      }
    }
    
    // Fallback to individual fields
    if (!faceCaptures.front) {
      faceCaptures = {
        front: formData.get('selfieFront') || '',
        left: formData.get('selfieLeft') || '',
        right: formData.get('selfieRight') || '',
        up: formData.get('selfieUp') || ''
      };
    }

    console.log('Form fields extracted');
    console.log('Face captures present:', {
      front: !!faceCaptures.front,
      left: !!faceCaptures.left,
      right: !!faceCaptures.right,
      up: !!faceCaptures.up
    });

    // ============ VALIDATION ============
    const errors = [];

    // Personal info validation
    if (!fullName || fullName.length < 3) {
      errors.push('Full name must be at least 3 characters');
    }
    if (!['male', 'female', 'other'].includes(gender)) {
      errors.push('Please select a valid gender');
    }
    if (!documentIdNumber || documentIdNumber.length < 8) {
      errors.push('Document ID must be at least 8 characters');
    }

    // Address validation
    if (!addressLine1 || addressLine1.length < 10) {
      errors.push('Address Line 1 must be at least 10 characters');
    }
    if (!city) errors.push('City is required');
    if (!taluka) errors.push('Taluka is required');
    if (!district) errors.push('District is required');
    if (!state) errors.push('State is required');
    if (!/^\d{6}$/.test(pincode)) {
      errors.push('Pincode must be exactly 6 digits');
    }
    if (!/^\d{10}$/.test(mobileNumber)) {
      errors.push('Mobile number must be exactly 10 digits');
    }

    // Document file validation
    if (!aadhaarFile || aadhaarFile.size === 0) {
      errors.push('Aadhaar card image is required');
    } else if (aadhaarFile.size > 2 * 1024 * 1024) {
      errors.push('Aadhaar card image must be less than 2MB');
    }

    if (!panFile || panFile.size === 0) {
      errors.push('PAN card image is required');
    } else if (panFile.size > 2 * 1024 * 1024) {
      errors.push('PAN card image must be less than 2MB');
    }

    // Face captures validation
    if (!faceCaptures.front || faceCaptures.front.length < 100) {
      errors.push('Front face photo is required');
    }
    if (!faceCaptures.left || faceCaptures.left.length < 100) {
      errors.push('Left face photo is required');
    }
    if (!faceCaptures.right || faceCaptures.right.length < 100) {
      errors.push('Right face photo is required');
    }
    if (!faceCaptures.up || faceCaptures.up.length < 100) {
      errors.push('Up face photo is required');
    }

    if (errors.length > 0) {
      console.log('Validation errors:', errors);
      return NextResponse.json({ errors }, { status: 400 });
    }

    console.log('Validation passed');

    // ============ UPLOAD FILES TO CLOUDINARY ============
    const uniqueId = uuidv4();

    // Upload Aadhaar
    console.log('Uploading Aadhaar card...');
    const aadhaarBuffer = await fileToBuffer(aadhaarFile);
    const aadhaarResult = await uploadDocument(aadhaarBuffer, 'aadhaar', uniqueId);
    uploadedFiles.push(aadhaarResult.public_id);
    const aadhaarImage = processDocumentUpload(aadhaarResult, aadhaarFile.name);
    console.log('Aadhaar uploaded:', aadhaarResult.public_id);

    // Upload PAN
    console.log('Uploading PAN card...');
    const panBuffer = await fileToBuffer(panFile);
    const panResult = await uploadDocument(panBuffer, 'pan', uniqueId);
    uploadedFiles.push(panResult.public_id);
    const panImage = processDocumentUpload(panResult, panFile.name);
    console.log('PAN uploaded:', panResult.public_id);

    // Upload all 4 face images
    console.log('Uploading face captures...');
    const faceImages = {};
    const faceTypes = ['front', 'left', 'right', 'up'];

    for (const faceType of faceTypes) {
      console.log(`Uploading ${faceType} face...`);
      try {
        const result = await uploadSelfieBase64(
          faceCaptures[faceType], 
          `${uniqueId}_${faceType}`
        );
        uploadedFiles.push(result.public_id);
        faceImages[faceType] = processFaceUpload(result);
        console.log(`${faceType} face uploaded:`, result.public_id);
      } catch (uploadError) {
        console.error(`Failed to upload ${faceType} face:`, uploadError);
        throw new Error(`Failed to upload ${faceType} face photo`);
      }
    }

    console.log('All files uploaded successfully');

    // ============ DATABASE OPERATIONS ============
    const db = mongoose.connection.db;
    const verificationsCollection = db.collection('verifications');

    // Check for existing verification
    const existingVerification = await verificationsCollection.findOne({
      userId: new mongoose.Types.ObjectId(userId)
    });

    console.log('Existing verification:', existingVerification?.status || 'none');

    // Prevent duplicate submissions
    if (existingVerification && 
        ['submitted', 'under_automated_verification', 'under_officer_review', 'approved'].includes(existingVerification.status)) {
      // Cleanup uploaded files
      for (const publicId of uploadedFiles) {
        try { await deleteFromCloudinary(publicId); } catch {}
      }
      return NextResponse.json({
        error: 'You already have a pending or approved verification',
        status: existingVerification.status
      }, { status: 400 });
    }

    // Delete old images if resubmitting
    if (existingVerification) {
      console.log('Cleaning up old images...');
      const oldImages = [
        existingVerification.aadhaarCardImage?.publicId,
        existingVerification.panCardImage?.publicId,
        existingVerification.biometricSelfie?.publicId,
        existingVerification.biometricSelfies?.front?.publicId,
        existingVerification.biometricSelfies?.left?.publicId,
        existingVerification.biometricSelfies?.right?.publicId,
        existingVerification.biometricSelfies?.up?.publicId
      ].filter(Boolean);

      for (const publicId of oldImages) {
        try {
          await deleteFromCloudinary(publicId);
          console.log('Deleted old image:', publicId);
        } catch {}
      }
    }

    // Prepare verification document
    const now = new Date();
    
    // Calculate overall AI score and decision
    let overallScore = 0;
    let scoreCount = 0;
    
    if (aiVerificationResults.faceVerification) {
      const faceScore = aiVerificationResults.faceVerification.result.real_probability * 100;
      overallScore += faceScore;
      scoreCount++;
    }
    
    if (aiVerificationResults.manipulationDetection?.panCard) {
      const panScore = aiVerificationResults.manipulationDetection.panCard.result.confidence * 100;
      overallScore += panScore;
      scoreCount++;
    }
    
    if (aiVerificationResults.manipulationDetection?.aadhaarCard) {
      const aadhaarScore = aiVerificationResults.manipulationDetection.aadhaarCard.result.confidence * 100;
      overallScore += aadhaarScore;
      scoreCount++;
    }
    
    const finalOverallScore = scoreCount > 0 ? Math.round(overallScore / scoreCount) : 0;
    
    // Determine AI decision
    let aiDecision = 'REVIEW';
    if (finalOverallScore >= 80) {
      aiDecision = 'PASS';
    } else if (finalOverallScore < 50) {
      aiDecision = 'REJECT';
    }
    
    const verificationDoc = {
      userId: new mongoose.Types.ObjectId(userId),
      fullName,
      gender,
      documentIdNumber,
      aadhaarCardImage: aadhaarImage,
      panCardImage: panImage,
      
      // Multi-angle biometric selfies
      biometricSelfies: {
        front: faceImages.front,
        left: faceImages.left,
        right: faceImages.right,
        up: faceImages.up,
        capturedAt: now
      },
      
      // Primary selfie (front) for backward compatibility
      biometricSelfie: {
        ...faceImages.front,
        originalFilename: 'selfie_front.jpg',
        createdAt: now,
        faceDetected: true,
        faceConfidence: null
      },
      
      addressLine1,
      addressLine2,
      city,
      taluka,
      district,
      state,
      pincode,
      mobileNumber,
      behaviorAnalysis,
      
      // AI Verification Results
      aiVerificationResults: {
        ...aiVerificationResults,
        overallScore: finalOverallScore,
        aiDecision: aiDecision,
        verifiedAt: now
      },
      
      status: 'submitted',
      submittedAt: now,
      updatedAt: now,
      statusHistory: [
        ...(existingVerification?.statusHistory || []),
        {
          status: 'submitted',
          changedAt: now,
          remarks: `Application submitted with AI verification (Score: ${finalOverallScore}%, Decision: ${aiDecision})`
        }
      ]
    };

    // Save to database
    let verificationId;

    if (existingVerification) {
      console.log('Updating existing verification...');
      await verificationsCollection.updateOne(
        { _id: existingVerification._id },
        { $set: verificationDoc }
      );
      verificationId = existingVerification._id;
    } else {
      console.log('Creating new verification...');
      verificationDoc.createdAt = now;
      const result = await verificationsCollection.insertOne(verificationDoc);
      verificationId = result.insertedId;
    }

    console.log('=== Verification Submit Completed ===');
    console.log('Verification ID:', verificationId.toString());
    console.log('AI Verification Score:', finalOverallScore);
    console.log('AI Decision:', aiDecision);

    // ============ SAVE TO RESULT COLLECTION FOR ADMIN EVALUATION ============
    try {
      console.log('Creating admin evaluation result...');
      
      // Prepare flags for admin attention
      const flags = [];
      
      // Check face verification
      if (aiVerificationResults.faceVerification) {
        const faceResult = aiVerificationResults.faceVerification.result;
        if (faceResult.decision === 'SUSPECT') {
          flags.push({
            type: 'FACE_SUSPECT',
            severity: 'HIGH',
            message: `Face verification flagged as SUSPECT with ${(faceResult.fake_probability * 100).toFixed(1)}% fake probability`
          });
        } else if (faceResult.decision === 'REVIEW') {
          flags.push({
            type: 'MANUAL_REVIEW_REQUIRED',
            severity: 'MEDIUM',
            message: `Face verification requires review with ${(faceResult.real_probability * 100).toFixed(1)}% real probability`
          });
        }
      }
      
      // Check PAN manipulation
      if (aiVerificationResults.manipulationDetection?.panCard) {
        const panResult = aiVerificationResults.manipulationDetection.panCard.result;
        if (panResult.decision === 'FAIL' || !panResult.isAuthentic) {
          flags.push({
            type: 'MANIPULATION_DETECTED',
            severity: 'CRITICAL',
            message: `PAN card detected as ${panResult.prediction} with ${(panResult.confidence * 100).toFixed(1)}% confidence`
          });
        } else if (panResult.confidence < 0.7) {
          flags.push({
            type: 'LOW_CONFIDENCE',
            severity: 'MEDIUM',
            message: `PAN card authenticity check has low confidence: ${(panResult.confidence * 100).toFixed(1)}%`
          });
        }
      }
      
      // Check PAN OCR
      if (aiVerificationResults.panCardOCR) {
        const ocrResult = aiVerificationResults.panCardOCR.result;
        if (!ocrResult.detected) {
          flags.push({
            type: 'OCR_FAILED',
            severity: 'HIGH',
            message: 'PAN card OCR failed to detect card or extract text'
          });
        }
      }
      
      // Overall score check
      if (finalOverallScore < 50) {
        flags.push({
          type: 'MANUAL_REVIEW_REQUIRED',
          severity: 'CRITICAL',
          message: `Overall AI score is low: ${finalOverallScore}%`
        });
      } else if (finalOverallScore < 80) {
        flags.push({
          type: 'MANUAL_REVIEW_REQUIRED',
          severity: 'MEDIUM',
          message: `Overall AI score requires review: ${finalOverallScore}%`
        });
      }
      
      // Get user info from database
      const usersCollection = db.collection('users');
      const user = await usersCollection.findOne({ _id: new mongoose.Types.ObjectId(userId) });
      
      // Create result document for admin evaluation
      const resultDoc = new Result({
        verificationId: verificationId,
        userId: new mongoose.Types.ObjectId(userId),
        email: user?.email || 'unknown@email.com',
        fullName: fullName,
        
        documentUrls: {
          panCardUrl: panImage.secureUrl,
          faceImageUrls: [
            faceImages.front.secureUrl,
            faceImages.left.secureUrl,
            faceImages.right.secureUrl,
            faceImages.up.secureUrl
          ]
        },
        
        aiModelResults: {
          panCardOCR: aiVerificationResults.panCardOCR ? {
            model: aiVerificationResults.panCardOCR.model,
            timestamp: new Date(aiVerificationResults.panCardOCR.timestamp),
            detected: aiVerificationResults.panCardOCR.result.detected,
            textData: aiVerificationResults.panCardOCR.result.text_data,
            boxes: aiVerificationResults.panCardOCR.result.boxes,
            rawResponse: aiVerificationResults.panCardOCR
          } : undefined,
          
          panCardManipulation: aiVerificationResults.manipulationDetection?.panCard ? {
            model: 'ELA + CNN',
            timestamp: new Date(),
            prediction: aiVerificationResults.manipulationDetection.panCard.result.prediction,
            isAuthentic: aiVerificationResults.manipulationDetection.panCard.result.is_authentic,
            confidence: aiVerificationResults.manipulationDetection.panCard.result.confidence,
            decision: aiVerificationResults.manipulationDetection.panCard.result.decision,
            rawResponse: aiVerificationResults.manipulationDetection.panCard
          } : undefined,
          
          faceVerification: aiVerificationResults.faceVerification ? {
            model: aiVerificationResults.faceVerification.model,
            timestamp: new Date(aiVerificationResults.faceVerification.timestamp),
            numFrames: aiVerificationResults.faceVerification.result.num_frames,
            fakeProbability: aiVerificationResults.faceVerification.result.fake_probability,
            realProbability: aiVerificationResults.faceVerification.result.real_probability,
            decision: aiVerificationResults.faceVerification.result.decision,
            rawResponse: aiVerificationResults.faceVerification
          } : undefined
        },
        
        overallScore: finalOverallScore,
        aiDecision: aiDecision,
        
        adminReview: {
          status: 'PENDING'
        },
        
        flags: flags,
        
        submittedAt: now,
        
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      });
      
      await resultDoc.save();
      console.log('Admin evaluation result created:', resultDoc._id.toString());
      
    } catch (resultError) {
      console.error('Failed to create admin result:', resultError);
      // Don't fail the whole request if admin result creation fails
    }

    return NextResponse.json({
      success: true,
      message: 'Verification submitted successfully',
      verificationId: verificationId.toString(),
      status: 'submitted',
      aiVerification: {
        overallScore: finalOverallScore,
        decision: aiDecision
      },
      selfieUrls: {
        front: faceImages.front.secureUrl,
        left: faceImages.left.secureUrl,
        right: faceImages.right.secureUrl,
        up: faceImages.up.secureUrl
      }
    });

  } catch (error) {
    console.error('=== Verification Submit Error ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);

    // Cleanup uploaded files on error
    for (const publicId of uploadedFiles) {
      try {
        await deleteFromCloudinary(publicId);
        console.log('Cleaned up:', publicId);
      } catch {}
    }

    return NextResponse.json({
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

// Add this function to analyze behavior via Python backend
async function analyzeBehaviorAdvanced(behaviorData) {
  try {
    const response = await fetch('http://localhost:8000/api/behavioral/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(behaviorData)
    });
    
    if (response.ok) {
      return await response.json();
    }
    
    // Fallback to basic analysis if backend unavailable
    return fallbackBehaviorAnalysis(behaviorData);
  } catch (error) {
    console.log('Behavioral API unavailable, using fallback:', error.message);
    return fallbackBehaviorAnalysis(behaviorData);
  }
}

function fallbackBehaviorAnalysis(behaviorData) {
  // Basic fallback analysis
  const botLikelihood = behaviorData.botLikelihood || 30;
  const flags = behaviorData.flagsDetected || [];
  
  return {
    success: true,
    analysis: {
      overall_trust_score: 100 - botLikelihood,
      bot_likelihood: botLikelihood,
      risk_level: botLikelihood > 50 ? 'high' : botLikelihood > 25 ? 'medium' : 'low',
      recommendation: botLikelihood > 50 ? 'manual_review' : 'auto_approve',
      flags_detected: flags
    },
    is_human: botLikelihood < 50,
    confidence: (100 - botLikelihood) / 100,
    action_required: botLikelihood > 50 ? 'manual_review' : 'auto_approve'
  };
}