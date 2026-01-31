import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';

export async function GET(request) {
  try {
    const { user, response } = await requireAuth(request);

    if (response) {
      return response;
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong',
      },
      { status: 500 }
    );
  }
}