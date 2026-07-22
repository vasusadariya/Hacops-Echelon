import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-middleware';

export async function GET(request) {
  try {
    const { response } = await requireAuth(request, { roles: ['officer', 'admin'] });
    if (response) return response;

    const [
      total,
      drafts,
      submitted,
      underAI,
      pending,
      approved,
      rejected,
    ] = await Promise.all([
      prisma.verification.count(),
      prisma.verification.count({ where: { status: 'draft' } }),
      prisma.verification.count({ where: { status: 'submitted' } }),
      prisma.verification.count({ where: { status: 'under_automated_verification' } }),
      prisma.verification.count({ where: { status: 'under_officer_review' } }),
      prisma.verification.count({ where: { status: 'approved' } }),
      prisma.verification.count({ where: { status: 'rejected' } }),
    ]);

    const highRisk = await prisma.verification.count({
      where: {
        status: 'under_officer_review',
        OR: [
          { isHighRisk: true },
          { verificationResult: { riskLevel: { in: ['high', 'critical'] } } },
          { verificationResult: { totalScore: { lt: 40 } } },
        ],
      },
    });

    const [behavioralAgg, lowRisk, mediumRisk, highRiskCount, criticalRisk, botsDetected] = await Promise.all([
      prisma.behavioralAnalysis.aggregate({
        _count: { _all: true },
        _avg: { overallTrustScore: true, botLikelihood: true },
      }),
      prisma.behavioralAnalysis.count({ where: { riskLevel: 'low' } }),
      prisma.behavioralAnalysis.count({ where: { riskLevel: 'medium' } }),
      prisma.behavioralAnalysis.count({ where: { riskLevel: 'high' } }),
      prisma.behavioralAnalysis.count({ where: { riskLevel: 'critical' } }),
      prisma.behavioralAnalysis.count({ where: { botLikelihood: { gte: 50 } } }),
    ]);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayProcessed = await prisma.verification.count({
      where: {
        reviewedAt: { gte: todayStart },
        status: { in: ['approved', 'rejected'] },
      },
    });

    return NextResponse.json({
      total,
      drafts,
      submitted,
      underAIVerification: underAI,
      pending,
      highRisk,
      approved,
      rejected,
      todayProcessed,

      behavioralStats: {
        totalAnalyses: behavioralAgg._count._all,
        avgTrustScore: behavioralAgg._avg.overallTrustScore || 0,
        avgBotLikelihood: behavioralAgg._avg.botLikelihood || 0,
        botsDetected,
        lowRisk,
        mediumRisk,
        highRiskCount,
        criticalRisk,
      },
    });

  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
