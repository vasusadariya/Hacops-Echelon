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

    // Get verification counts by status
    const [
      total,
      drafts,              // Not yet submitted
      submitted,           // Submitted, waiting for AI to start processing
      underAI,             // Currently being processed by AI
      pending,             // AI completed, waiting for officer review (under_officer_review)
      approved,
      rejected
    ] = await Promise.all([
      verificationsCollection.countDocuments({}),
      verificationsCollection.countDocuments({ status: 'draft' }),
      verificationsCollection.countDocuments({ status: 'submitted' }),
      verificationsCollection.countDocuments({ status: 'under_automated_verification' }),
      verificationsCollection.countDocuments({ status: 'under_officer_review' }),
      verificationsCollection.countDocuments({ status: 'approved' }),
      verificationsCollection.countDocuments({ status: 'rejected' })
    ]);

    // Get high risk count - applications that are pending review AND flagged as high risk
    const highRisk = await verificationsCollection.countDocuments({
      status: 'under_officer_review',
      $or: [
        { isHighRisk: true },
        { 'behaviorSummary.riskLevel': { $in: ['high', 'critical'] } },
        { 'behaviorSummary.botLikelihood': { $gte: 70 } },
        { 'aiVerificationResults.riskLevel': { $in: ['HIGH', 'CRITICAL'] } },
        { 'aiVerificationResults.overallScore': { $lt: 40 } }
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
          highRiskCount: { $sum: { $cond: [{ $eq: ['$riskLevel', 'high'] }, 1, 0] } },
          criticalRisk: { $sum: { $cond: [{ $eq: ['$riskLevel', 'critical'] }, 1, 0] } }
        }
      }
    ]).toArray();

    // Today's processed (approved or rejected today)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayProcessed = await verificationsCollection.countDocuments({
      reviewedAt: { $gte: todayStart },
      status: { $in: ['approved', 'rejected'] }
    });

    return NextResponse.json({
      // Main verification stats by status
      total,
      drafts,                             // draft
      submitted,                          // submitted (waiting for AI)
      underAIVerification: underAI,       // under_automated_verification (AI processing)
      pending,                            // under_officer_review (ready for officer)
      highRisk,                           // under_officer_review + high risk flag
      approved,                           // approved
      rejected,                           // rejected
      todayProcessed,
      
      // Behavioral analysis stats
      behavioralStats: behavioralStats[0] || {
        totalAnalyses: 0,
        avgTrustScore: 0,
        avgBotLikelihood: 0,
        botsDetected: 0,
        lowRisk: 0,
        mediumRisk: 0,
        highRiskCount: 0,
        criticalRisk: 0
      }
    });

  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}