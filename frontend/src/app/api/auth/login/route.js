import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generateToken } from '@/lib/jwt';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing credentials',
          message: 'Email and password are required',
        },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user || !user.password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid credentials',
          message: 'Invalid email or password',
        },
        { status: 401 }
      );
    }

    const isCorrectPassword = await bcrypt.compare(password, user.password);

    if (!isCorrectPassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid credentials',
          message: 'Invalid email or password',
        },
        { status: 401 }
      );
    }

    const token = generateToken(user);

    const userWithoutPassword = {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    };

    return NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        token: token,
        user: userWithoutPassword,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong during login',
      },
      { status: 500 }
    );
  }
}