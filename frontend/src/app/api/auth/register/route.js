import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { signToken } from '@/lib/jwt';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    console.log('Registration attempt for email:', email);

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    console.log('Password hashed successfully, length:', hashedPassword.length);

    // Create user with explicit password field
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword, // Make sure this is included
      role: 'user',
      isVerified: false
    });

    await user.save();

    console.log('User created with ID:', user._id);

    // Verify password was saved
    const savedUser = await User.findById(user._id).select('+password');
    console.log('Saved user has password:', !!savedUser.password);

    // Generate token
    const token = signToken({ 
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    });

    // Return user data (without password)
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt
    };

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      token,
      user: userData
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}