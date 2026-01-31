import { NextResponse } from 'next/server';
import axios from 'axios';
// import { verifyToken } from '@/lib/jwt';

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
    const { imageUrl } = body;

    // Validation
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(imageUrl);
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid image URL format' },
        { status: 400 }
      );
    }

    // Check for required environment variables
    const apiUser = process.env.SIGHTENGINE_API_USER;
    const apiSecret = process.env.SIGHTENGINE_API_SECRET;

    if (!apiUser || !apiSecret) {
      console.error('SightEngine API credentials not configured');
      return NextResponse.json(
        { error: 'AI detection service not configured' },
        { status: 500 }
      );
    }

    // Call SightEngine API to detect AI-generated images
    const response = await axios.get('https://api.sightengine.com/1.0/check.json', {
      params: {
        'url': imageUrl,
        'models': 'genai',
        'api_user': apiUser,
        'api_secret': apiSecret,
      },
      timeout: 30000,
    });

    const result = response.data;

    // Extract genai detection results
    const genaiData = result.genai || {};
    const isAIGenerated = genaiData.score > 0.5; // Score > 0.5 indicates likely AI generation

    return NextResponse.json({
      success: true,
      isAIGenerated,
      confidence: genaiData.score || 0,
      rawData: {
        genai: genaiData,
        status: result.status,
        request_id: result.request_id,
      }
    });

  } catch (error) {
    console.error('AI Generation Detection Error:', error.message);

    // Handle specific API errors
    if (error.response?.status === 400) {
      return NextResponse.json(
        { error: 'Invalid image URL or image cannot be processed' },
        { status: 400 }
      );
    }

    if (error.response?.status === 403) {
      return NextResponse.json(
        { error: 'API credentials are invalid or quota exceeded' },
        { status: 403 }
      );
    }

    if (error.code === 'ECONNABORTED') {
      return NextResponse.json(
        { error: 'Request timeout. Image processing took too long' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to analyze image. Please try again.' },
      { status: 500 }
    );
  }
}
