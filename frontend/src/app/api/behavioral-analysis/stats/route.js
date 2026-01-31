import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';

export async function GET(request) {
  try {
    // Auth check - only admin/officer
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded || !['admin', 'officer'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const db = mongoose.connection.db;
    const collection = db.collection('behavioralanalyses');

    // Get aggregated statistics
    const stats = await collection.aggregate([
      {
        $group: {
          _id: null,
          totalAnalyses: { $sum: 1 },
          avgTrustScore: { $avg: '$overallTrustScore' },
          avgBotLikelihood: { $avg: '$botLikelihood' },
          humansDetected: { $sum: { $cond: ['$isHuman', 1, 0] } },
          botsDetected: { $sum: { $cond: ['$isHuman', 0, 1] } },
          lowRisk: { $sum: { $cond: [{ $eq: ['$riskLevel', 'low'] }, 1, 0] } },
          mediumRisk: { $sum: { $cond: [{ $eq: ['$riskLevel', 'medium'] }, 1, 0] } },
          highRisk: { $sum: { $cond: [{ $eq: ['$riskLevel', 'high'] }, 1, 0] } },
          criticalRisk: { $sum: { $cond: [{ $eq: ['$riskLevel', 'critical'] }, 1, 0] } }
        }
      }
    ]).toArray();

    // Get recent suspicious activities
    const recentSuspicious = await collection.find({
      botLikelihood: { $gte: 50 }
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    // Get flag distribution
    const flagStats = await collection.aggregate([
      { $unwind: '$flagsDetected' },
      { $group: { _id: '$flagsDetected', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    const result = stats[0] || {
      totalAnalyses: 0,
      avgTrustScore: 0,
      avgBotLikelihood: 0,
      humansDetected: 0,
      botsDetected: 0,
      lowRisk: 0,
      mediumRisk: 0,
      highRisk: 0,
      criticalRisk: 0
    };

    return NextResponse.json({
      success: true,
      statistics: {
        ...result,
        avgTrustScore: Math.round(result.avgTrustScore || 0),
        avgBotLikelihood: Math.round(result.avgBotLikelihood || 0),
        detectionRate: result.totalAnalyses > 0 
          ? Math.round((result.botsDetected / result.totalAnalyses) * 100) 
          : 0
      },
      riskDistribution: {
        low: result.lowRisk,
        medium: result.mediumRisk,
        high: result.highRisk,
        critical: result.criticalRisk
      },
      flagDistribution: flagStats.map(f => ({ flag: f._id, count: f.count })),
      recentSuspicious: recentSuspicious.map(s => ({
        id: s._id.toString(),
        verificationId: s.verificationId.toString(),
        botLikelihood: s.botLikelihood,
        riskLevel: s.riskLevel,
        flagCount: s.flagCount,
        createdAt: s.createdAt
      }))
    });

  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}