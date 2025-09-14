import type {
    TrackingProvider,
    UnifiedCoordinate,
    UnifiedTrackingData,
} from "../types";

/**
 * Garmin-specific data types
 */
interface GarminSessionData {
    sessionId: string;
    token: string;
}

interface GarminTrackPoint {
    position: {
        lat: number;
        lon: number;
    };
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

interface GarminCoordinate {
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

interface GarminProfile {
    name: string;
    location: string;
    sessionName?: string;
    activityType?: string;
}

interface GarminCoursePoint {
    position: {
        lat: number;
        lon: number;
    };
}

interface GarminTrackingData {
    sessionId: string;
    token: string;
    coordinates: GarminCoordinate[];
    coursePoints?: GarminCoursePoint[];
    profile: GarminProfile;
    lastUpdate: string;
}

/**
 * Fetch single Garmin athlete data
 */
async function fetchSingleGarminAthlete(
    sessionId: string,
    token: string,
    begin?: string,
): Promise<GarminTrackingData> {
    // Fetch session information using GraphQL
    const sessionResponse = await fetch(
        "https://livetrack.garmin.com/apollo/graphql",
        {
            method: "POST",
            headers: {
                accept: "*/*",
                "content-type": "application/json",
                origin: "https://livetrack.garmin.com",
                referer:
                    `https://livetrack.garmin.com/session/${sessionId}/token/${token}`,
                "user-agent":
                    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
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
        },
    );

    if (!sessionResponse.ok) {
        throw new Error(`Session fetch failed: ${sessionResponse.statusText}`);
    }

    const sessionData = await sessionResponse.json();
    if (sessionData.errors || !sessionData.data?.sessionById) {
        throw new Error("Session not found or invalid");
    }

    const session = sessionData.data.sessionById;

    // Fetch tracking data using GraphQL
    const trackingResponse = await fetch(
        "https://livetrack.garmin.com/apollo/graphql",
        {
            method: "POST",
            headers: {
                accept: "*/*",
                "content-type": "application/json",
                origin: "https://livetrack.garmin.com",
                referer:
                    `https://livetrack.garmin.com/session/${sessionId}/token/${token}`,
                "user-agent":
                    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
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
                                totalDurationSecs
                                activityType
                                heartRateBeatsPerMin
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
                variables: {
                    sessionId,
                    token,
                    begin: begin || "0",
                    disablePolling: true,
                },
                operationName: "getTrackPoints",
            }),
        },
    );

    if (!trackingResponse.ok) {
        throw new Error(
            `Tracking fetch failed: ${trackingResponse.statusText}`,
        );
    }

    const trackingData = await trackingResponse.json();
    if (trackingData.errors || !trackingData.data?.trackPointsBySessionId) {
        throw new Error("Tracking data not found");
    }

    const trackPoints = trackingData.data.trackPointsBySessionId.trackPoints ||
        [];

    // Fetch course data (planned route) using GraphQL
    const courseResponse = await fetch(
        "https://livetrack.garmin.com/apollo/graphql",
        {
            method: "POST",
            headers: {
                accept: "*/*",
                "content-type": "application/json",
                origin: "https://livetrack.garmin.com",
                referer:
                    `https://livetrack.garmin.com/session/${sessionId}/token/${token}`,
                "user-agent":
                    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
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
        },
    );

    let coursePoints: GarminCoursePoint[] = [];
    if (courseResponse.ok) {
        const courseData = await courseResponse.json();
        coursePoints =
            courseData?.data?.courseBySessionId?.courses?.[0]?.coursePoints ||
            [];
    }

    // Convert to our coordinate format
    const coordinates: GarminCoordinate[] = trackPoints.map((
        point: GarminTrackPoint,
    ) => ({
        position: {
            lat: point.position.lat,
            lon: point.position.lon,
        },
        timestamp: point.dateTime,
        altitude: point.altitude,
        speed: point.speed,
        fitnessData: point.fitnessPointData
            ? {
                heartRateBeatsPerMin:
                    point.fitnessPointData.heartRateBeatsPerMin,
                powerWatts: point.fitnessPointData.powerWatts,
                cadenceCyclesPerMin: point.fitnessPointData.cadenceCyclesPerMin,
                totalDistanceMeters: point.fitnessPointData.totalDistanceMeters,
                activityType: point.fitnessPointData.activityType,
            }
            : undefined,
    }));

    const profile: GarminProfile = {
        name: session.userDisplayName || session.publisher?.nickname ||
            "Unknown",
        location: session.activity?.name || session.sessionName || "Activity",
        sessionName: session.sessionName,
        activityType: trackPoints[0]?.fitnessPointData?.activityType,
    };

    return {
        sessionId,
        token,
        coordinates,
        coursePoints,
        profile,
        lastUpdate: coordinates.length > 0
            ? coordinates[coordinates.length - 1].timestamp
            : new Date().toISOString(),
    };
}

/**
 * Fetch single Garmin athlete updates (coordinates only)
 */
async function fetchSingleGarminAthleteUpdates(
    sessionId: string,
    token: string,
    begin: Date,
): Promise<GarminCoordinate[]> {
    // Fetch tracking updates using GraphQL (same as main fetch but coordinates only)
    const trackingResponse = await fetch(
        "https://livetrack.garmin.com/apollo/graphql",
        {
            method: "POST",
            headers: {
                accept: "*/*",
                "content-type": "application/json",
                origin: "https://livetrack.garmin.com",
                referer:
                    `https://livetrack.garmin.com/session/${sessionId}/token/${token}`,
                "user-agent":
                    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
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
                                totalDurationSecs
                                activityType
                                heartRateBeatsPerMin
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
                variables: {
                    sessionId,
                    token,
                    begin: begin.toISOString(),
                    disablePolling: true,
                },
                operationName: "getTrackPoints",
            }),
        },
    );

    try {
        if (!trackingResponse.ok) {
            return [];
        }

        const trackingData = await trackingResponse.json();
        if (trackingData.errors || !trackingData.data?.trackPointsBySessionId) {
            return [];
        }

        const trackPoints =
            trackingData.data.trackPointsBySessionId.trackPoints || [];

        // Convert to our coordinate format (only coordinates, no profile/course data)
        const coordinates: GarminCoordinate[] = trackPoints.map((
            point: GarminTrackPoint,
        ) => ({
            position: {
                lat: point.position.lat,
                lon: point.position.lon,
            },
            timestamp: point.dateTime,
            altitude: point.altitude,
            speed: point.speed,
            fitnessData: point.fitnessPointData
                ? {
                    heartRateBeatsPerMin:
                        point.fitnessPointData.heartRateBeatsPerMin,
                    powerWatts: point.fitnessPointData.powerWatts,
                    cadenceCyclesPerMin:
                        point.fitnessPointData.cadenceCyclesPerMin,
                    totalDistanceMeters:
                        point.fitnessPointData.totalDistanceMeters,
                    activityType: point.fitnessPointData.activityType,
                }
                : undefined,
        }));

        return coordinates;
    } catch {
        return [];
    }
}

/**
 * Calculate stats from Garmin coordinate data
 */
function calculateGarminStats(coordinates: GarminCoordinate[]) {
    if (coordinates.length === 0) {
        return {
            distance: 0,
            movingTime: 0,
            elapsedTime: 0,
            averageSpeed: 0,
        };
    }

    const latest = coordinates[coordinates.length - 1];
    const distance = latest.fitnessData?.totalDistanceMeters || 0;

    // Calculate elapsed time from first to last coordinate
    const startTime = new Date(coordinates[0].timestamp).getTime();
    const endTime = new Date(latest.timestamp).getTime();
    const elapsedTime = Math.max(0, Math.floor((endTime - startTime) / 1000));

    // For Garmin, we don't have separate moving time, so use elapsed time
    const movingTime = elapsedTime;

    // Calculate average speed
    const averageSpeed = movingTime > 0 ? distance / movingTime : 0;

    return {
        distance,
        movingTime,
        elapsedTime,
        averageSpeed,
    };
}

/**
 * Convert Garmin data to unified format
 */
function convertGarminToUnified(
    garminData: GarminTrackingData,
): UnifiedTrackingData {
    const coordinates: UnifiedCoordinate[] = garminData.coordinates.map(
        (coord) => ({
            lat: coord.position.lat,
            lon: coord.position.lon,
            timestamp: coord.timestamp,
            altitude: coord.altitude,
            speed: coord.speed,
        }),
    );

    const stats = calculateGarminStats(garminData.coordinates);
    const activityType = garminData.coordinates.length > 0
        ? garminData.coordinates[garminData.coordinates.length - 1].fitnessData
            ?.activityType || "Unknown"
        : "Unknown";

    return {
        id: `https://livetrack.garmin.com/session/${garminData.sessionId}/token/${garminData.token}`,
        identifier: {
            type: "garmin",
            data: {
                sessionId: garminData.sessionId,
                token: garminData.token,
            },
        },
        athleteName: garminData.profile.name,
        activityType: activityType,
        coordinates,
        stats: {
            distance: stats.distance,
            movingTime: stats.movingTime,
            elapsedTime: stats.elapsedTime,
            averageSpeed: stats.averageSpeed,
        },
        lastUpdate: garminData.lastUpdate,
    };
}

/**
 * Garmin tracking provider implementation
 */
export const garminProvider: TrackingProvider = {
    parseUrl(url: string): GarminSessionData | null {
        try {
            const urlObj = new URL(url);
            const expandedUrlMatch = urlObj.href.match(
                /livetrack\.garmin\.com\/session\/([^\/]+)\/token\/([^\/?\s]+)/,
            );
            if (expandedUrlMatch) {
                return {
                    sessionId: expandedUrlMatch[1],
                    token: expandedUrlMatch[2],
                };
            }
            return null;
        } catch {
            return null;
        }
    },

    isValidUrl(url: string): boolean {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname === "livetrack.garmin.com" ||
                urlObj.hostname === "gar.mn";
        } catch {
            return false;
        }
    },

    async fetchTrackingData(
        identifiers: GarminSessionData[],
        begin?: string,
    ): Promise<UnifiedTrackingData[]> {
        const results = await Promise.allSettled(
            identifiers.map(({ sessionId, token }) =>
                fetchSingleGarminAthlete(sessionId, token, begin)
            ),
        );

        return results
            .filter((
                result,
            ): result is PromiseFulfilledResult<GarminTrackingData> =>
                result.status === "fulfilled"
            )
            .map((result) => convertGarminToUnified(result.value));
    },

    async fetchTrackingUpdates(
        identifiers: GarminSessionData[],
        begin: Date,
    ): Promise<{ id: string; coordinates: UnifiedCoordinate[] }[]> {
        const results = await Promise.allSettled(
            identifiers.map(({ sessionId, token }) =>
                fetchSingleGarminAthleteUpdates(sessionId, token, begin)
            ),
        );

        return results
            .filter((
                result,
            ): result is PromiseFulfilledResult<GarminCoordinate[]> =>
                result.status === "fulfilled"
            )
            .map((result, index) => ({
                id: `https://livetrack.garmin.com/session/${
                    identifiers[index].sessionId
                }/token/${identifiers[index].token}`,
                coordinates: result.value.map((coord) => ({
                    lat: coord.position.lat,
                    lon: coord.position.lon,
                    timestamp: coord.timestamp,
                    altitude: coord.altitude,
                    speed: coord.speed,
                })),
            }));
    },
};
