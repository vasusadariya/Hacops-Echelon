import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';
import { getOptimizedUrl } from '@/lib/cloudinary';

export async function GET(request) {
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

    await connectDB();

    // Use native MongoDB
    const db = mongoose.connection.db;
    const verificationsCollection = db.collection('verifications');

    const verification = await verificationsCollection.findOne(
      { userId: new mongoose.Types.ObjectId(decoded.userId) },
      { sort: { createdAt: -1 } }
    );

    if (!verification) {
      return NextResponse.json({
        verified: false,
        status: 'not_started',
        message: 'No verification application found'
      });
    }

    // Determine next step message
    let nextStep = '';
    switch (verification.status) {
      case 'draft':
        nextStep = 'Complete and submit your verification application';
        break;
      case 'submitted':
        nextStep = 'Your application is being processed. Please wait.';
        break;
      case 'under_automated_verification':
        nextStep = 'Automated checks in progress. This may take a few minutes.';
        break;
      case 'under_officer_review':
        nextStep = 'Under manual review by a verification officer.';
        break;
      case 'approved':
        nextStep = 'Congratulations! Your identity has been verified.';
        break;
      case 'rejected':
        nextStep = 'Your application was rejected. Please review and resubmit.';
        break;
    }

    // Get selfie URLs (all 4 angles)
    let selfieUrls = {
      front: null,
      left: null,
      right: null,
      up: null
    };
    
    let selfieThumbUrls = {
      front: null,
      left: null,
      right: null,
      up: null
    };

    // Get URLs for all 4 face images
    if (verification.biometricSelfies) {
      const angles = ['front', 'left', 'right', 'up'];
      for (const angle of angles) {
        const selfie = verification.biometricSelfies[angle];
        if (selfie?.publicId) {
          try {
            selfieUrls[angle] = selfie.secureUrl;
            selfieThumbUrls[angle] = getOptimizedUrl(selfie.publicId, {
              width: 150,
              height: 150,
              crop: 'thumb',
              gravity: 'face'
            });
          } catch {}
        }
      }
    }

    // Fallback to single biometricSelfie for backward compatibility
    if (!selfieUrls.front && verification.biometricSelfie?.publicId) {
      try {
        selfieUrls.front = verification.biometricSelfie.secureUrl;
        selfieThumbUrls.front = getOptimizedUrl(verification.biometricSelfie.publicId, {
          width: 150,
          height: 150,
          crop: 'thumb',
          gravity: 'face'
        });
      } catch {}
    }

    return NextResponse.json({
      verified: verification.status === 'approved',
      status: verification.status,
      verificationId: verification._id.toString(),
      fullName: verification.fullName,
      submittedAt: verification.submittedAt,
      reviewedAt: verification.reviewedAt,
      rejectionReason: verification.rejectionReason,
      nextStep,
      statusHistory: verification.statusHistory || [],
      
      // All 4 face image URLs
      selfieUrls,
      selfieThumbUrls,
      
      // Primary selfie for backward compatibility
      selfieUrl: selfieUrls.front,
      selfieThumbUrl: selfieThumbUrls.front,
      
      // Document upload status
      documentsUploaded: {
        aadhaar: !!verification.aadhaarCardImage?.secureUrl,
        pan: !!verification.panCardImage?.secureUrl,
        selfieFront: !!selfieUrls.front,
        selfieLeft: !!selfieUrls.left,
        selfieRight: !!selfieUrls.right,
        selfieUp: !!selfieUrls.up
      }
    });

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}