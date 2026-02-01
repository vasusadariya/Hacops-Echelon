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
    
    if (riskFilter) {
      if (riskFilter === 'high') {
        query['behaviorSummary.riskLevel'] = { $in: ['high', 'critical'] };
      } else if (riskFilter === 'suspicious') {
        query['behaviorSummary.botLikelihood'] = { $gte: 50 };
      } else {
        query['behaviorSummary.riskLevel'] = riskFilter;
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
        submittedAt: app.submittedAt,
        
        // Behavioral Summary
        behaviorSummary: app.behaviorSummary || {
          overallTrustScore: 50,
          botLikelihood: 50,
          riskLevel: 'medium',
          isHuman: true,
          recommendation: 'standard_flow'
        },
        
        behavioralAnalysisId: app.behavioralAnalysisId?.toString() || null,
        
        // AI Verification Results from VerificationResults collection
        aiVerification: vr ? {
          // Overall Assessment
          overallScore: overallAssessment?.totalScore || 0,
          decision: overallAssessment?.finalDecision || 'PENDING',
          riskLevel: overallAssessment?.riskLevel || 'MEDIUM',
          confidence: overallAssessment?.confidence || 0,
          passedChecks: overallAssessment?.passedChecks || 0,
          failedChecks: overallAssessment?.failedChecks || 0,
          reviewRequiredChecks: overallAssessment?.reviewRequiredChecks || 0,
          
          // Face Verification
          faceVerified: vr.faceVerification?.verified || false,
          faceDecision: vr.faceVerification?.result?.decision || 'PENDING',
          realProbability: vr.faceVerification?.result?.real_probability || 0,
          fakeProbability: vr.faceVerification?.result?.fake_probability || 0,
          
          // Document Verification
          documentsVerified: (
            (vr.manipulationDetection?.panCard?.verified || false) &&
            (vr.manipulationDetection?.aadhaarCard?.verified || false)
          ),
          panCardAuthentic: vr.manipulationDetection?.panCard?.result?.is_authentic || false,
          panCardDecision: vr.manipulationDetection?.panCard?.result?.decision || 'PENDING',
          aadhaarCardAuthentic: vr.manipulationDetection?.aadhaarCard?.result?.is_authentic || false,
          aadhaarCardDecision: vr.manipulationDetection?.aadhaarCard?.result?.decision || 'PENDING',
          
          // OCR
          panOCRDetected: vr.panCardOCR?.result?.detected || false,
          aadhaarOCRDetected: vr.aadhaarCardOCR?.result?.detected || false,
          
          // Issues & Recommendations
          issues: overallAssessment?.issues || [],
          recommendations: overallAssessment?.recommendations || [],
          
          // Processing Info
          processingTime: vr.processingTime?.total || 0,
          status: vr.status || 'pending',
          completedAt: vr.completedAt
        } : {
          overallScore: 0,
          decision: 'PENDING',
          riskLevel: 'MEDIUM',
          passedChecks: 0,
          failedChecks: 0,
          reviewRequiredChecks: 0,
          faceVerified: false,
          faceDecision: 'PENDING',
          documentsVerified: false,
          panOCRDetected: false,
          aadhaarOCRDetected: false,
          issues: [],
          recommendations: [],
          status: 'pending'
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
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Applications error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}