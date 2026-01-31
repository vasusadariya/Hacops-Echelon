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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const risk = searchParams.get('risk');

    const query = {};
    
    if (status) {
      query.status = { $in: status.split(',').map(s => s.trim()) };
    }

    if (risk === 'high') {
      query['behaviorAnalysis.riskScore'] = { $gte: 70 };
    } else if (risk === 'medium') {
      query['behaviorAnalysis.riskScore'] = { $gte: 40, $lt: 70 };
    } else if (risk === 'low') {
      query['behaviorAnalysis.riskScore'] = { $lt: 40 };
    }

    const verificationsCollection = db.collection('verifications');
    
    const total = await verificationsCollection.countDocuments(query);
    const totalPages = Math.ceil(total / limit) || 1;

    const applications = await verificationsCollection
      .find(query)
      .sort({ 'behaviorAnalysis.riskScore': -1, updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    return NextResponse.json({
      applications,
      total,
      totalPages,
      page,
      limit
    });

  } catch (error) {
    console.error('Applications API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}