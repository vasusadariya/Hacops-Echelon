import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';

export async function GET(request) {
  try {
    // Auth check
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is officer
    await connectDB();
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    const user = await usersCollection.findOne({ 
      _id: new mongoose.Types.ObjectId(decoded.userId) 
    });

    if (!user || user.role !== 'officer') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get verification stats
    const verificationsCollection = db.collection('verifications');

    const [
      total,
      pending,
      approved,
      rejected,
      highRisk,
      todayProcessed
    ] = await Promise.all([
      verificationsCollection.countDocuments({}),
      verificationsCollection.countDocuments({ 
        status: { $in: ['submitted', 'under_officer_review'] } 
      }),
      verificationsCollection.countDocuments({ status: 'approved' }),
      verificationsCollection.countDocuments({ status: 'rejected' }),
      verificationsCollection.countDocuments({ 
        status: { $in: ['submitted', 'under_officer_review'] },
        'behaviorAnalysis.riskScore': { $gte: 70 }
      }),
      verificationsCollection.countDocuments({
        reviewedAt: { 
          $gte: new Date(new Date().setHours(0, 0, 0, 0)) 
        }
      })
    ]);

    return NextResponse.json({
      total,
      pending,
      approved,
      rejected,
      highRisk,
      todayProcessed
    });

  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}