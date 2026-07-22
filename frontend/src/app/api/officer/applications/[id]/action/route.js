import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-middleware';

export async function POST(request, context) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
    }

    const { user: officer, response } = await requireAuth(request, { roles: ['officer', 'admin'] });
    if (response) return response;

    const body = await request.json();
    const { action, remarks } = body;

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be "approve" or "reject"' }, { status: 400 });
    }

    if (action === 'reject' && !remarks?.trim()) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
    }

    const verification = await prisma.verification.findUnique({ where: { id } });

    if (!verification) {
      return NextResponse.json({ error: 'Verification not found' }, { status: 404 });
    }

    if (['approved', 'rejected'].includes(verification.status)) {
      return NextResponse.json(
        { error: `Application has already been ${verification.status}. Cannot process again.` },
        { status: 400 }
      );
    }

    const allowedStatuses = ['under_officer_review', 'under_automated_verification', 'submitted'];
    if (!allowedStatuses.includes(verification.status)) {
      return NextResponse.json(
        { error: `Cannot process application with status "${verification.status}". Expected: under_officer_review` },
        { status: 400 }
      );
    }

    const now = new Date();
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    await prisma.$transaction(async (tx) => {
      await tx.verification.update({
        where: { id },
        data: {
          status: newStatus,
          reviewedById: officer.id,
          reviewedByName: officer.name || officer.email,
          reviewedAt: now,
          rejectionReason: action === 'reject' ? remarks : verification.rejectionReason,
          statusHistory: [
            ...(verification.statusHistory || []),
            {
              status: newStatus,
              changedAt: now.toISOString(),
              changedBy: officer.id,
              changedByName: officer.name || officer.email,
              remarks: remarks || `Application ${newStatus} by officer`,
            },
          ],
        },
      });

      await tx.user.update({
        where: { id: verification.userId },
        data: { isVerified: action === 'approve', verificationStatus: newStatus },
      });

      // VerificationResult may not exist yet if AI processing never ran/finished.
      await tx.verificationResult.updateMany({
        where: { verificationId: id },
        data: {
          finalDecision: action === 'approve' ? 'APPROVED' : 'REJECTED',
          reviewedById: officer.id,
          reviewedAt: now,
          reviewNotes: remarks || '',
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Application ${newStatus} successfully`,
      status: newStatus,
      applicationId: id,
    });

  } catch (error) {
    console.error('Action error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
