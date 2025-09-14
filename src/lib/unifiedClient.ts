/**
 * Unified client functions for multi-provider tracking
 * Uses the updated unified endpoints: expand-url-batch and garmin-fetch-batch
 */

import { ParsedProviderData, TrackingApiResponse, TrackingUpdatesResponse } from '@/lib/tracking/types';

/**
 * Process multiple tracking URLs and fetch their data
 * Uses the unified endpoint system
 */
export async function processTrackingUrls(urls: string[]): Promise<TrackingApiResponse[]> {
  try {
    // Step 1: Expand and parse URLs using unified tracking endpoint
    const expandResponse = await fetch('/api/tracking/expand-urls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls })
    });

    if (!expandResponse.ok) {
      throw new Error('Failed to expand URLs');
    }

    const { results: parsedUrls }: { results: ParsedProviderData[] } = await expandResponse.json();

    // Step 2: Fetch tracking data for valid URLs using unified garmin-fetch-batch 
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

    // Step 3: Fetch actual tracking data using unified endpoint
    const fetchResponse = await fetch('/api/tracking/fetch-data', {
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
 * Uses the unified tracking updates endpoint
 */
export async function fetchTrackingUpdates(
  parsedUrls: ParsedProviderData[], 
  lastUpdate?: string
): Promise<TrackingUpdatesResponse[]> {
  try {
    const response = await fetch('/api/tracking/fetch-updates', {
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
