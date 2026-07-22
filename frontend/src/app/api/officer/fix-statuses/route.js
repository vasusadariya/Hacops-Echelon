import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-middleware';

export async function POST(request) {
  try {
    const { response } = await requireAuth(request, { roles: ['officer', 'admin'] });
    if (response) return response;

    const result = await prisma.verification.updateMany({
      where: { status: { in: ['submitted', 'under_automated_verification'] } },
      data: { status: 'under_officer_review' },
    });

    return NextResponse.json({
      success: true,
      message: `Updated ${result.count} documents`,
      modifiedCount: result.count,
    });

  } catch (error) {
    console.error('Fix statuses error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
