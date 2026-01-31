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

    if (!user || user.role !== 'officer') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const verificationsCollection = db.collection('verifications');

    // Get counts
    const [total, pending, approved, rejected, highRisk, underAI] = await Promise.all([
      verificationsCollection.countDocuments({}),
      verificationsCollection.countDocuments({ status: 'under_officer_review' }),
      verificationsCollection.countDocuments({ status: 'approved' }),
      verificationsCollection.countDocuments({ status: 'rejected' }),
      verificationsCollection.countDocuments({ 
        status: 'under_officer_review',
        'behaviorAnalysis.riskScore': { $gte: 70 }
      }),
      verificationsCollection.countDocuments({ status: 'under_automated_verification' })
    ]);

    // Today's processed
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayProcessed = await verificationsCollection.countDocuments({
      reviewedAt: { $gte: todayStart }
    });

    return NextResponse.json({
      total,
      pending,
      approved,
      rejected,
      highRisk,
      underAIVerification: underAI,
      todayProcessed
    });

  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}