import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { signToken } from '@/lib/jwt';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('Login attempt for email:', email);

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find user by email - explicitly select password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    console.log('User found:', user ? 'Yes' : 'No');

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Debug: Check if password exists
    console.log('User has password field:', !!user.password);

    // Check if password exists in user document
    if (!user.password) {
      console.error('User found but password field is missing!');
      console.log('User document fields:', Object.keys(user.toObject()));
      return NextResponse.json(
        { error: 'Account error. Please contact support or reset your password.' },
        { status: 500 }
      );
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate token
    const token = signToken({ 
      userId: user._id.toString(),
      email: user.email,
      role: user.role || 'user'
    });

    // Return user data (without password)
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role || 'user',
      isVerified: user.isVerified || false,
      createdAt: user.createdAt
    };

    console.log('Login successful for:', email);

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}