import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection.db;
  }
  await mongoose.connect(MONGODB_URI);
  return mongoose.connection.db;
}

function verifyToken(token) {
  try {
    const jwt = require('jsonwebtoken');
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  } catch {
    return null;
  }
}

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const db = await connectToDatabase();
    
    const user = await db.collection('users').findOne({ 
      _id: new mongoose.Types.ObjectId(decoded.userId) 
    });

    if (!user || user.role !== 'officer') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const coll = db.collection('verifications');

    // Get counts for each status
    const [
      total,
      submitted,
      underAIVerification,
      pending,  // under_officer_review
      approved,
      rejected,
      highRisk
    ] = await Promise.all([
      coll.countDocuments({}),
      coll.countDocuments({ status: 'submitted' }),
      coll.countDocuments({ status: 'under_automated_verification' }),
      coll.countDocuments({ status: 'under_officer_review' }),
      coll.countDocuments({ status: 'approved' }),
      coll.countDocuments({ status: 'rejected' }),
      coll.countDocuments({ 
        status: 'under_officer_review',
        'behaviorAnalysis.riskScore': { $gte: 70 }
      })
    ]);

    // Today's processed
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayProcessed = await coll.countDocuments({
      reviewedAt: { $gte: todayStart }
    });

    return NextResponse.json({
      total,
      submitted,
      underAIVerification,
      pending,  // This is under_officer_review count
      approved,
      rejected,
      highRisk,
      todayProcessed
    });

  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}