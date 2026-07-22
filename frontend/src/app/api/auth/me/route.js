import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';

export async function GET(request) {
  try {
    const { user, response } = await requireAuth(request);
    if (response) return response;

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
    });

  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
