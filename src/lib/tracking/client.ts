import { ParsedProviderData, TrackingApiResponse, TrackingUpdatesResponse } from '@/lib/tracking/types';

/**
 * Example client-side usage of the unified tracking API
 */

/**
 * Process multiple tracking URLs and fetch their data
 */
export async function processTrackingUrls(urls: string[]): Promise<TrackingApiResponse[]> {
  try {
    // Step 1: Expand and parse URLs
    const expandResponse = await fetch('/api/tracking/expand-url-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls })
    });

    if (!expandResponse.ok) {
      throw new Error('Failed to expand URLs');
    }

    const { results: parsedUrls }: { results: ParsedProviderData[] } = await expandResponse.json();

    // Step 2: Fetch tracking data for valid URLs
    const validUrls = parsedUrls.filter(parsed => parsed.success);

    if (validUrls.length === 0) {
      console.warn('No valid tracking URLs found');
      return parsedUrls.map(parsed => ({
        originalUrl: parsed.originalUrl,
        provider: parsed.provider,
        success: false,
        error: parsed.error || {
          code: 'INVALID_URL',
          message: 'No valid URLs to process'
        }
      }));
    }

    // Step 3: Fetch actual tracking data
    const fetchResponse = await fetch('/api/tracking/fetch-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parsedUrls: validUrls })
    });

    if (!fetchResponse.ok) {
      throw new Error('Failed to fetch tracking data');
    }

    const { results: trackingResults }: { results: TrackingApiResponse[] } = await fetchResponse.json();

    // Step 4: Merge results with failed parsing results
    const allResults: TrackingApiResponse[] = [];
    const trackingMap = new Map(trackingResults.map(result => [result.originalUrl, result]));

    for (const parsed of parsedUrls) {
      if (parsed.success) {
        const tracking = trackingMap.get(parsed.originalUrl);
        if (tracking) {
          allResults.push(tracking);
        } else {
          // Parsed successfully but tracking failed
          allResults.push({
            originalUrl: parsed.originalUrl,
            provider: parsed.provider,
            success: false,
            error: {
              code: 'UNKNOWN',
              message: 'Failed to fetch tracking data'
            }
          });
        }
      } else {
        // Parsing failed
        allResults.push({
          originalUrl: parsed.originalUrl,
          provider: parsed.provider,
          success: false,
          error: parsed.error
        });
      }
    }

    return allResults;

  } catch (error) {
    console.error('Error processing tracking URLs:', error);
    
    // Return error results for all URLs
    return urls.map(url => ({
      originalUrl: url,
      provider: null,
      success: false,
      error: {
        code: 'UNKNOWN',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }));
  }
}

/**
 * Fetch updates for already processed URLs
 */
export async function fetchTrackingUpdates(
  parsedUrls: ParsedProviderData[], 
  lastUpdate?: string
): Promise<TrackingUpdatesResponse[]> {
  try {
    const response = await fetch('/api/tracking/fetch-updates-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        parsedUrls,
        begin: lastUpdate
      })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch tracking updates');
    }

    const { results } = await response.json();
    return results;

  } catch (error) {
    console.error('Error fetching tracking updates:', error);
    
    return parsedUrls.map(parsed => ({
      originalUrl: parsed.originalUrl,
      provider: parsed.provider,
      success: false,
      coordinates: [],
      error: {
        code: 'UNKNOWN',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }));
  }
}

/**
 * Example usage
 */
export async function exampleUsage() {
  const urls = [
    'https://livetrack.garmin.com/session/...',
    'https://www.strava.com/activities/.../beacon/...',
    'https://gar.mn/...' // Short URL that will be expanded
  ];

  console.log('Processing tracking URLs...');
  const results = await processTrackingUrls(urls);

  for (const result of results) {
    if (result.success && result.data) {
      console.log(`✅ ${result.provider?.toUpperCase()} - ${result.data.athleteName}`);
      console.log(`   Coordinates: ${result.data.coordinates.length} points`);
      console.log(`   Last update: ${result.data.lastUpdate}`);
    } else {
      console.log(`❌ Failed: ${result.originalUrl}`);
      console.log(`   Error: ${result.error?.message}`);
    }
  }

  // Fetch updates every 30 seconds
  const validResults = results.filter(r => r.success);
  if (validResults.length > 0) {
    console.log('Setting up periodic updates...');
    setInterval(async () => {
      const parsedUrls = validResults.map(r => ({
        originalUrl: r.originalUrl,
        provider: r.provider!,
        success: true,
        data: r.data ? {
          sessionId: r.provider === 'garmin' ? 'session_id' : undefined,
          token: r.provider === 'garmin' ? 'token' : undefined,
          beaconId: r.provider === 'strava' ? 'beacon_id' : undefined
        } : undefined
      }));

      const updates = await fetchTrackingUpdates(parsedUrls, new Date().toISOString());
      console.log(`Updates: ${updates.filter(u => u.success).length} successful`);
    }, 30000);
  }
}
