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

export async function GET(request, { params }) {
  console.log('=== Get Single Application API ===');
  
  try {
    const { id } = params;
    console.log('Requested ID:', id);

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

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('Invalid ObjectId format:', id);
      return NextResponse.json({ error: 'Invalid application ID format' }, { status: 400 });
    }

    // Find application
    const application = await db.collection('verifications').findOne({
      _id: new mongoose.Types.ObjectId(id)
    });

    if (!application) {
      console.log('Application not found for ID:', id);
      
      // Try to find by partial ID match (last 8 characters)
      const allApps = await db.collection('verifications').find({}).toArray();
      const matchByPartial = allApps.find(app => 
        app._id.toString().endsWith(id) || 
        app._id.toString().includes(id) ||
        id.includes(app._id.toString().slice(-8))
      );
      
      if (matchByPartial) {
        console.log('Found by partial match:', matchByPartial._id);
        return NextResponse.json(matchByPartial);
      }
      
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    console.log('Application found:', application._id);
    return NextResponse.json(application);

  } catch (error) {
    console.error('Get application error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}