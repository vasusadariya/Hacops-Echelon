import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';

export async function POST(request, { params }) {
  try {
    const { id } = params;

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

    // Parse request body
    const { action, remarks } = await request.json();

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (action === 'reject' && !remarks?.trim()) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
    }

    // Update application
    const verificationsCollection = db.collection('verifications');
    const now = new Date();
    
    const updateData = {
      status: action === 'approve' ? 'approved' : 'rejected',
      reviewedBy: new mongoose.Types.ObjectId(decoded.userId),
      reviewedAt: now,
      updatedAt: now
    };

    if (action === 'reject') {
      updateData.rejectionReason = remarks;
    }

    const result = await verificationsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { 
        $set: updateData,
        $push: {
          statusHistory: {
            status: updateData.status,
            changedAt: now,
            changedBy: new mongoose.Types.ObjectId(decoded.userId),
            remarks: remarks || `Application ${action}d by officer`
          }
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Update user's verification status if approved
    if (action === 'approve') {
      const verification = await verificationsCollection.findOne({
        _id: new mongoose.Types.ObjectId(id)
      });
      
      if (verification?.userId) {
        await usersCollection.updateOne(
          { _id: verification.userId },
          { 
            $set: { 
              isVerified: true,
              verificationStatus: 'approved'
            }
          }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Application ${action}d successfully`
    });

  } catch (error) {
    console.error('Action error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}