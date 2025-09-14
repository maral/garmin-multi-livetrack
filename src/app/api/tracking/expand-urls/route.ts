import { NextRequest, NextResponse } from 'next/server';
import { expandUrls } from '@/lib/tracking/service';

export async function POST(request: NextRequest) {
  try {
    const { urls } = await request.json();

    if (!Array.isArray(urls)) {
      return NextResponse.json(
        { error: 'URLs must be an array' },
        { status: 400 }
      );
    }

    const results = await expandUrls({ urls });

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error in expand-urls API:', error);
    return NextResponse.json(
      { error: 'Failed to expand URLs' },
      { status: 500 }
    );
  }
}
