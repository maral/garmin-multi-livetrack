import { UnifiedTrackingData, UnifiedCoordinate, UnifiedStats } from './types';
import { GarminTrackingData, GarminCoordinate } from '../garmin-api';
import { StravaTrackingData, StravaCoordinate } from '../strava-api';

/**
 * Convert Garmin data to unified format
 */
export function convertGarminToUnified(data: GarminTrackingData, originalUrl: string): UnifiedTrackingData {
  // Convert coordinates
  const coordinates: UnifiedCoordinate[] = data.coordinates.map((coord: GarminCoordinate) => ({
    lat: coord.position.lat,
    lon: coord.position.lon,
    timestamp: coord.timestamp,
    altitude: coord.altitude,
    speed: coord.speed
  }));

  return {
    id: originalUrl,
    provider: 'garmin',
    athleteName: data.profile.name,
    activityType: data.profile.activityType,
    coordinates,
    lastUpdate: data.lastUpdate,
    // Calculate stats from coordinates if available
    stats: data.coordinates.length > 0 ? calculateStatsFromCoordinates(coordinates) : undefined
  };
}

/**
 * Convert Strava data to unified format
 */
export function convertStravaToUnified(data: StravaTrackingData, originalUrl: string): UnifiedTrackingData {
  // Convert coordinates
  const coordinates: UnifiedCoordinate[] = data.coordinates.map((coord: StravaCoordinate) => ({
    lat: coord.position.lat,
    lon: coord.position.lon,
    timestamp: coord.timestamp,
    altitude: undefined, // Strava doesn't provide altitude
    speed: undefined     // Strava doesn't provide speed
  }));

  return {
    id: originalUrl,
    provider: 'strava',
    athleteName: data.profile.name,
    activityType: data.profile.activityType,
    coordinates,
    lastUpdate: data.lastUpdate,
    // Use Strava's own stats and calculate average speed
    stats: {
      distance: data.stats.distance,
      movingTime: data.stats.moving_time,
      elapsedTime: data.stats.elapsed_time,
      averageSpeed: data.stats.distance && data.stats.moving_time && data.stats.moving_time > 0 
        ? data.stats.distance / data.stats.moving_time 
        : undefined
    }
  };
}

/**
 * Calculate comprehensive stats from coordinates
 */
function calculateStatsFromCoordinates(coordinates: UnifiedCoordinate[]): UnifiedStats {
  if (coordinates.length < 2) {
    return { distance: 0, elapsedTime: 0, averageSpeed: 0 };
  }

  const distance = calculateDistance(coordinates);
  
  // Calculate elapsed time from first to last coordinate
  const firstTime = new Date(coordinates[0].timestamp).getTime();
  const lastTime = new Date(coordinates[coordinates.length - 1].timestamp).getTime();
  const elapsedTime = Math.max(0, Math.floor((lastTime - firstTime) / 1000));
  
  // Calculate average speed
  const averageSpeed = elapsedTime > 0 ? distance / elapsedTime : 0;
  
  return {
    distance,
    elapsedTime,
    averageSpeed
  };
}

/**
 * Simple distance calculation (haversine formula)
 */
function calculateDistance(coordinates: UnifiedCoordinate[]): number {
  if (coordinates.length < 2) return 0;

  let totalDistance = 0;
  
  for (let i = 1; i < coordinates.length; i++) {
    const prev = coordinates[i - 1];
    const curr = coordinates[i];
    
    const R = 6371000; // Earth's radius in meters
    const φ1 = prev.lat * Math.PI / 180;
    const φ2 = curr.lat * Math.PI / 180;
    const Δφ = (curr.lat - prev.lat) * Math.PI / 180;
    const Δλ = (curr.lon - prev.lon) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    totalDistance += R * c;
  }

  return totalDistance;
}
