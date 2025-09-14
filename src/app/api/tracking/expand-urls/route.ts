import { NextRequest, NextResponse } from 'next/server';
import { processUrl } from '@/lib/tracking/providers';
import { ParsedProviderData } from '@/lib/tracking/types';

export async function POST(request: NextRequest) {
  try {
    const { urls }: { urls: string[] } = await request.json();

    if (!Array.isArray(urls)) {
      return NextResponse.json(
        { error: 'URLs must be an array' },
        { status: 400 }
      );
    }

    // Process all URLs in parallel using unified system
    const results = await Promise.allSettled(
      urls.map(async (url: string): Promise<ParsedProviderData> => {
        try {
          // Process URL: expand if needed, then parse provider data
          const result = await processUrl(url);
          return result;
        } catch (error) {
          return {
            originalUrl: url,
            provider: null,
            success: false,
            error: {
              code: 'UNKNOWN',
              message: error instanceof Error ? error.message : 'Failed to process URL'
            }
          };
        }
      })
    );

    // Extract results from Promise.allSettled
    const parsedResults: ParsedProviderData[] = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        // Handle Promise rejection
        return {
          originalUrl: urls[index],
          provider: null,
          success: false,
          error: {
            code: 'UNKNOWN',
            message: result.reason instanceof Error ? result.reason.message : 'Promise rejected'
          }
        };
      }
    });

    return NextResponse.json({ results: parsedResults });

  } catch (error) {
    console.error('Error in expand-url-batch:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
