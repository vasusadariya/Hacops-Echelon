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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit')) || 20;
    const page = parseInt(searchParams.get('page')) || 1;
    const sort = searchParams.get('sort') || 'newest';
    const riskFilter = searchParams.get('risk'); // 'high', 'low', etc.

    // Build query
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

    // Sort options
    const sortOptions = {
      newest: { submittedAt: -1 },
      oldest: { submittedAt: 1 },
      highRisk: { 'behaviorSummary.botLikelihood': -1 },
      lowRisk: { 'behaviorSummary.botLikelihood': 1 }
    };

    const applications = await db.collection('verifications')
      .find(query)
      .sort(sortOptions[sort] || sortOptions.newest)
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
      applications: formattedApplications,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Applications error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}