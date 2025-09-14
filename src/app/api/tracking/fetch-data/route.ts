import { NextRequest, NextResponse } from 'next/server';
import { ParsedProviderData, TrackingApiResponse } from '@/lib/tracking/types';
import { fetchSingleGarminAthlete } from '@/lib/garmin-api';
import { fetchSingleStravaAthlete } from '@/lib/strava-api';
import { convertGarminToUnified, convertStravaToUnified } from '@/lib/tracking/converters';

export async function POST(request: NextRequest) {
  try {
    const { parsedUrls }: { parsedUrls: ParsedProviderData[] } = await request.json();

    if (!Array.isArray(parsedUrls)) {
      return NextResponse.json(
        { error: 'Parsed URLs must be an array' },
        { status: 400 }
      );
    }

    // Process all athletes in parallel
    const results = await Promise.allSettled(
      parsedUrls.map(async (parsedUrl: ParsedProviderData): Promise<TrackingApiResponse> => {
        try {
          // Skip invalid URLs
          if (!parsedUrl.success || !parsedUrl.provider || !parsedUrl.data) {
            return {
              originalUrl: parsedUrl.originalUrl,
              provider: parsedUrl.provider,
              success: false,
              error: parsedUrl.error || {
                code: 'INVALID_URL',
                message: 'Invalid or unsupported URL'
              }
            };
          }

          // Route to appropriate provider API
          if (parsedUrl.provider === 'garmin') {
            const { sessionId, token } = parsedUrl.data;
            if (!sessionId || !token) {
              return {
                originalUrl: parsedUrl.originalUrl,
                provider: 'garmin',
                success: false,
                error: {
                  code: 'PROVIDER_ERROR',
                  message: 'Missing sessionId or token for Garmin URL'
                }
              };
            }
            
            const garminData = await fetchSingleGarminAthlete(sessionId, token);
            const unifiedData = convertGarminToUnified(garminData, parsedUrl.originalUrl);
            
            return {
              originalUrl: parsedUrl.originalUrl,
              provider: 'garmin',
              success: true,
              data: unifiedData
            };
          }

          if (parsedUrl.provider === 'strava') {
            const { beaconId } = parsedUrl.data;
            if (!beaconId) {
              return {
                originalUrl: parsedUrl.originalUrl,
                provider: 'strava',
                success: false,
                error: {
                  code: 'PROVIDER_ERROR',
                  message: 'Missing beaconId for Strava URL'
                }
              };
            }
            
            // Fetch Strava data using the proper function
            const stravaData = await fetchSingleStravaAthlete(beaconId);
            const unifiedData = convertStravaToUnified(stravaData, parsedUrl.originalUrl);
            
            return {
              originalUrl: parsedUrl.originalUrl,
              provider: 'strava',
              success: true,
              data: unifiedData
            };
          }

          // This shouldn't happen
          return {
            originalUrl: parsedUrl.originalUrl,
            provider: parsedUrl.provider,
            success: false,
            error: {
              code: 'PROVIDER_ERROR',
              message: 'Unsupported provider'
            }
          };

        } catch (error) {
          return {
            originalUrl: parsedUrl.originalUrl,
            provider: parsedUrl.provider,
            success: false,
            error: {
              code: 'UNKNOWN',
              message: error instanceof Error ? error.message : 'Failed to fetch athlete data'
            }
          };
        }
      })
    );

    // Extract results from Promise.allSettled
    const trackingResults: TrackingApiResponse[] = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        // Handle Promise rejection
        return {
          originalUrl: parsedUrls[index].originalUrl,
          provider: parsedUrls[index].provider,
          success: false,
          error: {
            code: 'UNKNOWN',
            message: result.reason instanceof Error ? result.reason.message : 'Promise rejected'
          }
        };
      }
    });

    return NextResponse.json({ results: trackingResults });

  } catch (error) {
    console.error('Error in unified fetch-batch:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
