import { NextRequest, NextResponse } from 'next/server';
import { fetchTrackingData } from '@/lib/tracking/service';

export async function POST(request: NextRequest) {
  try {
    const { identifiers } = await request.json();

    if (!Array.isArray(identifiers)) {
      return NextResponse.json(
        { error: 'Identifiers must be an array' },
        { status: 400 }
      );
    }

    const results = await fetchTrackingData({ identifiers });

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error in fetch-data API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracking data' },
      { status: 500 }
    );
  }
}
