/**
 * Converter functions between unified tracking data and legacy AthleteData format
 */

import { UnifiedTrackingData, UnifiedCoordinate, TrackingIdentifier } from '@/lib/tracking/types';
import { AthleteData } from '@/lib/types';
import { GarminCoordinate } from '@/lib/garmin-api';

/**
 * Convert UnifiedTrackingData to legacy AthleteData format for backward compatibility
 */
export function convertUnifiedToAthleteData(
  unified: UnifiedTrackingData, 
  color: string, 
  identifier?: TrackingIdentifier
): AthleteData {
  // Convert unified coordinates to Garmin coordinate format
  const coordinates: GarminCoordinate[] = unified.coordinates.map((coord: UnifiedCoordinate) => ({
    position: {
      lat: coord.lat,
      lon: coord.lon,
    },
    timestamp: coord.timestamp,
    altitude: coord.altitude,
    speed: coord.speed,
    // Default values for Garmin-specific fields
    heading: undefined,
    fitnessData: undefined,
  }));

  return {
    id: unified.id,
    provider: identifier?.type || 'garmin',
    profile: {
      name: unified.athleteName,
      location: unified.activityType || '',
    },
    coordinates,
    coursePoints: [], // Will be populated separately for Garmin
    lastUpdate: unified.lastUpdate,
    color,
    originalUrl: unified.id, // unified.id is the original URL
    identifier,
  };
}

/**
 * Convert coordinates from unified format to Garmin format for updates
 */
export function convertUnifiedCoordinatesToGarmin(coords: UnifiedCoordinate[]): GarminCoordinate[] {
  return coords.map((coord: UnifiedCoordinate) => ({
    position: {
      lat: coord.lat,
      lon: coord.lon,
    },
    timestamp: coord.timestamp,
    altitude: coord.altitude,
    speed: coord.speed,
    heading: undefined,
    fitnessData: undefined,
  }));
}
