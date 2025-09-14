/**
 * Client-side functions for processing tracking URLs and fetching data
 * This is a compatibility layer that uses the new unified tracking API endpoints
 */

import {
  TrackingApiResponse,
  TrackingIdentifier,
  TrackingUpdatesResponse,
} from "@/lib/tracking/types";

/**
 * Process multiple tracking URLs
 */
export async function processTrackingUrls(
  urls: string[],
): Promise<TrackingApiResponse[]> {
  try {
    // Step 1: Expand URLs to get tracking identifiers
    const expandResponse = await fetch("/api/tracking/expand-urls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls }),
    });

    if (!expandResponse.ok) {
      throw new Error(`Failed to expand URLs: ${expandResponse.status}`);
    }

    const expandResults = await expandResponse.json();

    // Create a map of URL to identifier for successful parses
    const urlToIdentifier = new Map<string, TrackingIdentifier>();
    const successfulIdentifiers: TrackingIdentifier[] = [];

    for (const result of expandResults.results.results) {
      if (result.success && result.identifier) {
        urlToIdentifier.set(result.originalUrl, result.identifier);
        successfulIdentifiers.push(result.identifier);
      }
    }

    if (successfulIdentifiers.length === 0) {
      return urls.map((url) => ({
        originalUrl: url,
        identifier: null,
        success: false,
        error: {
          code: "INVALID_URL",
          message: "No valid tracking URLs found",
        },
      }));
    }

    // Step 2: Fetch tracking data
    const fetchResponse = await fetch("/api/tracking/fetch-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifiers: successfulIdentifiers }),
    });

    if (!fetchResponse.ok) {
      throw new Error(`Failed to fetch tracking data: ${fetchResponse.status}`);
    }

    const fetchResults = await fetchResponse.json();

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
            code: "INVALID_URL",
            message: "Could not parse URL",
          },
        });
        continue;
      }

      // Find the tracking data for this identifier by matching the identifier
      const trackingData = fetchResults.results.results.find(
        (data: { id: string; identifier: TrackingIdentifier }) => {
          // Match by comparing the identifier data rather than the ID
          if (
            identifier.type === "strava" && data.identifier?.type === "strava"
          ) {
            return data.identifier.data.beaconId === identifier.data.beaconId;
          } else if (
            identifier.type === "garmin" && data.identifier?.type === "garmin"
          ) {
            return data.identifier.data.sessionId ===
                identifier.data.sessionId &&
              data.identifier.data.token === identifier.data.token;
          }
          return false;
        },
      );

      if (trackingData) {
        responses.push({
          originalUrl: url,
          identifier,
          success: true,
          data: trackingData,
        });
      } else {
        responses.push({
          originalUrl: url,
          identifier,
          success: false,
          error: {
            code: "PROVIDER_ERROR",
            message: "Failed to fetch tracking data",
          },
        });
      }
    }

    return responses;
  } catch (error) {
    return urls.map((url) => ({
      originalUrl: url,
      identifier: null,
      success: false,
      error: {
        code: "UNKNOWN",
        message: error instanceof Error
          ? error.message
          : "Failed to process URL",
      },
    }));
  }
}

/**
 * Fetch tracking updates for existing identifiers
 */
export async function fetchTrackingUpdates(
  identifiers: TrackingIdentifier[],
  begin?: Date,
): Promise<TrackingUpdatesResponse[]> {
  try {
    const response = await fetch("/api/tracking/fetch-updates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifiers, begin: begin?.toISOString() || "" }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tracking updates: ${response.status}`);
    }

    const results = await response.json();

    // Convert to API response format
    return results.results.results.map((
      result: {
        id: string;
        coordinates: Array<{ lat: number; lon: number; timestamp: string }>;
      },
    ) => ({
      originalUrl: result.id,
      identifier: identifiers.find((id) =>
        (id.type === "garmin" &&
          result.id.includes(`session/${id.data.sessionId}`)) ||
        (id.type === "strava" &&
          result.id.includes(`beacon/${id.data.beaconId}`))
      ) || null,
      success: true,
      coordinates: result.coordinates,
    }));
  } catch (error) {
    return identifiers.map((identifier) => ({
      originalUrl: "unknown",
      identifier,
      success: false,
      coordinates: [],
      error: {
        code: "UNKNOWN",
        message: error instanceof Error
          ? error.message
          : "Failed to fetch updates",
      },
    }));
  }
}
