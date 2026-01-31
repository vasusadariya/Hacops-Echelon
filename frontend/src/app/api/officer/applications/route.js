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
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
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

    if (!user || (user.role !== 'officer' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const risk = searchParams.get('risk');

    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    // Filter by risk level using NEW behaviorSummary
    if (riskFilter) {
      if (riskFilter === 'high') {
        query['behaviorSummary.riskLevel'] = { $in: ['high', 'critical'] };
      } else if (riskFilter === 'suspicious') {
        query['behaviorSummary.botLikelihood'] = { $gte: 50 };
      } else {
        query['behaviorSummary.riskLevel'] = riskFilter;
      }
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

    const total = await db.collection('verifications').countDocuments(query);

    // Format response with NEW behavioral data
    const formattedApplications = applications.map(app => ({
      _id: app._id.toString(),
      fullName: app.fullName,
      gender: app.gender,
      city: app.city,
      state: app.state,
      status: app.status,
      submittedAt: app.submittedAt,
      
      // NEW: Behavioral Summary
      behaviorSummary: app.behaviorSummary || {
        overallTrustScore: 50,
        botLikelihood: 50,
        riskLevel: 'medium',
        isHuman: true,
        recommendation: 'standard_flow'
      },
      
      // Reference to full analysis
      behavioralAnalysisId: app.behavioralAnalysisId?.toString() || null,
      
      // AI verification summary
      aiVerification: {
        overallScore: app.aiVerificationResults?.overallScore || 0,
        decision: app.aiVerificationResults?.aiDecision || 'PENDING',
        faceVerified: app.aiVerificationResults?.faceVerification?.verified || false,
        documentsVerified: app.aiVerificationResults?.manipulationDetection?.panCard?.verified || false
      },
      
      // Legacy support (for old dashboard code)
      behaviorAnalysis: {
        riskScore: app.behaviorSummary?.botLikelihood || 0,
        suspiciousActivity: (app.behaviorSummary?.botLikelihood || 0) > 50
      }
    }));

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