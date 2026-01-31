import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';
import { uploadSelfieBase64, uploadDocument, deleteFromCloudinary } from '@/lib/cloudinary';

// Verify reCAPTCHA
async function verifyRecaptcha(token) {
  if (!token || !process.env.RECAPTCHA_SECRET_KEY) return true;
  
  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`
    });
    const data = await response.json();
    return data.success;
  } catch {
    return true;
  }
}

// Analyze behavior
function analyzeBehavior(data) {
  if (!data) return { typingSpeed: 0, mouseMovements: 0, totalTimeSpent: 0, suspiciousActivity: false, riskScore: 0 };
  
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

// File to buffer
async function fileToBuffer(file) {
  const bytes = await file.arrayBuffer();
  return Buffer.from(bytes);
}

// Process upload result
function processUploadResult(result, filename) {
  return {
    publicId: result.public_id,
    secureUrl: result.secure_url,
    url: result.url,
    format: result.format,
    width: result.width,
    height: result.height,
    bytes: result.bytes,
    originalFilename: filename || 'file',
    createdAt: new Date()
  };
}

export async function POST(request) {
  const uploadedFiles = [];

  try {
    console.log('=== Verification Submit Started ===');
    
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

    const userId = decoded.userId;
    console.log('User ID:', userId);

    // Connect to DB
    await connectDB();

    // Parse form data
    const formData = await request.formData();

    // Verify reCAPTCHA
    const recaptchaToken = formData.get('recaptchaToken');
    if (!(await verifyRecaptcha(recaptchaToken))) {
      return NextResponse.json({ error: 'reCAPTCHA failed' }, { status: 400 });
    }

    // Get form fields
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
    const selfieBase64 = formData.get('selfieBase64') || '';
    const aadhaarFile = formData.get('aadhaarCard');
    const panFile = formData.get('panCard');

    // Parse behavior data
    let behaviorData = {};
    try {
      behaviorData = JSON.parse(formData.get('behaviorData') || '{}');
    } catch {}
    const behaviorAnalysis = analyzeBehavior(behaviorData);

    // Validation
    const errors = [];
    if (!fullName || fullName.length < 3) errors.push('Full name required (min 3 chars)');
    if (!['male', 'female', 'other'].includes(gender)) errors.push('Valid gender required');
    if (!documentIdNumber || documentIdNumber.length < 8) errors.push('Document ID required (min 8 chars)');
    if (!addressLine1 || addressLine1.length < 10) errors.push('Address required (min 10 chars)');
    if (!city) errors.push('City required');
    if (!taluka) errors.push('Taluka required');
    if (!district) errors.push('District required');
    if (!state) errors.push('State required');
    if (!/^\d{6}$/.test(pincode)) errors.push('Valid 6-digit pincode required');
    if (!/^\d{10}$/.test(mobileNumber)) errors.push('Valid 10-digit mobile required');
    if (!aadhaarFile || aadhaarFile.size === 0) errors.push('Aadhaar image required');
    if (!panFile || panFile.size === 0) errors.push('PAN image required');
    if (!selfieBase64) errors.push('Selfie required');

    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    console.log('Validation passed, uploading files...');

    // Generate unique ID
    const uniqueId = uuidv4();

    // Upload Aadhaar
    const aadhaarBuffer = await fileToBuffer(aadhaarFile);
    const aadhaarResult = await uploadDocument(aadhaarBuffer, 'aadhaar', uniqueId);
    uploadedFiles.push(aadhaarResult.public_id);
    const aadhaarImage = processUploadResult(aadhaarResult, aadhaarFile.name);
    console.log('Aadhaar uploaded');

    // Upload PAN
    const panBuffer = await fileToBuffer(panFile);
    const panResult = await uploadDocument(panBuffer, 'pan', uniqueId);
    uploadedFiles.push(panResult.public_id);
    const panImage = processUploadResult(panResult, panFile.name);
    console.log('PAN uploaded');

    // Upload Selfie
    const selfieResult = await uploadSelfieBase64(selfieBase64, uniqueId);
    uploadedFiles.push(selfieResult.public_id);
    const selfieImage = {
      ...processUploadResult(selfieResult, 'selfie.jpg'),
      capturedAt: new Date(),
      faceDetected: true
    };
    console.log('Selfie uploaded');

    // ========== DATABASE OPERATIONS - USING NATIVE MONGODB ==========
    
    // Get the verifications collection directly
    const db = mongoose.connection.db;
    const verificationsCollection = db.collection('verifications');

    // Check for existing verification
    const existingVerification = await verificationsCollection.findOne({ 
      userId: new mongoose.Types.ObjectId(userId) 
    });

    console.log('Existing verification:', existingVerification?.status || 'none');

    if (existingVerification && ['submitted', 'under_automated_verification', 'under_officer_review', 'approved'].includes(existingVerification.status)) {
      // Cleanup uploads
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
      const oldImages = [
        existingVerification.aadhaarCardImage?.publicId,
        existingVerification.panCardImage?.publicId,
        existingVerification.biometricSelfie?.publicId
      ].filter(Boolean);

      for (const publicId of oldImages) {
        try { await deleteFromCloudinary(publicId); } catch {}
      }
    }

    // Prepare verification document
    const now = new Date();
    const verificationDoc = {
      userId: new mongoose.Types.ObjectId(userId),
      fullName,
      gender,
      documentIdNumber,
      aadhaarCardImage: aadhaarImage,
      panCardImage: panImage,
      biometricSelfie: selfieImage,
      addressLine1,
      addressLine2,
      city,
      taluka,
      district,
      state,
      pincode,
      mobileNumber,
      behaviorAnalysis,
      status: 'submitted',
      statusHistory: [
        ...(existingVerification?.statusHistory || []),
        {
          status: 'submitted',
          changedAt: now,
          remarks: 'Application submitted by user'
        }
      ],
      submittedAt: now,
      updatedAt: now
    };

    let verificationId;

    if (existingVerification) {
      // Update existing
      console.log('Updating existing verification...');
      await verificationsCollection.updateOne(
        { _id: existingVerification._id },
        { $set: verificationDoc }
      );
      verificationId = existingVerification._id;
    } else {
      // Create new
      console.log('Creating new verification...');
      verificationDoc.createdAt = now;
      const result = await verificationsCollection.insertOne(verificationDoc);
      verificationId = result.insertedId;
    }

    console.log('=== Verification Saved Successfully ===');
    console.log('Verification ID:', verificationId);

    return NextResponse.json({
      success: true,
      message: 'Verification submitted successfully',
      verificationId: verificationId.toString(),
      status: 'submitted',
      selfieUrl: selfieImage.secureUrl
    });

  } catch (error) {
    console.error('=== Verification Error ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);

    // Cleanup uploaded files
    for (const publicId of uploadedFiles) {
      try { await deleteFromCloudinary(publicId); } catch {}
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