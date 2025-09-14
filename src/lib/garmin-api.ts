// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

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

// Response types for API calls
interface UrlExpandResult {
    originalUrl: string;
    success: boolean;
    expandedUrl?: string;
}

interface AthleteDataResult {
    sessionId: string;
    success: boolean;
    data?: GarminTrackingData;
    error?: string;
}

interface AthleteUpdateResult {
    sessionId: string;
    success: boolean;
    coordinates?: GarminCoordinate[];
    error?: string;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create error map for URL expansion
 */
function createErrorMap(urls: string[], value: string | null): Map<string, string | null> {
    const result = new Map<string, string | null>();
    urls.forEach((url) => result.set(url, value));
    return result;
}

/**
 * Create error map for athlete data
 */
function createAthleteErrorMap(athletes: Array<{ sessionId: string }>): Map<string, GarminTrackingData | null> {
    const result = new Map<string, GarminTrackingData | null>();
    athletes.forEach((athlete) => result.set(athlete.sessionId, null));
    return result;
}

/**
 * Create error map for coordinate updates
 */
function createUpdateErrorMap(athletes: Array<{ sessionId: string }>): Map<string, GarminCoordinate[]> {
    const result = new Map<string, GarminCoordinate[]>();
    athletes.forEach((athlete) => result.set(athlete.sessionId, []));
    return result;
}

// =============================================================================
// URL VALIDATION AND PARSING
// =============================================================================

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

// =============================================================================
// CLIENT-SIDE API FUNCTIONS (called from frontend)
// =============================================================================

/**
 * Batch expand multiple URLs (calls API route)
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

        if (!response.ok) {
            return createErrorMap(urls, null);
        }

        const data = await response.json();
        const result = new Map<string, string | null>();

        if (data.success && data.results) {
            data.results.forEach((urlResult: UrlExpandResult) => {
                result.set(
                    urlResult.originalUrl,
                    urlResult.success ? urlResult.expandedUrl || null : null,
                );
            });
        }

        return result;
    } catch {
        return createErrorMap(urls, null);
    }
}

/**
 * Batch fetch Garmin tracking data for multiple athletes (calls API route)
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
            return createAthleteErrorMap(athletes);
        }

        const data = await response.json();
        const result = new Map<string, GarminTrackingData | null>();

        if (data.success && data.results) {
            data.results.forEach((athleteResult: AthleteDataResult) => {
                result.set(
                    athleteResult.sessionId,
                    athleteResult.success ? athleteResult.data || null : null,
                );
            });
        }

        return result;
    } catch {
        return createAthleteErrorMap(athletes);
    }
}

/**
 * Batch fetch only new tracking coordinates for multiple athletes (calls API route)
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
            return createUpdateErrorMap(athletes);
        }

        const data = await response.json();
        const result = new Map<string, GarminCoordinate[]>();

        if (data.success && data.results) {
            data.results.forEach((athleteResult: AthleteUpdateResult) => {
                result.set(
                    athleteResult.sessionId,
                    athleteResult.success ? athleteResult.coordinates || [] : [],
                );
            });
        }

        return result;
    } catch {
        return createUpdateErrorMap(athletes);
    }
}

// =============================================================================
// SERVER-SIDE FUNCTIONS (used in API routes)
// =============================================================================

/**
 * Raw track point structure from Garmin API
 */
export interface RawGarminTrackPoint {
    position: { lat: number; lon: number };
    dateTime: string;
    altitude?: number;
    speed?: number;
    fitnessPointData?: {
        heartRateBeatsPerMin?: number;
        powerWatts?: number;
        cadenceCyclesPerMin?: number;
        totalDistanceMeters?: number;
        activityType?: string;
    };
}

/**
 * Convert raw Garmin track point to our coordinate format
 */
export function convertGarminTrackPoint(point: RawGarminTrackPoint): GarminCoordinate {
    return {
        position: {
            lat: point.position.lat,
            lon: point.position.lon,
        },
        timestamp: point.dateTime,
        altitude: point.altitude,
        speed: point.speed,
        fitnessData: point.fitnessPointData
            ? {
                heartRateBeatsPerMin: point.fitnessPointData.heartRateBeatsPerMin,
                powerWatts: point.fitnessPointData.powerWatts,
                cadenceCyclesPerMin: point.fitnessPointData.cadenceCyclesPerMin,
                totalDistanceMeters: point.fitnessPointData.totalDistanceMeters,
                activityType: point.fitnessPointData.activityType,
            }
            : undefined,
    };
}

/**
 * Low-level function to fetch session info from Garmin GraphQL API
 */
export async function fetchGarminSession(sessionId: string, token: string) {
    const response = await fetch("https://livetrack.garmin.com/apollo/graphql", {
        method: "POST",
        headers: {
            accept: "*/*",
            "content-type": "application/json",
            origin: "https://livetrack.garmin.com",
            referer: `https://livetrack.garmin.com/session/${sessionId}/token/${token}`,
            "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
        body: JSON.stringify({
            query: `
                query getSession($sessionId: String!, $token: String!) {
                    sessionById(sessionId: $sessionId, token: $token) {
                        sessionId
                        sessionToken
                        userDisplayName
                        sessionName
                        activity {
                            name
                        }
                        publisher {
                            nickname
                        }
                    }
                }
            `,
            variables: { sessionId, token },
            operationName: "getSession",
        }),
    });

    if (!response.ok) {
        throw new Error(`Session fetch failed: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.errors || !data.data?.sessionById) {
        throw new Error("Session not found or invalid");
    }

    return data.data.sessionById;
}

/**
 * Low-level function to fetch tracking points from Garmin GraphQL API
 */
export async function fetchGarminTrackingPoints(sessionId: string, token: string, begin?: string): Promise<RawGarminTrackPoint[]> {
    const response = await fetch("https://livetrack.garmin.com/apollo/graphql", {
        method: "POST",
        headers: {
            accept: "*/*",
            "content-type": "application/json",
            origin: "https://livetrack.garmin.com",
            referer: `https://livetrack.garmin.com/session/${sessionId}/token/${token}`,
            "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
        body: JSON.stringify({
            query: `
                query getTrackPoints(
                    $sessionId: String!
                    $token: String!
                    $begin: String
                    $disablePolling: Boolean
                ) {
                    trackPointsBySessionId(
                        sessionId: $sessionId
                        token: $token
                        begin: $begin
                        limit: 3000
                        disablePolling: $disablePolling
                    ) {
                        trackPoints {
                            fitnessPointData {
                                totalDistanceMeters
                                activityType
                                heartRateBeatsPerMin
                                powerWatts
                                cadenceCyclesPerMin
                            }
                            position {
                                lat
                                lon
                            }
                            dateTime
                            speed
                            altitude
                        }
                        sessionId
                    }
                }
            `,
            variables: { sessionId, token, begin, disablePolling: true },
            operationName: "getTrackPoints",
        }),
    });

    if (!response.ok) {
        throw new Error(`Tracking fetch failed: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.errors) {
        throw new Error("Tracking data not available");
    }

    return data.data?.trackPointsBySessionId?.trackPoints || [];
}

/**
 * Low-level function to fetch course data from Garmin GraphQL API
 */
export async function fetchGarminCourseData(sessionId: string, token: string): Promise<GarminCoursePoint[]> {
    try {
        const response = await fetch("https://livetrack.garmin.com/apollo/graphql", {
            method: "POST",
            headers: {
                accept: "*/*",
                "content-type": "application/json",
                origin: "https://livetrack.garmin.com",
                referer: `https://livetrack.garmin.com/session/${sessionId}/token/${token}`,
                "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            },
            body: JSON.stringify({
                query: `
                    query getCourseData($sessionId: String!, $token: String!, $disablePolling: Boolean) {
                        courseBySessionId(sessionId: $sessionId, token: $token, disablePolling: $disablePolling) {
                            courses {
                                coursePoints {
                                    position {
                                        lat
                                        lon
                                    }
                                }
                            }
                        }
                    }
                `,
                variables: { sessionId, token, disablePolling: true },
                operationName: "getCourseData",
            }),
        });

        if (!response.ok) {
            return [];
        }

        const data = await response.json();
        return data?.data?.courseBySessionId?.courses?.[0]?.coursePoints || [];
    } catch {
        return [];
    }
}

/**
 * Fetch complete Garmin tracking data for a single athlete
 */
export async function fetchSingleGarminAthlete(
    sessionId: string,
    token: string,
    begin?: string
): Promise<GarminTrackingData> {
    // Fetch session info
    const session = await fetchGarminSession(sessionId, token);
    
    // Fetch tracking points
    const trackPoints = await fetchGarminTrackingPoints(sessionId, token, begin);
    
    // Fetch course data (planned route)
    const coursePoints = await fetchGarminCourseData(sessionId, token);

    // Convert to our coordinate format
    const coordinates: GarminCoordinate[] = trackPoints.map(convertGarminTrackPoint);

    const profile: GarminProfile = {
        name: session.userDisplayName || session.publisher?.nickname || "Unknown",
        location: session.sessionName || "",
        sessionName: session.sessionName || "",
        activityType: trackPoints[0]?.fitnessPointData?.activityType,
    };

    return {
        sessionId,
        token,
        coordinates,
        coursePoints,
        profile,
        lastUpdate: new Date().toISOString(),
    };
}

/**
 * Fetch only new coordinates for a single athlete (lean update)
 */
export async function fetchSingleGarminAthleteUpdates(
    sessionId: string,
    token: string,
    begin: string
): Promise<GarminCoordinate[]> {
    const trackPoints = await fetchGarminTrackingPoints(sessionId, token, begin);
    return trackPoints.map(convertGarminTrackPoint);
}
