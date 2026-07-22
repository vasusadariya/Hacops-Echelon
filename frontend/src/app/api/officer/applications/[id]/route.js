import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-middleware';

export async function GET(request, context) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
    }

    const { response } = await requireAuth(request, { roles: ['officer', 'admin'] });
    if (response) return response;

    // A real foreign-key relation replaces the old fuzzy "partial ID match" fallback
    // that used to scan up to 200 documents looking for a truncated Mongo ObjectId —
    // Prisma's findUnique either finds the row or it doesn't.
    const application = await prisma.verification.findUnique({
      where: { id },
      include: { verificationResult: true, behavioralAnalysis: true },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const vr = application.verificationResult;
    const ba = application.behavioralAnalysis;

    const response_ = {
      ...application,
      _id: application.id,

      verificationResults: vr ? {
        _id: vr.id,
        sessionId: vr.sessionId,
        status: vr.status,

        faceVerification: vr.faceVerification || null,
        panCardOCR: vr.panCardOCR || null,
        aadhaarCardOCR: vr.aadhaarCardOCR || null,
        manipulationDetection: vr.manipulationDetection || null,

        overallAssessment: {
          totalScore: vr.totalScore || 0,
          passedChecks: vr.passedChecks || 0,
          failedChecks: vr.failedChecks || 0,
          reviewRequiredChecks: vr.reviewRequiredChecks || 0,
          finalDecision: vr.finalDecision || 'PENDING',
          riskLevel: vr.riskLevel || 'medium',
          confidence: vr.confidence || 0,
          summary: vr.summary || '',
          issues: vr.issues || [],
          recommendations: vr.recommendations || [],
        },

        processingTime: vr.processingTime || null,
        errors: vr.errors || [],

        processedBy: vr.processedBy || 'automated_system',
        startedAt: vr.startedAt,
        completedAt: vr.completedAt,
        createdAt: vr.createdAt,
        updatedAt: vr.updatedAt,
      } : null,

      detailedBehavioralAnalysis: ba ? {
        _id: ba.id,
        overallTrustScore: ba.overallTrustScore,
        botLikelihood: ba.botLikelihood,
        riskLevel: ba.riskLevel,
        recommendation: ba.recommendation,
        isHuman: ba.isHuman,
        confidence: ba.confidence,
        flagsDetected: ba.flagsDetected || [],
        flagCount: ba.flagCount || 0,
        componentScores: ba.componentScores,
        keystrokeAnalysis: ba.keystrokeAnalysis,
        mouseAnalysis: ba.mouseAnalysis,
        pasteAnalysis: ba.pasteAnalysis,
        speedAnalysis: ba.speedAnalysis,
        rawMetrics: ba.rawMetrics,
        analyzedAt: ba.analyzedAt,
      } : null,

      behaviorSummary: application.behaviorSummary || {
        overallTrustScore: 50,
        botLikelihood: 50,
        riskLevel: 'medium',
        isHuman: true,
        recommendation: 'standard_flow',
      },
    };

    return NextResponse.json(response_);

  } catch (error) {
    console.error('Get application error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
