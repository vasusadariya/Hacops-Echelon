import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';

export async function POST(request) {
  try {
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
    
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ 
      _id: new mongoose.Types.ObjectId(decoded.userId) 
    });

    if (!user || user.role !== 'officer') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const verificationsCollection = db.collection('verifications');

    // Update all submitted/under_automated_verification to under_officer_review
    const updateResult = await verificationsCollection.updateMany(
      { 
        status: { $in: ['submitted', 'under_automated_verification'] }
      },
      { 
        $set: { 
          status: 'under_officer_review',
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: `Updated ${updateResult.modifiedCount} documents`,
      modifiedCount: updateResult.modifiedCount
    });

  } catch (error) {
    console.error('Fix statuses error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}