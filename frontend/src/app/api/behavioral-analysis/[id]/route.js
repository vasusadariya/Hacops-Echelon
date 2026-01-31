import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    
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

    // Check user role
    const user = await db.collection('users').findOne({
      _id: new mongoose.Types.ObjectId(decoded.userId)
    });

    const isAdmin = user?.role === 'admin' || user?.role === 'officer';

    // Try to find by behavioral analysis ID
    let analysis = await db.collection('behavioralanalyses').findOne({
      _id: new mongoose.Types.ObjectId(id)
    });

    // If not found, try to find by verification ID
    if (!analysis) {
      analysis = await db.collection('behavioralanalyses').findOne({
        verificationId: new mongoose.Types.ObjectId(id)
      });
    }

    if (!analysis) {
      return NextResponse.json({ error: 'Behavioral analysis not found' }, { status: 404 });
    }

    // Authorization check
    const isOwner = analysis.userId.toString() === decoded.userId;
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: analysis._id.toString(),
        verificationId: analysis.verificationId.toString(),
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
        createdAt: analysis.createdAt
      }
    });

  } catch (error) {
    console.error('Behavioral analysis fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}