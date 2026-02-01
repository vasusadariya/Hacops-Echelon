import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Verification from '@/models/Verification';

function verifyToken(token) {
  try {
    const jwt = require('jsonwebtoken');
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  } catch {
    return null;
  }
}

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

    const verification = await Verification.findOne(
      { userId: decoded.userId }
    ).sort({ createdAt: -1 });

    if (!verification) {
      return NextResponse.json({
        hasVerification: false,
        status: 'not_started',
        statusInfo: {
          title: 'Not Started',
          message: 'You have not started the verification process yet.',
          color: 'gray',
          step: 0
        }
      });
    }

    // Status information with step numbers for progress display
    const statusConfig = {
      draft: {
        title: 'Draft',
        message: 'Your application is saved as draft. Please complete and submit.',
        color: 'gray',
        step: 1
      },
      submitted: {
        title: 'Submitted',
        message: 'Your application has been submitted successfully. It will be processed by our AI system shortly.',
        color: 'blue',
        step: 2
      },
      under_automated_verification: {
        title: 'AI Verification In Progress',
        message: 'Your application is being analyzed by our automated verification system. This usually takes 1-2 minutes.',
        color: 'purple',
        step: 3
      },
      under_officer_review: {
        title: 'Under Officer Review',
        message: 'AI verification is complete. A verification officer will review your application shortly.',
        color: 'orange',
        step: 4
      },
      approved: {
        title: 'Approved',
        message: 'Congratulations! Your identity has been verified successfully. You now have full access to all services.',
        color: 'green',
        step: 5
      },
      rejected: {
        title: 'Rejected',
        message: verification.rejectionReason 
          ? `Your application was rejected. Reason: ${verification.rejectionReason}`
          : 'Your application was rejected. Please contact support for more information.',
        color: 'red',
        step: 5
      }
    };

    const statusInfo = statusConfig[verification.status] || {
      title: verification.status,
      message: 'Status information unavailable',
      color: 'gray',
      step: 0
    };

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
      reviewedByName: verification.reviewedByName,
      
      // AI Analysis summary (if available)
      aiAnalysis: verification.aiVerificationResults ? {
        riskScore: verification.aiVerificationResults.overallScore,
        recommendation: verification.aiVerificationResults.aiDecision,
        issuesCount: 0
      } : null,
      
      // Status history
      statusHistory: verification.statusHistory || [],
      
      // Flags
      isVerified: verification.status === 'approved',
      isPending: ['submitted', 'under_automated_verification', 'under_officer_review'].includes(verification.status),
      isRejected: verification.status === 'rejected',
      canResubmit: verification.status === 'rejected'
    });

  } catch (error) {
    console.error('Status error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}