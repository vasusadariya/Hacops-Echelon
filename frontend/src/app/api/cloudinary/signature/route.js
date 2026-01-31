import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { verifyToken } from '@/lib/jwt';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { folder, uploadPreset } = body;

    const timestamp = Math.round(new Date().getTime() / 1000);
    
    const paramsToSign = {
      timestamp,
      folder: folder || 'verification/selfies',
      upload_preset: uploadPreset || 'verification_preset'
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET
    );

    return NextResponse.json({
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder: paramsToSign.folder
    });

  } catch (error) {
    console.error('Signature generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}