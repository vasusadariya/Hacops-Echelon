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

    await connectDB();
    const db = mongoose.connection.db;
    
    // Check if user is officer
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ 
      _id: new mongoose.Types.ObjectId(decoded.userId) 
    });

    if (!user || user.role !== 'officer') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const risk = searchParams.get('risk');
    const sort = searchParams.get('sort') || 'newest';
    const search = searchParams.get('search');

    // Build query
    const query = {};
    
    if (status) {
      const statuses = status.split(',');
      query.status = { $in: statuses };
    }

    if (risk === 'high') {
      query['behaviorAnalysis.riskScore'] = { $gte: 70 };
    } else if (risk === 'medium') {
      query['behaviorAnalysis.riskScore'] = { $gte: 40, $lt: 70 };
    } else if (risk === 'low') {
      query['behaviorAnalysis.riskScore'] = { $lt: 40 };
    }

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { documentIdNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Sort options
    const sortOptions = {
      newest: { submittedAt: -1 },
      oldest: { submittedAt: 1 },
      'risk-high': { 'behaviorAnalysis.riskScore': -1 },
      'risk-low': { 'behaviorAnalysis.riskScore': 1 }
    };

    const verificationsCollection = db.collection('verifications');

    // Get total count
    const total = await verificationsCollection.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Get applications
    const applications = await verificationsCollection
      .find(query)
      .sort(sortOptions[sort] || sortOptions.newest)
      .skip((page - 1) * limit)
      .limit(limit)
      .project({
        fullName: 1,
        gender: 1,
        documentIdNumber: 1,
        mobileNumber: 1,
        status: 1,
        submittedAt: 1,
        reviewedAt: 1,
        behaviorAnalysis: 1,
        city: 1,
        state: 1
      })
      .toArray();

    return NextResponse.json({
      applications,
      total,
      totalPages,
      page,
      limit
    });

  } catch (error) {
    console.error('Applications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}