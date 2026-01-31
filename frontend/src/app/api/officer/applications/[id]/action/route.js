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

export async function POST(request, { params }) {
  console.log('=== Officer Action API ===');
  
  try {
    const { id } = params;
    console.log('Action for ID:', id);

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

    if (!officer || officer.role !== 'officer') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { action, remarks } = body;
    console.log('Action:', action, 'Remarks:', remarks);

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (action === 'reject' && !remarks?.trim()) {
      return NextResponse.json({ error: 'Rejection reason required' }, { status: 400 });
    }

    const verificationsCollection = db.collection('verifications');
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('Invalid ObjectId format:', id);
      return NextResponse.json({ error: 'Invalid application ID format' }, { status: 400 });
    }

    // Find verification
    let verification = await verificationsCollection.findOne({
      _id: new mongoose.Types.ObjectId(id)
    });

    // If not found, try partial match
    if (!verification) {
      console.log('Not found by exact ID, trying partial match...');
      const allApps = await verificationsCollection.find({
        status: 'under_officer_review'
      }).toArray();
      
      verification = allApps.find(app => 
        app._id.toString() === id ||
        app._id.toString().endsWith(id) || 
        app._id.toString().includes(id) ||
        id.includes(app._id.toString().slice(-8))
      );
      
      if (verification) {
        console.log('Found by partial match:', verification._id);
      }
    }

    if (!verification) {
      console.log('Verification not found for ID:', id);
      return NextResponse.json({ error: 'Verification not found' }, { status: 404 });
    }

    console.log('Found verification:', verification._id, 'Status:', verification.status);

    // Check status
    if (verification.status !== 'under_officer_review') {
      return NextResponse.json({ 
        error: `Cannot process. Current status is "${verification.status}".`
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

    // Update user
    if (verification.userId) {
      await db.collection('users').updateOne(
        { _id: verification.userId },
        { 
          $set: { 
            isVerified: action === 'approve',
            verificationStatus: newStatus,
            updatedAt: now
          }
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Application ${newStatus} successfully`,
      status: newStatus
    });

  } catch (error) {
    console.error('Action error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}