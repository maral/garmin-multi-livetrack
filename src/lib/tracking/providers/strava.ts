import type { TrackingProvider, UnifiedTrackingData, UnifiedCoordinate } from '../types';

/**
 * Strava-specific data types
 */
interface StravaBeaconData {
    beaconId: string;
}

interface StravaCoordinate {
    position: {
        lat: number;
        lon: number;
    };
    timestamp: string;
}

interface StravaProfile {
    name: string;
    sessionName?: string;
    activityType?: string;
}

interface StravaTrackingData {
    beaconId: string;
    coordinates: StravaCoordinate[];
    profile: StravaProfile;
    lastUpdate: string;
    stats: {
        distance: number;
        moving_time: number;
        elapsed_time: number;
        averageSpeed?: number;
    };
    battery_level?: number;
    status: number;
    activity_type: number;
}

/**
 * Strava activity type mapping (based on official Strava Go SDK)
 */
function getStravaActivityTypeName(activityType: number): string {
    const activityTypes: { [key: number]: string } = {
        1: 'Ride',
        2: 'Alpine Ski',
        3: 'Backcountry Ski', 
        4: 'Hike',
        5: 'Ice Skate',
        6: 'Inline Skate',
        7: 'Nordic Ski',
        8: 'Roller Ski',
        9: 'Run',
        10: 'Walk',
        11: 'Workout',
        12: 'Snowboard',
        13: 'Snowshoe',
        14: 'Kitesurf',
        15: 'Windsurf',
        16: 'Swim',
        17: 'Virtual Ride',
        18: 'E-Bike Ride',
        19: 'Water Sport',
        20: 'Canoeing',
        21: 'Kayaking',
        22: 'Rowing',
        23: 'Stand Up Paddling',
        24: 'Surfing',
        25: 'Crossfit',
        26: 'Elliptical',
        27: 'Rock Climbing',
        28: 'Stair Stepper',
        29: 'Weight Training',
        30: 'Yoga'
    };
    
    return activityTypes[activityType] || 'Activity';
}

/**
 * Fetch single Strava athlete data
 */
async function fetchSingleStravaAthlete(beaconId: string, begin?: string): Promise<StravaTrackingData> {
    const url = `https://www.strava.com/beacon/${beaconId}?minimum_timestamp=${begin ? Math.floor(new Date(begin).getTime() / 1000) : 0}&_=${Date.now()}`;
    
    const response = await fetch(url, {
        headers: {
            'Accept': '*/*',
            'X-Requested-With': 'XMLHttpRequest',
            'Referer': `https://www.strava.com/beacon/${beaconId}`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch Strava beacon data: ${response.status}`);
    }

    const data = await response.json();
    
    const coordinates: StravaCoordinate[] = [];
    const latlngs = data.streams?.latlng || [];
    const timestamps = data.streams?.timestamp || [];
    
    for (let i = 0; i < latlngs.length && i < timestamps.length; i++) {
        coordinates.push({
            position: { lat: latlngs[i][0], lon: latlngs[i][1] },
            timestamp: new Date(timestamps[i] * 1000).toISOString()
        });
    }
    
    // Get athlete name from the beacon HTML page
    let athleteName = 'Unknown Athlete';
    try {
        const pageResponse = await fetch(`https://www.strava.com/beacon/${beaconId}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        if (pageResponse.ok) {
            const pageHtml = await pageResponse.text();
            // Look for athleteName: 'Name' pattern
            const athleteNameMatch = pageHtml.match(/athleteName:\s*'([^']+)'/);
            if (athleteNameMatch && athleteNameMatch[1]) {
                athleteName = athleteNameMatch[1];
            }
        }
    } catch (error) {
        console.warn('Failed to fetch athlete name from HTML page:', error);
    }
    
    // Calculate average speed if not provided
    const distance = data.stats?.distance || 0;
    const movingTime = data.stats?.moving_time || 0;
    const averageSpeed = movingTime > 0 ? distance / movingTime : 0;
    
    return {
        beaconId,
        coordinates,
        profile: {
            name: athleteName,
            activityType: getStravaActivityTypeName(data.activity_type || 0)
        },
        lastUpdate: new Date().toISOString(),
        stats: {
            distance: distance,
            moving_time: movingTime,
            elapsed_time: data.stats?.elapsed_time || 0,
            averageSpeed: averageSpeed
        },
        battery_level: data.battery_level,
        status: data.status || 1,
        activity_type: data.activity_type || 1
    };
}

/**
 * Fetch single Strava athlete updates (coordinates only)
 */
async function fetchSingleStravaAthleteUpdates(beaconId: string, begin: string): Promise<StravaCoordinate[]> {
    const beginTimestamp = Math.floor(new Date(begin).getTime() / 1000);
    const url = `https://www.strava.com/beacon/${beaconId}?minimum_timestamp=${beginTimestamp}&_=${Date.now()}`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'Accept': '*/*',
                'X-Requested-With': 'XMLHttpRequest',
                'Referer': `https://www.strava.com/beacon/${beaconId}`,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.ok) {
            return [];
        }

        const data = await response.json();
        const coordinates: StravaCoordinate[] = [];
        const latlngs = data.streams?.latlng || [];
        const timestamps = data.streams?.timestamp || [];
        
        for (let i = 0; i < latlngs.length && i < timestamps.length; i++) {
            coordinates.push({
                position: { lat: latlngs[i][0], lon: latlngs[i][1] },
                timestamp: new Date(timestamps[i] * 1000).toISOString()
            });
        }
        
        return coordinates;
    } catch {
        return [];
    }
}

/**
 * Convert Strava data to unified format
 */
function convertStravaToUnified(stravaData: StravaTrackingData): UnifiedTrackingData {
    const coordinates: UnifiedCoordinate[] = stravaData.coordinates.map(coord => ({
        lat: coord.position.lat,
        lon: coord.position.lon,
        timestamp: coord.timestamp
    }));

    return {
        id: `https://www.strava.com/beacon/${stravaData.beaconId}`,
        identifier: {
            type: 'strava',
            data: { beaconId: stravaData.beaconId }
        },
        athleteName: stravaData.profile.name,
        activityType: stravaData.profile.activityType,
        coordinates,
        stats: {
            distance: stravaData.stats.distance,
            movingTime: stravaData.stats.moving_time,
            elapsedTime: stravaData.stats.elapsed_time,
            averageSpeed: stravaData.stats.averageSpeed
        },
        lastUpdate: stravaData.lastUpdate,
        batteryLevel: stravaData.battery_level
    };
}

/**
 * Strava tracking provider implementation
 */
export const stravaProvider: TrackingProvider = {
    parseUrl(url: string): StravaBeaconData | null {
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname === "www.strava.com" && urlObj.pathname.startsWith("/beacon/")) {
                const pathParts = urlObj.pathname.split("/");
                const beaconIndex = pathParts.indexOf("beacon");
                if (beaconIndex !== -1 && beaconIndex + 1 < pathParts.length && pathParts[beaconIndex + 1]) {
                    return { beaconId: pathParts[beaconIndex + 1] };
                }
            }
            return null;
        } catch {
            return null;
        }
    },

    isValidUrl(url: string): boolean {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname === "www.strava.com" && urlObj.pathname.startsWith("/beacon/");
        } catch {
            return false;
        }
    },

    async fetchTrackingData(identifiers: StravaBeaconData[], begin?: string): Promise<UnifiedTrackingData[]> {
        const results = await Promise.allSettled(
            identifiers.map(({ beaconId }) => fetchSingleStravaAthlete(beaconId, begin))
        );

        return results
            .filter((result): result is PromiseFulfilledResult<StravaTrackingData> => result.status === 'fulfilled')
            .map(result => convertStravaToUnified(result.value));
    },

    async fetchTrackingUpdates(identifiers: StravaBeaconData[], begin: string): Promise<{ id: string; coordinates: UnifiedCoordinate[] }[]> {
        const results = await Promise.allSettled(
            identifiers.map(({ beaconId }) => fetchSingleStravaAthleteUpdates(beaconId, begin))
        );

        return results
            .filter((result): result is PromiseFulfilledResult<StravaCoordinate[]> => result.status === 'fulfilled')
            .map((result, index) => ({
                id: `https://www.strava.com/beacon/${identifiers[index].beaconId}`,
                coordinates: result.value.map(coord => ({
                    lat: coord.position.lat,
                    lon: coord.position.lon,
                    timestamp: coord.timestamp
                }))
            }));
    }
};
