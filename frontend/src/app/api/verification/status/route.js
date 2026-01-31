import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';

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
    const db = mongoose.connection.db;
    const verificationsCollection = db.collection('verifications');

    const verification = await verificationsCollection.findOne(
      { userId: new mongoose.Types.ObjectId(decoded.userId) },
      { sort: { createdAt: -1 } }
    );

    if (!verification) {
      return NextResponse.json({
        hasVerification: false,
        status: 'not_started',
        message: 'No verification application found. Please start your verification.'
      });
    }

    // Status messages
    const statusMessages = {
      draft: {
        title: 'Draft',
        message: 'Your application is saved as draft. Please complete and submit.',
        color: 'gray',
        icon: 'edit'
      },
      submitted: {
        title: 'Submitted',
        message: 'Your application has been submitted and is in queue for processing.',
        color: 'blue',
        icon: 'clock'
      },
      under_automated_verification: {
        title: 'AI Verification in Progress',
        message: 'Your application is being verified by our automated systems. This usually takes a few minutes.',
        color: 'purple',
        icon: 'cpu'
      },
      under_officer_review: {
        title: 'Under Officer Review',
        message: 'Your application has passed automated checks and is being reviewed by a verification officer.',
        color: 'orange',
        icon: 'user-check'
      },
      approved: {
        title: 'Approved',
        message: 'Congratulations! Your identity has been verified successfully.',
        color: 'green',
        icon: 'check-circle'
      },
      rejected: {
        title: 'Rejected',
        message: 'Your application was not approved. Please review the reason below and resubmit if eligible.',
        color: 'red',
        icon: 'x-circle'
      }
    };

    const statusInfo = statusMessages[verification.status] || {
      title: verification.status,
      message: 'Status unknown',
      color: 'gray',
      icon: 'help'
    };

    // Get selfie URLs
    let selfieUrls = null;
    if (verification.biometricSelfies) {
      selfieUrls = {
        front: verification.biometricSelfies.front?.secureUrl,
        left: verification.biometricSelfies.left?.secureUrl,
        right: verification.biometricSelfies.right?.secureUrl,
        up: verification.biometricSelfies.up?.secureUrl
      };
    } else if (verification.biometricSelfie?.secureUrl) {
      selfieUrls = { front: verification.biometricSelfie.secureUrl };
    }

    return NextResponse.json({
      hasVerification: true,
      verificationId: verification._id.toString(),
      status: verification.status,
      statusInfo,
      
      // Application details
      fullName: verification.fullName,
      documentIdNumber: verification.documentIdNumber,
      
      // Dates
      submittedAt: verification.submittedAt,
      reviewedAt: verification.reviewedAt,
      createdAt: verification.createdAt,
      updatedAt: verification.updatedAt,
      
      // Review info
      rejectionReason: verification.rejectionReason,
      
      // Status history
      statusHistory: verification.statusHistory || [],
      
      // Selfies
      selfieUrls,
      
      // Flags for UI
      isVerified: verification.status === 'approved',
      isPending: ['submitted', 'under_automated_verification', 'under_officer_review'].includes(verification.status),
      isRejected: verification.status === 'rejected',
      canResubmit: verification.status === 'rejected'
    });

  } catch (error) {
    console.error('Status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}