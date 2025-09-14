import type { TrackingProvider, UnifiedTrackingData, UnifiedCoordinate } from '../types';

/**
 * Garmin-specific data types
 */
interface GarminSessionData {
    sessionId: string;
    token: string;
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
async function fetchSingleGarminAthlete(sessionId: string, token: string, begin?: string): Promise<GarminTrackingData> {
    const baseUrl = "https://livetrack.garmin.com/services/trackLog";
    
    const params = new URLSearchParams({
        sessionId,
        token,
        begin: begin || "0"
    });

    const response = await fetch(`${baseUrl}?${params}`, {
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Origin': 'https://livetrack.garmin.com',
            'Referer': `https://livetrack.garmin.com/session/${sessionId}/token/${token}`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch Garmin data: ${response.status}`);
    }

    const data = await response.json();
    
    return {
        sessionId,
        token,
        coordinates: data.trackPoints || [],
        coursePoints: data.coursePoints || [],
        profile: data.profile || { name: 'Unknown Athlete', location: '' },
        lastUpdate: new Date().toISOString()
    };
}

/**
 * Fetch single Garmin athlete updates (coordinates only)
 */
async function fetchSingleGarminAthleteUpdates(sessionId: string, token: string, begin: string): Promise<GarminCoordinate[]> {
    const baseUrl = "https://livetrack.garmin.com/services/trackLog";
    
    const params = new URLSearchParams({
        sessionId,
        token,
        begin
    });

    try {
        const response = await fetch(`${baseUrl}?${params}`, {
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Origin': 'https://livetrack.garmin.com',
                'Referer': `https://livetrack.garmin.com/session/${sessionId}/token/${token}`,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.ok) {
            return [];
        }

        const data = await response.json();
        return data.trackPoints || [];
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
            averageSpeed: 0
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
        averageSpeed
    };
}

/**
 * Convert Garmin data to unified format
 */
function convertGarminToUnified(garminData: GarminTrackingData): UnifiedTrackingData {
    const coordinates: UnifiedCoordinate[] = garminData.coordinates.map(coord => ({
        lat: coord.position.lat,
        lon: coord.position.lon,
        timestamp: coord.timestamp,
        altitude: coord.altitude,
        speed: coord.speed
    }));

    const stats = calculateGarminStats(garminData.coordinates);
    const activityType = garminData.coordinates.length > 0 
        ? garminData.coordinates[garminData.coordinates.length - 1].fitnessData?.activityType || 'Unknown'
        : 'Unknown';

    return {
        id: `https://livetrack.garmin.com/session/${garminData.sessionId}/token/${garminData.token}`,
        identifier: {
            type: 'garmin',
            data: { 
                sessionId: garminData.sessionId, 
                token: garminData.token 
            }
        },
        athleteName: garminData.profile.name,
        activityType: activityType,
        coordinates,
        stats: {
            distance: stats.distance,
            movingTime: stats.movingTime,
            elapsedTime: stats.elapsedTime,
            averageSpeed: stats.averageSpeed
        },
        lastUpdate: garminData.lastUpdate
    };
}

/**
 * Garmin tracking provider implementation
 */
export const garminProvider: TrackingProvider = {
    parseUrl(url: string): GarminSessionData | null {
        try {
            const urlObj = new URL(url);
            const expandedUrlMatch = urlObj.href.match(/livetrack\.garmin\.com\/session\/([^\/]+)\/token\/([^\/?\s]+)/);
            if (expandedUrlMatch) {
                return {
                    sessionId: expandedUrlMatch[1],
                    token: expandedUrlMatch[2]
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

    async fetchTrackingData(identifiers: GarminSessionData[], begin?: string): Promise<UnifiedTrackingData[]> {
        const results = await Promise.allSettled(
            identifiers.map(({ sessionId, token }) => fetchSingleGarminAthlete(sessionId, token, begin))
        );

        return results
            .filter((result): result is PromiseFulfilledResult<GarminTrackingData> => result.status === 'fulfilled')
            .map(result => convertGarminToUnified(result.value));
    },

    async fetchTrackingUpdates(identifiers: GarminSessionData[], begin: string): Promise<{ id: string; coordinates: UnifiedCoordinate[] }[]> {
        const results = await Promise.allSettled(
            identifiers.map(({ sessionId, token }) => fetchSingleGarminAthleteUpdates(sessionId, token, begin))
        );

        return results
            .filter((result): result is PromiseFulfilledResult<GarminCoordinate[]> => result.status === 'fulfilled')
            .map((result, index) => ({
                id: `https://livetrack.garmin.com/session/${identifiers[index].sessionId}/token/${identifiers[index].token}`,
                coordinates: result.value.map(coord => ({
                    lat: coord.position.lat,
                    lon: coord.position.lon,
                    timestamp: coord.timestamp,
                    altitude: coord.altitude,
                    speed: coord.speed
                }))
            }));
    }
};
