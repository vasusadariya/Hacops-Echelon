import { NextResponse } from 'next/server';
import { verifyToken } from './jwt';
import connectDB from './mongodb';
import User from '@/models/User';

export async function authenticate(request) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        error: {
          success: false,
          error: 'Unauthorized',
          message: "No token provided. Please include 'Authorization: Bearer <token>' header",
        },
        status: 401,
      };
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return {
        error: {
          success: false,
          error: 'Unauthorized',
          message: 'Invalid or expired token',
        },
        status: 401,
      };
    }

    await connectDB();

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return {
        error: {
          success: false,
          error: 'Unauthorized',
          message: 'User not found',
        },
        status: 401,
      };
    }

    return { user };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      error: {
        success: false,
        error: 'Internal server error',
        message: 'Authentication failed',
      },
      status: 500,
    };
  }
}

export async function requireAuth(request) {
  const result = await authenticate(request);

  if (result.error) {
    return {
      response: NextResponse.json(result.error, { status: result.status }),
    };
  }

  return { user: result.user };
}