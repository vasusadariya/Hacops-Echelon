import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';
import { getOptimizedUrl } from '@/lib/cloudinary';

export async function GET(request) {
  try {
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

    // Determine next step
    let nextStep = '';
    switch (verification.status) {
      case 'draft':
        nextStep = 'Complete and submit your verification application';
        break;
      case 'submitted':
        nextStep = 'Your application is being processed. Please wait.';
        break;
      case 'under_automated_verification':
        nextStep = 'Automated checks in progress.';
        break;
      case 'under_officer_review':
        nextStep = 'Under manual review by verification officer.';
        break;
      case 'approved':
        nextStep = 'Congratulations! Your identity has been verified.';
        break;
      case 'rejected':
        nextStep = 'Your application was rejected. Please review and resubmit.';
        break;
    }

    // Get selfie URLs
    let selfieThumbUrl = null;
    let selfieUrl = null;
    if (verification.biometricSelfie?.publicId) {
      try {
        selfieThumbUrl = getOptimizedUrl(verification.biometricSelfie.publicId, { 
          width: 150, height: 150, crop: 'thumb', gravity: 'face' 
        });
        selfieUrl = verification.biometricSelfie.secureUrl;
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
      selfieThumbUrl,
      selfieUrl,
      documentsUploaded: {
        aadhaar: !!verification.aadhaarCardImage?.secureUrl,
        pan: !!verification.panCardImage?.secureUrl,
        selfie: !!verification.biometricSelfie?.secureUrl
      }
    });

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}