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
 * Batch expand multiple URLs
 */
export async function expandGarminUrlsBatch(
    urls: string[],
): Promise<Map<string, string | null>> {
    try {
        const response = await fetch("/api/expand-url-batch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ urls }),
        });

        const result = new Map<string, string | null>();

        if (!response.ok) {
            // Return map with all null values
            urls.forEach((url) => result.set(url, null));
            return result;
        }

        const data = await response.json();

        if (data.success && data.results) {
            data.results.forEach(
                (
                    urlResult: {
                        originalUrl: string;
                        success: boolean;
                        expandedUrl?: string;
                    },
                ) => {
                    result.set(
                        urlResult.originalUrl,
                        urlResult.success
                            ? urlResult.expandedUrl || null
                            : null,
                    );
                },
            );
        }

        return result;
    } catch {
        // Return map with all null values on error
        const result = new Map<string, string | null>();
        urls.forEach((url) => result.set(url, null));
        return result;
    }
}

/**
 * Batch fetch Garmin tracking data for multiple athletes
 */
export async function fetchGarminTrackingDataBatch(
    athletes: Array<{ sessionId: string; token: string; begin?: string }>,
): Promise<Map<string, GarminTrackingData | null>> {
    try {
        const response = await fetch("/api/garmin-fetch-batch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ athletes }),
        });

        if (!response.ok) {
            // Return map with all null values
            const result = new Map<string, GarminTrackingData | null>();
            athletes.forEach((athlete) => result.set(athlete.sessionId, null));
            return result;
        }

        const data = await response.json();
        const result = new Map<string, GarminTrackingData | null>();

        if (data.success && data.results) {
            data.results.forEach(
                (
                    athleteResult: {
                        sessionId: string;
                        success: boolean;
                        data?: GarminTrackingData;
                        error?: string;
                    },
                ) => {
                    result.set(
                        athleteResult.sessionId,
                        athleteResult.success
                            ? athleteResult.data || null
                            : null,
                    );
                },
            );
        }

        return result;
    } catch {
        // Return map with all null values on error
        const result = new Map<string, GarminTrackingData | null>();
        athletes.forEach((athlete) => result.set(athlete.sessionId, null));
        return result;
    }
}

/**
 * Batch fetch only new tracking coordinates for multiple athletes (lean updates)
 */
export async function fetchGarminTrackingUpdatesBatch(
    athletes: Array<{ sessionId: string; token: string; begin: string }>,
): Promise<Map<string, GarminCoordinate[]>> {
    try {
        const response = await fetch("/api/garmin-fetch-updates-batch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ athletes }),
        });

        if (!response.ok) {
            // Return map with all empty arrays
            const result = new Map<string, GarminCoordinate[]>();
            athletes.forEach((athlete) => result.set(athlete.sessionId, []));
            return result;
        }

        const data = await response.json();
        const result = new Map<string, GarminCoordinate[]>();

        if (data.success && data.results) {
            data.results.forEach(
                (
                    athleteResult: {
                        sessionId: string;
                        success: boolean;
                        coordinates?: GarminCoordinate[];
                        error?: string;
                    },
                ) => {
                    result.set(
                        athleteResult.sessionId,
                        athleteResult.success
                            ? athleteResult.coordinates || []
                            : [],
                    );
                },
            );
        }

        return result;
    } catch {
        // Return map with all empty arrays on error
        const result = new Map<string, GarminCoordinate[]>();
        athletes.forEach((athlete) => result.set(athlete.sessionId, []));
        return result;
    }
}
