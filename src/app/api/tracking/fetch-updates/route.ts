import { NextRequest, NextResponse } from 'next/server';
import { ParsedProviderData, UnifiedCoordinate, TrackingUpdatesResponse } from '@/lib/tracking/types';
import { fetchSingleGarminAthleteUpdates } from '@/lib/garmin-api';
import { fetchSingleStravaAthleteUpdates } from '@/lib/strava-api';

export async function POST(request: NextRequest) {
  try {
    const { parsedUrls, begin }: { parsedUrls: ParsedProviderData[], begin?: string } = await request.json();

    if (!Array.isArray(parsedUrls)) {
      return NextResponse.json(
        { error: 'Parsed URLs must be an array' },
        { status: 400 }
      );
    }

    // Process all athletes in parallel
    const results = await Promise.allSettled(
      parsedUrls.map(async (parsedUrl: ParsedProviderData): Promise<TrackingUpdatesResponse> => {
        try {
          // Skip invalid URLs
          if (!parsedUrl.success || !parsedUrl.provider || !parsedUrl.data) {
            return {
              originalUrl: parsedUrl.originalUrl,
              provider: parsedUrl.provider,
              success: false,
              coordinates: [],
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
                coordinates: [],
                error: {
                  code: 'PROVIDER_ERROR',
                  message: 'Missing sessionId or token for Garmin URL'
                }
              };
            }
            
            const garminCoords = await fetchSingleGarminAthleteUpdates(sessionId, token, begin || '');
            
            // Convert to unified format
            const coordinates: UnifiedCoordinate[] = garminCoords.map(coord => ({
              lat: coord.position.lat,
              lon: coord.position.lon,
              timestamp: coord.timestamp,
              altitude: coord.altitude,
              speed: coord.speed
            }));
            
            return {
              originalUrl: parsedUrl.originalUrl,
              provider: 'garmin',
              success: true,
              coordinates
            };
          }

          if (parsedUrl.provider === 'strava') {
            const { beaconId } = parsedUrl.data;
            
            if (!beaconId) {
              return {
                originalUrl: parsedUrl.originalUrl,
                provider: 'strava',
                success: false,
                coordinates: [],
                error: {
                  code: 'PROVIDER_ERROR',
                  message: 'Missing beaconId for Strava URL'
                }
              };
            }
            
            if (!begin) {
              return {
                originalUrl: parsedUrl.originalUrl,
                provider: 'strava',
                success: false,
                coordinates: [],
                error: {
                  code: 'INVALID_URL',
                  message: 'Begin timestamp required for Strava updates'
                }
              };
            }
            
            const stravaCoords = await fetchSingleStravaAthleteUpdates(beaconId, begin);
            
            // Convert to unified format
            const coordinates: UnifiedCoordinate[] = stravaCoords.map(coord => ({
              lat: coord.position.lat,
              lon: coord.position.lon,
              timestamp: coord.timestamp,
              altitude: undefined, // Strava doesn't provide altitude
              speed: undefined     // Strava doesn't provide speed
            }));
            
            return {
              originalUrl: parsedUrl.originalUrl,
              provider: 'strava',
              success: true,
              coordinates
            };
          }

          // This shouldn't happen
          return {
            originalUrl: parsedUrl.originalUrl,
            provider: parsedUrl.provider,
            success: false,
            coordinates: [],
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
            coordinates: [],
            error: {
              code: 'UNKNOWN',
              message: error instanceof Error ? error.message : 'Failed to fetch updates'
            }
          };
        }
      })
    );

    // Extract results from Promise.allSettled
    const updateResults: TrackingUpdatesResponse[] = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        // Handle Promise rejection
        return {
          originalUrl: parsedUrls[index].originalUrl,
          provider: parsedUrls[index].provider,
          success: false,
          coordinates: [],
          error: {
            code: 'UNKNOWN',
            message: result.reason instanceof Error ? result.reason.message : 'Promise rejected'
          }
        };
      }
    });

    return NextResponse.json({ results: updateResults });

  } catch (error) {
    console.error('Error in unified fetch-updates-batch:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
