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

/**
 * Raw track point shape returned by Garmin's REST track-points endpoint.
 * Fitness fields (totalDistanceMeters, activityType, etc.) are only present
 * once the underlying activity has actually started - earlier "STATIONARY"
 * points omit them.
 */
interface GarminRestTrackPoint {
    dateTime: string;
    position: {
        lat: number;
        lon: number;
    };
    altitude?: number;
    speed?: number;
    heartRateBeatsPerMin?: number;
    cadenceCyclesPerMin?: number;
    powerWatts?: number;
    totalDistanceMeters?: number;
    activityType?: string;
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

const USER_AGENT =
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";

/**
 * Garmin retired the old apollo/graphql API at some point and now serves
 * LiveTrack data through plain REST endpoints under livetrack.garmin.com/api.
 * Those endpoints are still protected by a synchronizer-token CSRF check:
 * loading the session's HTML page returns both an HttpOnly `livetrack_csrf`
 * cookie and a matching `<meta name="csrf-token">` value, and every API call
 * must send the cookie back plus the token in a `livetrack-csrf-token`
 * header. This was reverse-engineered by inspecting the network traffic of
 * the real LiveTrack web app (garmin.com's own frontend does exactly this).
 */
interface GarminAuth {
    cookie: string;
    csrfToken: string;
    expiresAt: number;
}

const AUTH_TTL_MS = 5 * 60 * 1000;
const authCache = new Map<string, GarminAuth>();

async function fetchGarminAuth(
    sessionId: string,
    token: string,
): Promise<GarminAuth> {
    const response = await fetch(
        `https://livetrack.garmin.com/session/${sessionId}/token/${token}`,
        { headers: { "user-agent": USER_AGENT } },
    );

    if (!response.ok) {
        throw new Error(
            `Failed to load LiveTrack session page: ${response.status}`,
        );
    }

    const cookie = response.headers.getSetCookie()
        .map((entry) => entry.split(";")[0])
        .join("; ");

    const html = await response.text();
    const csrfMatch = html.match(/<meta name="csrf-token" content="([^"]+)"/);

    if (!cookie || !csrfMatch) {
        throw new Error(
            "Could not extract LiveTrack CSRF auth from session page",
        );
    }

    return { cookie, csrfToken: csrfMatch[1], expiresAt: Date.now() + AUTH_TTL_MS };
}

async function getGarminAuth(
    sessionId: string,
    token: string,
): Promise<GarminAuth> {
    const cacheKey = `${sessionId}:${token}`;
    const cached = authCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
        return cached;
    }

    const auth = await fetchGarminAuth(sessionId, token);
    authCache.set(cacheKey, auth);
    return auth;
}

function garminApiFetch(url: string, auth: GarminAuth): Promise<Response> {
    return fetch(url, {
        headers: {
            cookie: auth.cookie,
            "livetrack-csrf-token": auth.csrfToken,
            "user-agent": USER_AGENT,
        },
    });
}

function garminTrackPointsUrl(
    sessionId: string,
    token: string,
    begin?: string,
): string {
    const params = new URLSearchParams({
        token,
        begin: begin || "1970-01-01T00:00:00.000Z",
    });
    return `https://livetrack.garmin.com/api/sessions/${sessionId}/track-points/common?${params.toString()}`;
}

function toGarminCoordinate(point: GarminRestTrackPoint): GarminCoordinate {
    return {
        position: {
            lat: point.position.lat,
            lon: point.position.lon,
        },
        timestamp: point.dateTime,
        altitude: point.altitude,
        speed: point.speed,
        fitnessData: point.totalDistanceMeters !== undefined
            ? {
                heartRateBeatsPerMin: point.heartRateBeatsPerMin,
                powerWatts: point.powerWatts,
                cadenceCyclesPerMin: point.cadenceCyclesPerMin,
                totalDistanceMeters: point.totalDistanceMeters,
                activityType: point.activityType,
            }
            : undefined,
    };
}

interface GarminSessionInfoResponse {
    userDisplayName?: string;
    sessionName?: string;
    publisher?: { nickname?: string };
}

/**
 * Fetch single Garmin athlete data
 */
async function fetchSingleGarminAthlete(
    sessionId: string,
    token: string,
    begin?: string,
): Promise<GarminTrackingData> {
    let auth = await getGarminAuth(sessionId, token);

    const runFetches = () =>
        Promise.all([
            garminApiFetch(
                `https://livetrack.garmin.com/api/v2/sessions/${sessionId}?token=${token}`,
                auth,
            ),
            garminApiFetch(garminTrackPointsUrl(sessionId, token, begin), auth),
            garminApiFetch(
                `https://livetrack.garmin.com/api/v1/sessions/${sessionId}/courses?token=${token}`,
                auth,
            ),
        ]);

    let [sessionResponse, trackingResponse, coursesResponse] =
        await runFetches();

    if (sessionResponse.status === 403 || trackingResponse.status === 403) {
        // CSRF cookie/token likely expired - refresh once and retry.
        authCache.delete(`${sessionId}:${token}`);
        auth = await getGarminAuth(sessionId, token);
        [sessionResponse, trackingResponse, coursesResponse] =
            await runFetches();
    }

    if (!sessionResponse.ok) {
        throw new Error(`Session fetch failed: ${sessionResponse.status}`);
    }
    if (!trackingResponse.ok) {
        throw new Error(`Tracking fetch failed: ${trackingResponse.status}`);
    }

    const session: GarminSessionInfoResponse = await sessionResponse.json();
    const trackingData: { trackPoints?: GarminRestTrackPoint[] } =
        await trackingResponse.json();
    const trackPoints = trackingData.trackPoints || [];

    let coursePoints: GarminCoursePoint[] = [];
    if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json();
        coursePoints = coursesData?.courses?.[0]?.coursePoints || [];
    }

    const coordinates: GarminCoordinate[] = trackPoints.map(
        toGarminCoordinate,
    );

    const profile: GarminProfile = {
        name: session.userDisplayName?.trim() || session.publisher?.nickname ||
            "Unknown",
        location: session.sessionName || "Activity",
        sessionName: session.sessionName,
        activityType: trackPoints[trackPoints.length - 1]?.activityType,
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
    try {
        let auth = await getGarminAuth(sessionId, token);
        const url = garminTrackPointsUrl(sessionId, token, begin.toISOString());
        let response = await garminApiFetch(url, auth);

        if (response.status === 403) {
            authCache.delete(`${sessionId}:${token}`);
            auth = await getGarminAuth(sessionId, token);
            response = await garminApiFetch(url, auth);
        }

        if (!response.ok) {
            return [];
        }

        const data: { trackPoints?: GarminRestTrackPoint[] } = await response
            .json();
        return (data.trackPoints || []).map(toGarminCoordinate);
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
