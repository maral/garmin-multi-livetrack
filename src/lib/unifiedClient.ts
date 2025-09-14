/**
 * Client-side functions for processing tracking URLs and fetching data
 * This is a compatibility layer that uses the new unified tracking service
 */

import { 
  expandUrls, 
  fetchTrackingData, 
  fetchTrackingUpdates as serviceUpdates 
} from '@/lib/tracking/service';
import { TrackingIdentifier, TrackingApiResponse, TrackingUpdatesResponse } from '@/lib/tracking/types';

/**
 * Process multiple tracking URLs
 */
export async function processTrackingUrls(urls: string[]): Promise<TrackingApiResponse[]> {
  try {
    // Step 1: Expand URLs to get tracking identifiers
    const expandResults = await expandUrls({ urls });
    
    // Create a map of URL to identifier for successful parses
    const urlToIdentifier = new Map<string, TrackingIdentifier>();
    const successfulIdentifiers: TrackingIdentifier[] = [];
    
    for (const result of expandResults.results) {
      if (result.success && result.identifier) {
        urlToIdentifier.set(result.originalUrl, result.identifier);
        successfulIdentifiers.push(result.identifier);
      }
    }
    
    if (successfulIdentifiers.length === 0) {
      return urls.map(url => ({
        originalUrl: url,
        identifier: null,
        success: false,
        error: {
          code: 'INVALID_URL',
          message: 'No valid tracking URLs found'
        }
      }));
    }
    
    // Step 2: Fetch tracking data
    const fetchResults = await fetchTrackingData({ identifiers: successfulIdentifiers });
    
    // Step 3: Convert results back to API response format
    const responses: TrackingApiResponse[] = [];
    
    for (const url of urls) {
      const identifier = urlToIdentifier.get(url);
      if (!identifier) {
        responses.push({
          originalUrl: url,
          identifier: null,
          success: false,
          error: {
            code: 'INVALID_URL',
            message: 'Could not parse URL'
          }
        });
        continue;
      }
      
      // Find the tracking data for this identifier
      const trackingData = fetchResults.results.find(data => data.id === url);
      if (trackingData) {
        responses.push({
          originalUrl: url,
          identifier,
          success: true,
          data: trackingData
        });
      } else {
        responses.push({
          originalUrl: url,
          identifier,
          success: false,
          error: {
            code: 'PROVIDER_ERROR',
            message: 'Failed to fetch tracking data'
          }
        });
      }
    }
    
    return responses;
  } catch (error) {
    return urls.map(url => ({
      originalUrl: url,
      identifier: null,
      success: false,
      error: {
        code: 'UNKNOWN',
        message: error instanceof Error ? error.message : 'Failed to process URL'
      }
    }));
  }
}

/**
 * Fetch tracking updates for existing identifiers
 */
export async function fetchTrackingUpdates(
  identifiers: TrackingIdentifier[], 
  begin?: string
): Promise<TrackingUpdatesResponse[]> {
  try {
    const results = await serviceUpdates({ identifiers, begin: begin || '' });
    
    // Convert to API response format
    return results.results.map(result => ({
      originalUrl: result.id,
      identifier: identifiers.find(id => 
        (id.type === 'garmin' && id.data.sessionId === result.id) ||
        (id.type === 'strava' && id.data.beaconId === result.id)
      ) || null,
      success: true,
      coordinates: result.coordinates
    }));
  } catch (error) {
    return identifiers.map(identifier => ({
      originalUrl: 'unknown',
      identifier,
      success: false,
      coordinates: [],
      error: {
        code: 'UNKNOWN',
        message: error instanceof Error ? error.message : 'Failed to fetch updates'
      }
    }));
  }
}
