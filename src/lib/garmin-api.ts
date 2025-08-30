export interface GarminCoordinate {
  position: {
    lat: number;
    lon: number;
  };
  timestamp: string;
  altitude?: number;
  speed?: number;
  heading?: number;
  fitnessData?: {
    heartRateBeatsPerMin?: number;
    powerWatts?: number;
    cadenceCyclesPerMin?: number;
    totalDistanceMeters?: number;
    activityType?: string;
  };
}

export interface GarminProfile {
  name: string;
  location: string;
  sessionName?: string;
  activityType?: string;
}

export interface GarminCoursePoint {
  position: {
    lat: number;
    lon: number;
  };
}

export interface GarminTrackingData {
  sessionId: string;
  token: string;
  coordinates: GarminCoordinate[];
  coursePoints?: GarminCoursePoint[];
  profile: GarminProfile;
  lastUpdate: string;
}

export interface ParsedGarminUrl {
  sessionId: string;
  token: string;
}

/**
 * Check if a URL is a valid Garmin LiveTrack URL
 */
export function isValidGarminUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return (
      urlObj.hostname === "livetrack.garmin.com" ||
      urlObj.hostname === "gar.mn" ||
      urlObj.hostname === "www.gar.mn"
    );
  } catch {
    return false;
  }
}

/**
 * Parse a Garmin LiveTrack URL to extract session ID and token
 */
export function parseGarminUrl(url: string): ParsedGarminUrl | null {
  try {
    const urlObj = new URL(url);

    if (urlObj.hostname === "livetrack.garmin.com") {
      // Long format: https://livetrack.garmin.com/session/{sessionId}/token/{token}
      const pathParts = urlObj.pathname.split("/");
      const sessionIndex = pathParts.indexOf("session");
      const tokenIndex = pathParts.indexOf("token");

      if (
        sessionIndex !== -1 &&
        tokenIndex !== -1 &&
        sessionIndex + 1 < pathParts.length &&
        tokenIndex + 1 < pathParts.length
      ) {
        return {
          sessionId: pathParts[sessionIndex + 1],
          token: pathParts[tokenIndex + 1],
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Expand a short Garmin URL (gar.mn) to get the full URL
 */
export async function expandGarminUrl(
  shortUrl: string
): Promise<string | null> {
  try {
    const response = await fetch("/api/expand-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: shortUrl }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.expandedUrl || null;
  } catch {
    return null;
  }
}

/**
 * Parse any Garmin URL (short or long format)
 */
export async function parseAnyGarminUrl(
  url: string
): Promise<ParsedGarminUrl | null> {
  // Try parsing as long format first
  const parsed = parseGarminUrl(url);
  if (parsed) return parsed;

  // If it's a short URL, expand it first
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === "gar.mn" || urlObj.hostname === "www.gar.mn") {
      const expandedUrl = await expandGarminUrl(url);
      if (expandedUrl) {
        return parseGarminUrl(expandedUrl);
      }
    }
  } catch {
    // Invalid URL
  }

  return null;
}

/**
 * Fetch Garmin tracking data using GraphQL API
 */
export async function fetchGarminTrackingData(
  sessionId: string,
  token: string,
  begin?: string
): Promise<GarminTrackingData | null> {
  try {
    const response = await fetch("/api/garmin-fetch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, token, begin }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.success ? data.data : null;
  } catch {
    return null;
  }
}
