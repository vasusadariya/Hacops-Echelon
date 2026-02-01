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
    const riskFilter = searchParams.get('risk');

    // Build query
    const query = {};
    if (status) {
      query.status = status;
    }
    
    // Handle risk filter
    if (riskFilter) {
      if (riskFilter === 'high') {
        // High risk: either flagged as high risk OR has high/critical risk level OR high bot likelihood OR low AI score
        query.$or = [
          { isHighRisk: true },
          { 'behaviorSummary.riskLevel': { $in: ['high', 'critical'] } },
          { 'behaviorSummary.botLikelihood': { $gte: 70 } },
          { 'aiVerificationResults.riskLevel': { $in: ['HIGH', 'CRITICAL'] } },
          { 'aiVerificationResults.overallScore': { $lt: 40 } }
        ];
      } else if (riskFilter === 'suspicious') {
        query['behaviorSummary.botLikelihood'] = { $gte: 50 };
      } else if (riskFilter === 'medium') {
        query['behaviorSummary.riskLevel'] = 'medium';
      } else if (riskFilter === 'low') {
        query['behaviorSummary.riskLevel'] = 'low';
      }
    }

    const sortOptions = {
      newest: { submittedAt: -1 },
      oldest: { submittedAt: 1 },
      highRisk: { 'behaviorSummary.botLikelihood': -1 },
      lowRisk: { 'behaviorSummary.botLikelihood': 1 }
    };

    // Fetch applications
    const applications = await db.collection('verifications')
      .find(query)
      .sort(sortOptions[sort] || sortOptions.newest)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const total = await db.collection('verifications').countDocuments(query);

    // Fetch verification results for all applications
    const applicationIds = applications.map(app => app._id);
    const verificationResults = await db.collection('verificationresults')
      .find({ 
        verificationId: { $in: applicationIds } 
      })
      .toArray();

    // Create a map for quick lookup by verificationId
    const resultsMap = {};
    verificationResults.forEach(result => {
      const key = result.verificationId?.toString();
      if (key) {
        resultsMap[key] = result;
      }
    });

    // Also try to fetch by userId for applications that might not have verificationId match
    const userIds = applications
      .filter(app => app.userId && !resultsMap[app._id.toString()])
      .map(app => new mongoose.Types.ObjectId(app.userId));

    if (userIds.length > 0) {
      const resultsByUser = await db.collection('verificationresults')
        .find({ userId: { $in: userIds } })
        .sort({ createdAt: -1 })
        .toArray();

      // Map by userId (take the most recent one)
      const userResultsMap = {};
      resultsByUser.forEach(result => {
        const userId = result.userId?.toString();
        if (userId && !userResultsMap[userId]) {
          userResultsMap[userId] = result;
        }
      });

      // Add to resultsMap using application._id as key
      applications.forEach(app => {
        if (!resultsMap[app._id.toString()] && app.userId) {
          const userResult = userResultsMap[app.userId.toString()];
          if (userResult) {
            resultsMap[app._id.toString()] = userResult;
          }
        }
      });
    }

    // Format response with AI verification data from verificationresults
    const formattedApplications = applications.map(app => {
      const vr = resultsMap[app._id.toString()];
      const overallAssessment = vr?.overallAssessment;
      
      // Use embedded aiVerificationResults if available, otherwise use vr
      const embeddedAI = app.aiVerificationResults || {};
      
      return {
        _id: app._id.toString(),
        fullName: app.fullName,
        gender: app.gender,
        documentIdNumber: app.documentIdNumber,
        mobileNumber: app.mobileNumber,
        addressLine1: app.addressLine1,
        addressLine2: app.addressLine2,
        city: app.city,
        taluka: app.taluka,
        district: app.district,
        state: app.state,
        pincode: app.pincode,
        status: app.status,
        isHighRisk: app.isHighRisk || overallAssessment?.isHighRisk || false,
        submittedAt: app.submittedAt,
        reviewedAt: app.reviewedAt,
        rejectionReason: app.rejectionReason,
        
        // Behavioral Summary
        behaviorSummary: app.behaviorSummary || {
          overallTrustScore: 50,
          botLikelihood: 50,
          riskLevel: 'medium',
          isHuman: true,
          recommendation: 'standard_flow'
        },
        
        behavioralAnalysisId: app.behavioralAnalysisId?.toString() || null,
        
        // AI Verification Results - prefer embedded, then vr collection
        aiVerification: {
          // Overall Assessment
          overallScore: embeddedAI.overallScore || overallAssessment?.totalScore || 0,
          decision: embeddedAI.decision || overallAssessment?.finalDecision || 'PENDING',
          riskLevel: embeddedAI.riskLevel || overallAssessment?.riskLevel || 'MEDIUM',
          confidence: overallAssessment?.confidence || 0,
          passedChecks: embeddedAI.passedChecks || overallAssessment?.passedChecks || 0,
          failedChecks: embeddedAI.failedChecks || overallAssessment?.failedChecks || 0,
          reviewRequiredChecks: embeddedAI.reviewRequiredChecks || overallAssessment?.reviewRequiredChecks || 0,
          
          // Face Verification
          faceVerified: vr?.faceVerification?.verified || false,
          faceDecision: vr?.faceVerification?.result?.decision || 'PENDING',
          realProbability: vr?.faceVerification?.result?.real_probability || 0,
          fakeProbability: vr?.faceVerification?.result?.fake_probability || 0,
          
          // Document Verification
          documentsVerified: (
            (vr?.manipulationDetection?.panCard?.verified || false) &&
            (vr?.manipulationDetection?.aadhaarCard?.verified || false)
          ),
          panCardAuthentic: vr?.manipulationDetection?.panCard?.result?.is_authentic || false,
          panCardDecision: vr?.manipulationDetection?.panCard?.result?.decision || 'PENDING',
          aadhaarCardAuthentic: vr?.manipulationDetection?.aadhaarCard?.result?.is_authentic || false,
          aadhaarCardDecision: vr?.manipulationDetection?.aadhaarCard?.result?.decision || 'PENDING',
          
          // OCR
          panOCRDetected: vr?.panCardOCR?.result?.detected || false,
          aadhaarOCRDetected: vr?.aadhaarCardOCR?.result?.detected || false,
          
          // Issues & Recommendations
          issues: embeddedAI.issues || overallAssessment?.issues || [],
          recommendations: embeddedAI.recommendations || overallAssessment?.recommendations || [],
          
          // Processing Info
          processingTime: vr?.processingTime?.total || 0,
          status: vr?.status || 'pending',
          completedAt: embeddedAI.completedAt || vr?.completedAt
        },
        
        // Legacy support
        behaviorAnalysis: {
          riskScore: app.behaviorSummary?.botLikelihood || 0,
          suspiciousActivity: (app.behaviorSummary?.botLikelihood || 0) > 50
        }
      };
    });

    return NextResponse.json({
      applications: formattedApplications,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        totalPages: Math.ceil(total / limit)
      },
      total,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Applications error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}