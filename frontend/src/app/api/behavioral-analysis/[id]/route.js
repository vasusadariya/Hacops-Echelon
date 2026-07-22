import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-middleware';

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const { user, response } = await requireAuth(request);
    if (response) return response;

    const isAdmin = user.role === 'admin' || user.role === 'officer';

    let analysis = await prisma.behavioralAnalysis.findUnique({ where: { id } });

    if (!analysis) {
      analysis = await prisma.behavioralAnalysis.findUnique({ where: { verificationId: id } });
    }

    if (!analysis) {
      return NextResponse.json({ error: 'Behavioral analysis not found' }, { status: 404 });
    }

    const isOwner = analysis.userId === user.id;
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: analysis.id,
        verificationId: analysis.verificationId,
        overallTrustScore: analysis.overallTrustScore,
        botLikelihood: analysis.botLikelihood,
        riskLevel: analysis.riskLevel,
        recommendation: analysis.recommendation,
        isHuman: analysis.isHuman,
        confidence: analysis.confidence,
        flagsDetected: analysis.flagsDetected || [],
        flagCount: analysis.flagCount || 0,
        componentScores: analysis.componentScores,
        keystrokeAnalysis: analysis.keystrokeAnalysis,
        mouseAnalysis: analysis.mouseAnalysis,
        pasteAnalysis: analysis.pasteAnalysis,
        speedAnalysis: analysis.speedAnalysis,
        rawMetrics: analysis.rawMetrics,
        analyzedAt: analysis.analyzedAt,
        createdAt: analysis.createdAt,
      },
    });

  } catch (error) {
    console.error('Behavioral analysis fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
