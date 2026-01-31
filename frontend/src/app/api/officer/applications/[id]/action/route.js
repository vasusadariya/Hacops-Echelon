import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';

export async function POST(request, { params }) {
  try {
    const { id } = params;

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

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Use "approve" or "reject".' }, { status: 400 });
    }

    if (action === 'reject' && !remarks?.trim()) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
    }

    const verificationsCollection = db.collection('verifications');
    const now = new Date();
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    // Prepare update
    const updateData = {
      status: newStatus,
      reviewedBy: new mongoose.Types.ObjectId(decoded.userId),
      reviewedByName: officer.name,
      reviewedAt: now,
      updatedAt: now
    };

    if (action === 'reject') {
      updateData.rejectionReason = remarks;
    }

    // Update verification
    const result = await verificationsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { 
        $set: updateData,
        $push: {
          statusHistory: {
            status: newStatus,
            changedAt: now,
            changedBy: new mongoose.Types.ObjectId(decoded.userId),
            changedByName: officer.name,
            remarks: remarks || `Application ${newStatus} by officer`
          }
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Update user's verification status
    const verification = await verificationsCollection.findOne({ 
      _id: new mongoose.Types.ObjectId(id) 
    });
    
    if (verification?.userId) {
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