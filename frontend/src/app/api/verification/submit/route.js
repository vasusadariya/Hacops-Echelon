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

    // Create verification document
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
      behaviorAnalysis: {
        typingSpeed: behaviorData.typingSpeed || 0,
        mouseMovements: behaviorData.mouseMovements || 0,
        totalTimeSpent: behaviorData.totalTimeSpent || 0,
        riskScore: 0,
        suspiciousActivity: false,
      },
      status: 'submitted',
      statusHistory: [
        {
          status: 'submitted',
          changedAt: now,
          remarks: 'Application submitted by user'
        }
      ],
      submittedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    // Insert into database
    const result = await db.collection('verifications').insertOne(verificationData);
    const verificationId = result.insertedId;

    console.log('Verification created:', verificationId.toString());

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

    return NextResponse.json({
      success: true,
      message: 'Verification submitted successfully',
      verificationId: verificationId.toString(),
      status: 'submitted'
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