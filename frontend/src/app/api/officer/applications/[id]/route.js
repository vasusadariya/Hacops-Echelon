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

export async function GET(request, context) {
  console.log('=== Get Single Application API ===');
  
  try {
    // In Next.js 13+ App Router, params needs to be awaited
    const { id } = await context.params;
    
    // Clean the ID (remove any whitespace or extra characters)
    const cleanId = id?.trim();
    
    console.log('Requested ID:', cleanId);
    console.log('ID length:', cleanId?.length);

    if (!cleanId) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
    }

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
    
    // Check officer role
    const user = await db.collection('users').findOne({ 
      _id: new mongoose.Types.ObjectId(decoded.userId) 
    });

    if (!user || user.role !== 'officer') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Validate ObjectId format (24 hex characters)
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(cleanId);
    
    if (!isValidObjectId) {
      console.log('Invalid ObjectId format:', cleanId, 'Length:', cleanId.length);
      
      // Maybe it's a short ID - try to find by partial match
      const allApps = await db.collection('verifications').find({}).limit(100).toArray();
      const matchByPartial = allApps.find(app => 
        app._id.toString().endsWith(cleanId) || 
        app._id.toString().includes(cleanId) ||
        cleanId.includes(app._id.toString().slice(-8))
      );
      
      if (matchByPartial) {
        console.log('Found by partial match:', matchByPartial._id);
        return NextResponse.json(matchByPartial);
      }
      
      return NextResponse.json({ error: 'Invalid application ID format' }, { status: 400 });
    }

    // Find application
    const application = await db.collection('verifications').findOne({
      _id: new mongoose.Types.ObjectId(cleanId)
    });

    if (!application) {
      console.log('Application not found for ID:', cleanId);
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // ============ FETCH DETAILED BEHAVIORAL ANALYSIS ============
    let detailedBehavioralAnalysis = null;
    
    if (application.behavioralAnalysisId) {
      try {
        detailedBehavioralAnalysis = await db.collection('behavioralanalyses').findOne({
          _id: new mongoose.Types.ObjectId(application.behavioralAnalysisId)
        });
        console.log('📊 Fetched detailed behavioral analysis');
      } catch (e) {
        console.log('Could not fetch behavioral analysis:', e.message);
      }
    }
    
    // If no behavioralAnalysisId, try to find by verificationId
    if (!detailedBehavioralAnalysis) {
      try {
        detailedBehavioralAnalysis = await db.collection('behavioralanalyses').findOne({
          verificationId: application._id
        });
        if (detailedBehavioralAnalysis) {
          console.log('📊 Found behavioral analysis by verificationId');
        }
      } catch (e) {
        console.log('Could not fetch behavioral analysis by verificationId:', e.message);
      }
    }

    // ============ BUILD RESPONSE ============
    const response = {
      ...application,
      
      // Include detailed behavioral analysis if available
      detailedBehavioralAnalysis: detailedBehavioralAnalysis ? {
        _id: detailedBehavioralAnalysis._id,
        overallTrustScore: detailedBehavioralAnalysis.overallTrustScore,
        botLikelihood: detailedBehavioralAnalysis.botLikelihood,
        riskLevel: detailedBehavioralAnalysis.riskLevel,
        recommendation: detailedBehavioralAnalysis.recommendation,
        isHuman: detailedBehavioralAnalysis.isHuman,
        confidence: detailedBehavioralAnalysis.confidence,
        flagsDetected: detailedBehavioralAnalysis.flagsDetected || [],
        flagCount: detailedBehavioralAnalysis.flagCount || 0,
        componentScores: detailedBehavioralAnalysis.componentScores,
        keystrokeAnalysis: detailedBehavioralAnalysis.keystrokeAnalysis,
        mouseAnalysis: detailedBehavioralAnalysis.mouseAnalysis,
        pasteAnalysis: detailedBehavioralAnalysis.pasteAnalysis,
        speedAnalysis: detailedBehavioralAnalysis.speedAnalysis,
        rawMetrics: detailedBehavioralAnalysis.rawMetrics,
        analyzedAt: detailedBehavioralAnalysis.analyzedAt
      } : null,
      
      // Ensure behaviorSummary exists (for backward compatibility)
      behaviorSummary: application.behaviorSummary || {
        overallTrustScore: application.behaviorAnalysis?.riskScore ? (100 - application.behaviorAnalysis.riskScore) : 50,
        botLikelihood: application.behaviorAnalysis?.riskScore || 50,
        riskLevel: (application.behaviorAnalysis?.riskScore || 0) >= 70 ? 'high' : 
                   (application.behaviorAnalysis?.riskScore || 0) >= 40 ? 'medium' : 'low',
        isHuman: !(application.behaviorAnalysis?.suspiciousActivity || false),
        recommendation: (application.behaviorAnalysis?.riskScore || 0) > 50 ? 'manual_review' : 'auto_approve'
      }
    };

    console.log('✅ Application found:', application._id);
    console.log('Has detailed behavioral:', !!detailedBehavioralAnalysis);
    
    return NextResponse.json(response);

  } catch (error) {
    console.error('Get application error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}