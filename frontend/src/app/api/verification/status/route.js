import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-middleware';

const STATUS_CONFIG = {
  draft: {
    title: 'Draft',
    message: 'Your application is saved as draft. Please complete and submit.',
    color: 'gray',
    step: 1,
  },
  submitted: {
    title: 'Submitted',
    message: 'Your application has been submitted successfully. It will be processed by our AI system shortly.',
    color: 'blue',
    step: 2,
  },
  under_automated_verification: {
    title: 'AI Verification In Progress',
    message: 'Your application is being analyzed by our automated verification system. This usually takes 1-2 minutes.',
    color: 'purple',
    step: 3,
  },
  under_officer_review: {
    title: 'Under Officer Review',
    message: 'AI verification is complete. A verification officer will review your application shortly.',
    color: 'orange',
    step: 4,
  },
  approved: {
    title: 'Approved',
    message: 'Congratulations! Your identity has been verified successfully. You now have full access to all services.',
    color: 'green',
    step: 5,
  },
  rejected: {
    color: 'red',
    step: 5,
  },
};

export async function GET(request) {
  try {
    const { user, response } = await requireAuth(request);
    if (response) return response;

    const verification = await prisma.verification.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification) {
      return NextResponse.json({
        hasVerification: false,
        status: 'not_started',
        statusInfo: {
          title: 'Not Started',
          message: 'You have not started the verification process yet.',
          color: 'gray',
          step: 0,
        },
      });
    }

    let statusInfo = STATUS_CONFIG[verification.status] || {
      title: verification.status,
      message: 'Status information unavailable',
      color: 'gray',
      step: 0,
    };

    if (verification.status === 'rejected') {
      statusInfo = {
        ...statusInfo,
        title: 'Rejected',
        message: verification.rejectionReason
          ? `Your application was rejected. Reason: ${verification.rejectionReason}`
          : 'Your application was rejected. Please contact support for more information.',
      };
    }

    return NextResponse.json({
      hasVerification: true,
      verificationId: verification.id,
      status: verification.status,
      statusInfo,

      fullName: verification.fullName,
      documentIdNumber: verification.documentIdNumber,

      submittedAt: verification.submittedAt,
      reviewedAt: verification.reviewedAt,
      createdAt: verification.createdAt,
      updatedAt: verification.updatedAt,

      rejectionReason: verification.rejectionReason,
      reviewedByName: verification.reviewedByName,

      // aiVerificationResults.decision is the field ai-process/route.js actually writes
      // (previously this read a nonexistent `.aiDecision` field and always showed "undefined").
      aiAnalysis: verification.aiVerificationResults ? {
        riskScore: verification.aiVerificationResults.overallScore,
        recommendation: verification.aiVerificationResults.decision,
        issuesCount: verification.aiVerificationResults.issues?.length || 0,
      } : null,

      statusHistory: verification.statusHistory || [],

      isVerified: verification.status === 'approved',
      isPending: ['submitted', 'under_automated_verification', 'under_officer_review'].includes(verification.status),
      isRejected: verification.status === 'rejected',
      canResubmit: verification.status === 'rejected',
    });

  } catch (error) {
    console.error('Status error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
