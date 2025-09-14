import { NextRequest, NextResponse } from 'next/server';
import { fetchTrackingUpdates } from '@/lib/tracking/service';

export async function POST(request: NextRequest) {
  try {
    const { identifiers, begin } = await request.json();

    if (!Array.isArray(identifiers)) {
      return NextResponse.json(
        { error: 'Identifiers must be an array' },
        { status: 400 }
      );
    }

    const results = await fetchTrackingUpdates({ identifiers, begin });

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error in fetch-updates API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracking updates' },
      { status: 500 }
    );
  }
}
