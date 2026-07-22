import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-middleware';

export async function GET(request) {
  try {
    const { response } = await requireAuth(request, { roles: ['officer', 'admin'] });
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit')) || 20;
    const page = parseInt(searchParams.get('page')) || 1;
    const sort = searchParams.get('sort') || 'newest';
    const riskFilter = searchParams.get('risk');

    const where = {};
    if (status) where.status = status;

    // Risk filtering now runs against real relational columns on VerificationResult
    // (riskLevel/totalScore) instead of five duplicated Json-path conditions — the
    // whole point of moving these fields out of embedded documents.
    if (riskFilter === 'high') {
      where.OR = [
        { isHighRisk: true },
        { verificationResult: { riskLevel: { in: ['high', 'critical'] } } },
        { verificationResult: { totalScore: { lt: 40 } } },
      ];
    } else if (riskFilter === 'suspicious') {
      where.verificationResult = { riskLevel: { in: ['high', 'critical'] } };
    } else if (riskFilter === 'medium') {
      where.verificationResult = { riskLevel: 'medium' };
    } else if (riskFilter === 'low') {
      where.verificationResult = { riskLevel: 'low' };
    }

    const sortOptions = {
      newest: { submittedAt: 'desc' },
      oldest: { submittedAt: 'asc' },
      highRisk: { verificationResult: { totalScore: 'asc' } },
      lowRisk: { verificationResult: { totalScore: 'desc' } },
    };

    const [applications, total] = await Promise.all([
      prisma.verification.findMany({
        where,
        include: { verificationResult: true },
        orderBy: sortOptions[sort] || sortOptions.newest,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.verification.count({ where }),
    ]);

    const formattedApplications = applications.map((app) => {
      const vr = app.verificationResult;
      const embeddedAI = app.aiVerificationResults || {};

      return {
        _id: app.id,
        fullName: app.fullName,
        gender: app.gender,
        documentIdNumber: app.documentIdNumber,
        mobileNumber: app.mobileNumber,
        addressLine1: app.addressLine1,
        addressLine2: app.addressLine2,
        city: app.city,
        taluka: app.taluka,
        district: app.district,
        state: app.state,
        pincode: app.pincode,
        status: app.status,
        isHighRisk: app.isHighRisk || vr?.isHighRisk || false,
        submittedAt: app.submittedAt,
        reviewedAt: app.reviewedAt,
        rejectionReason: app.rejectionReason,

        behaviorSummary: app.behaviorSummary || {
          overallTrustScore: 50,
          botLikelihood: 50,
          riskLevel: 'medium',
          isHuman: true,
          recommendation: 'standard_flow',
        },

        aiVerification: {
          overallScore: embeddedAI.overallScore ?? vr?.totalScore ?? 0,
          decision: embeddedAI.decision || vr?.finalDecision || 'PENDING',
          riskLevel: embeddedAI.riskLevel || vr?.riskLevel || 'medium',
          confidence: vr?.confidence || 0,
          passedChecks: embeddedAI.passedChecks ?? vr?.passedChecks ?? 0,
          failedChecks: embeddedAI.failedChecks ?? vr?.failedChecks ?? 0,
          reviewRequiredChecks: embeddedAI.reviewRequiredChecks ?? vr?.reviewRequiredChecks ?? 0,

          faceVerified: vr?.faceVerification?.verified || false,
          faceDecision: vr?.faceVerification?.result?.decision || 'PENDING',
          realProbability: vr?.faceVerification?.result?.real_probability || 0,
          fakeProbability: vr?.faceVerification?.result?.fake_probability || 0,

          documentsVerified: (
            (vr?.manipulationDetection?.panCard?.verified || false) &&
            (vr?.manipulationDetection?.aadhaarCard?.verified || false)
          ),
          panCardAuthentic: vr?.manipulationDetection?.panCard?.result?.is_authentic || false,
          panCardDecision: vr?.manipulationDetection?.panCard?.result?.decision || 'PENDING',
          aadhaarCardAuthentic: vr?.manipulationDetection?.aadhaarCard?.result?.is_authentic || false,
          aadhaarCardDecision: vr?.manipulationDetection?.aadhaarCard?.result?.decision || 'PENDING',

          panOCRDetected: vr?.panCardOCR?.result?.detected || false,
          aadhaarOCRDetected: vr?.aadhaarCardOCR?.result?.detected || false,

          issues: embeddedAI.issues || vr?.issues || [],
          recommendations: embeddedAI.recommendations || vr?.recommendations || [],

          processingTime: vr?.processingTime?.total || 0,
          status: vr?.status || 'under_officer_review',
          completedAt: embeddedAI.completedAt || vr?.completedAt,
        },

        behaviorAnalysis: {
          riskScore: app.behaviorSummary?.botLikelihood || 0,
          suspiciousActivity: (app.behaviorSummary?.botLikelihood || 0) > 50,
        },
      };
    });

    return NextResponse.json({
      applications: formattedApplications,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        totalPages: Math.ceil(total / limit),
      },
      total,
      totalPages: Math.ceil(total / limit),
    });

  } catch (error) {
    console.error('Applications error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
