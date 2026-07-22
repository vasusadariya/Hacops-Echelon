import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-middleware';

export async function GET(request) {
  try {
    const { response } = await requireAuth(request, { roles: ['admin', 'officer'] });
    if (response) return response;

    const [agg, humansDetected, botsDetected, lowRisk, mediumRisk, highRisk, criticalRisk, recentSuspicious] = await Promise.all([
      prisma.behavioralAnalysis.aggregate({
        _count: { _all: true },
        _avg: { overallTrustScore: true, botLikelihood: true },
      }),
      prisma.behavioralAnalysis.count({ where: { isHuman: true } }),
      prisma.behavioralAnalysis.count({ where: { isHuman: false } }),
      prisma.behavioralAnalysis.count({ where: { riskLevel: 'low' } }),
      prisma.behavioralAnalysis.count({ where: { riskLevel: 'medium' } }),
      prisma.behavioralAnalysis.count({ where: { riskLevel: 'high' } }),
      prisma.behavioralAnalysis.count({ where: { riskLevel: 'critical' } }),
      prisma.behavioralAnalysis.findMany({
        where: { botLikelihood: { gte: 50 } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    // flagsDetected is a Postgres text[] column — unnest it to get a per-flag count,
    // the relational equivalent of the old $unwind + $group aggregation pipeline.
    const flagStats = await prisma.$queryRaw`
      SELECT flag, COUNT(*)::int AS count
      FROM "behavioral_analyses", unnest("flagsDetected") AS flag
      GROUP BY flag
      ORDER BY count DESC
    `;

    const totalAnalyses = agg._count._all;
    const avgTrustScore = Math.round(agg._avg.overallTrustScore || 0);
    const avgBotLikelihood = Math.round(agg._avg.botLikelihood || 0);

    return NextResponse.json({
      success: true,
      statistics: {
        totalAnalyses,
        avgTrustScore,
        avgBotLikelihood,
        humansDetected,
        botsDetected,
        lowRisk,
        mediumRisk,
        highRisk,
        criticalRisk,
        detectionRate: totalAnalyses > 0 ? Math.round((botsDetected / totalAnalyses) * 100) : 0,
      },
      riskDistribution: {
        low: lowRisk,
        medium: mediumRisk,
        high: highRisk,
        critical: criticalRisk,
      },
      flagDistribution: flagStats.map((f) => ({ flag: f.flag, count: f.count })),
      recentSuspicious: recentSuspicious.map((s) => ({
        id: s.id,
        verificationId: s.verificationId,
        botLikelihood: s.botLikelihood,
        riskLevel: s.riskLevel,
        flagCount: s.flagCount,
        createdAt: s.createdAt,
      })),
    });

  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
