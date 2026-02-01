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

export async function POST(request, context) {
  console.log('=== Officer Action API ===');
  
  try {
    // In Next.js 13+ App Router, params needs to be awaited
    const { id } = await context.params;
    console.log('Action for ID:', id);

    if (!id) {
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
    
    // Verify officer role
    const officer = await db.collection('users').findOne({ 
      _id: new mongoose.Types.ObjectId(decoded.userId) 
    });

    if (!officer || (officer.role !== 'officer' && officer.role !== 'admin')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { action, remarks } = body;
    console.log('Action:', action, 'Remarks:', remarks);

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be "approve" or "reject"' }, { status: 400 });
    }

    if (action === 'reject' && !remarks?.trim()) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
    }

    const verificationsCollection = db.collection('verifications');
    
    // Clean and validate ID
    const cleanId = id.trim();
    
    // Validate ObjectId format (24 hex characters)
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(cleanId);
    
    let verification = null;

    if (isValidObjectId) {
      // Try exact match first
      verification = await verificationsCollection.findOne({
        _id: new mongoose.Types.ObjectId(cleanId)
      });
    }

    // If not found, try partial match
    if (!verification) {
      console.log('Not found by exact ID, trying partial match...');
      const allApps = await verificationsCollection.find({}).limit(200).toArray();
      
      verification = allApps.find(app => {
        const appIdStr = app._id.toString();
        return appIdStr === cleanId ||
               appIdStr.endsWith(cleanId) || 
               appIdStr.includes(cleanId) ||
               cleanId.includes(appIdStr.slice(-8)) ||
               cleanId.toUpperCase() === appIdStr.slice(-8).toUpperCase() ||
               cleanId.toLowerCase() === appIdStr.slice(-6).toLowerCase();
      });
      
      if (verification) {
        console.log('Found by partial match:', verification._id);
      }
    }

    if (!verification) {
      console.log('Verification not found for ID:', cleanId);
      return NextResponse.json({ error: 'Verification not found' }, { status: 404 });
    }

    console.log('Found verification:', verification._id, 'Status:', verification.status);

    // Check if already reviewed
    if (['approved', 'rejected'].includes(verification.status)) {
      return NextResponse.json({ 
        error: `Application has already been ${verification.status}. Cannot process again.`
      }, { status: 400 });
    }

    // Allow action on under_officer_review or under_automated_verification status
    const allowedStatuses = ['under_officer_review', 'under_automated_verification', 'submitted'];
    if (!allowedStatuses.includes(verification.status)) {
      return NextResponse.json({ 
        error: `Cannot process application with status "${verification.status}". Expected: under_officer_review`
      }, { status: 400 });
    }

    const now = new Date();
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    const updateData = {
      status: newStatus,
      reviewedBy: new mongoose.Types.ObjectId(decoded.userId),
      reviewedByName: officer.name || officer.email,
      reviewedAt: now,
      updatedAt: now,
    };

    if (action === 'reject') {
      updateData.rejectionReason = remarks;
    }

    // Update verification
    const updateResult = await verificationsCollection.updateOne(
      { _id: verification._id },
      { 
        $set: updateData,
        $push: {
          statusHistory: {
            status: newStatus,
            changedAt: now,
            changedBy: new mongoose.Types.ObjectId(decoded.userId),
            changedByName: officer.name || officer.email,
            remarks: remarks || `Application ${newStatus} by officer`
          }
        }
      }
    );

    console.log('Update result:', updateResult);

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: 'Failed to update verification' }, { status: 500 });
    }

    // Update user verification status
    if (verification.userId) {
      try {
        await db.collection('users').updateOne(
          { _id: new mongoose.Types.ObjectId(verification.userId) },
          { 
            $set: { 
              isVerified: action === 'approve',
              verificationStatus: newStatus,
              updatedAt: now
            }
          }
        );
        console.log('Updated user verification status');
      } catch (userErr) {
        console.error('Failed to update user:', userErr);
        // Don't fail the whole operation if user update fails
      }
    }

    // Also update the verificationResults if exists
    try {
      await db.collection('verificationresults').updateOne(
        { verificationId: verification._id },
        {
          $set: {
            'overallAssessment.finalDecision': action === 'approve' ? 'APPROVED' : 'REJECTED',
            reviewedBy: new mongoose.Types.ObjectId(decoded.userId),
            reviewedAt: now,
            reviewNotes: remarks || '',
            updatedAt: now
          }
        }
      );
    } catch (vrErr) {
      console.log('Could not update verificationResults:', vrErr.message);
    }

    return NextResponse.json({
      success: true,
      message: `Application ${newStatus} successfully`,
      status: newStatus,
      applicationId: verification._id.toString()
    });

  } catch (error) {
    console.error('Action error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}