import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await connectDB();
    const db = mongoose.connection.db;
    
    const user = await db.collection('users').findOne({ 
      _id: new mongoose.Types.ObjectId(decoded.userId) 
    });

    if (!user || (user.role !== 'officer' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const verificationsCollection = db.collection('verifications');
    const behavioralCollection = db.collection('behavioralanalyses');

    // Get verification counts
    const [total, pending, approved, rejected, underAI] = await Promise.all([
      verificationsCollection.countDocuments({}),
      verificationsCollection.countDocuments({ status: 'under_officer_review' }),
      verificationsCollection.countDocuments({ status: 'approved' }),
      verificationsCollection.countDocuments({ status: 'rejected' }),
      verificationsCollection.countDocuments({ status: 'under_automated_verification' })
    ]);

    // Get high risk using NEW behaviorSummary field
    const highRisk = await verificationsCollection.countDocuments({
      $or: [
        { 'behaviorSummary.riskLevel': { $in: ['high', 'critical'] } },
        { 'behaviorSummary.botLikelihood': { $gte: 50 } }
      ]
    });

    // Get behavioral analysis statistics
    const behavioralStats = await behavioralCollection.aggregate([
      {
        $group: {
          _id: null,
          totalAnalyses: { $sum: 1 },
          avgTrustScore: { $avg: '$overallTrustScore' },
          avgBotLikelihood: { $avg: '$botLikelihood' },
          botsDetected: { $sum: { $cond: [{ $gte: ['$botLikelihood', 50] }, 1, 0] } },
          lowRisk: { $sum: { $cond: [{ $eq: ['$riskLevel', 'low'] }, 1, 0] } },
          mediumRisk: { $sum: { $cond: [{ $eq: ['$riskLevel', 'medium'] }, 1, 0] } },
          highRisk: { $sum: { $cond: [{ $eq: ['$riskLevel', 'high'] }, 1, 0] } },
          criticalRisk: { $sum: { $cond: [{ $eq: ['$riskLevel', 'critical'] }, 1, 0] } }
        }
      }
    ]).toArray();

    // Today's processed
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayProcessed = await verificationsCollection.countDocuments({
      reviewedAt: { $gte: todayStart }
    });

    return NextResponse.json({
      // Verification stats
      total,
      pending,
      approved,
      rejected,
      highRisk,
      underAIVerification: underAI,
      todayProcessed,
      
      // Behavioral analysis stats
      behavioralStats: behavioralStats[0] || {
        totalAnalyses: 0,
        avgTrustScore: 0,
        avgBotLikelihood: 0,
        botsDetected: 0,
        lowRisk: 0,
        mediumRisk: 0,
        highRisk: 0,
        criticalRisk: 0
      }
    });

  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}