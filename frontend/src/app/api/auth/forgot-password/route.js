import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing email',
          message: 'Email is required',
        },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json(
        {
          success: true,
          message: 'If an account exists with this email, you will receive a password reset link',
        },
        { status: 200 }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save reset token to user
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

    // Send email
    const emailResult = await sendPasswordResetEmail(user.email, resetUrl);

    if (!emailResult.success) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      return NextResponse.json(
        {
          success: false,
          error: 'Email send failed',
          message: 'Failed to send reset email. Please try again later.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password error:', error);
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