import type { AthleteData, AthleteStats } from "@/lib/types";
import type { UnifiedCoordinate } from "@/lib/tracking/types";

// Function to calculate athlete statistics
export const calculateAthleteStats = (
  athlete: AthleteData,
): AthleteStats | null => {
  if (!athlete.coordinates || athlete.coordinates.length === 0) {
    return null;
  }

  const coords = athlete.coordinates;
  const latest = coords[coords.length - 1];

  // If we have native stats from the provider (like Strava), use them as a starting point
  let totalDistance = 0;
  const activityType = athlete.activityType || athlete.profile.location ||
    "Unknown";
  let avgSpeed = 0;
  let avgPace = 0; // minutes per km
  let totalTime = 0;

  // Use native stats if available
  if (athlete.stats) {
    totalDistance = athlete.stats.distance || 0;
    totalTime = athlete.stats.elapsedTime || athlete.stats.movingTime || 0;
    avgSpeed = athlete.stats.averageSpeed || 0;
  }

  // If no native stats, calculate from coordinates
  if (totalDistance === 0 || avgSpeed === 0) {
    totalDistance = calculateDistanceFromCoordinates(coords);

    // Calculate time from first to last coordinate
    const startTime = new Date(coords[0].timestamp).getTime();
    const endTime = new Date(latest.timestamp).getTime();
    const calculatedTime = (endTime - startTime) / 1000; // seconds
    totalTime = Math.max(totalTime, calculatedTime);

    // Calculate speed from coordinates or distance/time
    const speeds = coords.map((c) => c.speed || 0).filter((s) => s > 0);
    if (speeds.length > 0) {
      avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    } else if (totalDistance > 0 && totalTime > 0) {
      avgSpeed = totalDistance / totalTime; // m/s
    }
  }

  // Calculate pace (minutes per km) from average speed
  if (avgSpeed > 0) {
    avgPace = (1000 / avgSpeed) / 60; // convert m/s to minutes per km
  }

  // Elevation calculations from unified coordinates
  const altitudes = coords
    .map((c) => c.altitude)
    .filter((a) => a !== undefined) as number[];
  let elevationGain = 0;
  let elevationLoss = 0;

  for (let i = 1; i < altitudes.length; i++) {
    const diff = altitudes[i] - altitudes[i - 1];
    if (diff > 0) elevationGain += diff;
    if (diff < 0) elevationLoss += Math.abs(diff);
  }

  const minAltitude = altitudes.length > 0 ? Math.min(...altitudes) : 0;
  const maxAltitude = altitudes.length > 0 ? Math.max(...altitudes) : 0;

  // Heart rate data is not available in unified coordinates (provider-specific)
  const avgHeartRate = 0;
  const maxHeartRate = 0;

  return {
    totalDistance,
    totalTime,
    avgSpeed,
    avgPace,
    elevationGain,
    elevationLoss,
    minAltitude,
    maxAltitude,
    avgHeartRate,
    maxHeartRate,
    activityType,
  };
};

// Helper function to calculate distance from coordinates using Haversine formula
function calculateDistanceFromCoordinates(coords: UnifiedCoordinate[]): number {
  if (coords.length < 2) return 0;

  let totalDistance = 0;

  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1];
    const curr = coords[i];

    // UnifiedCoordinate has lat/lon directly, not nested in position
    const R = 6371000; // Earth's radius in meters
    const φ1 = prev.lat * Math.PI / 180;
    const φ2 = curr.lat * Math.PI / 180;
    const Δφ = (curr.lat - prev.lat) * Math.PI / 180;
    const Δλ = (curr.lon - prev.lon) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    totalDistance += R * c;
  }

  return totalDistance;
}

// Helper functions for formatting
export const formatDistance = (meters: number): string => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
};

export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${
      remainingSeconds
        .toString()
        .padStart(2, "0")
    }`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export const formatSpeed = (mps: number): string => {
  const kmh = mps * 3.6;
  return `${kmh.toFixed(1)} km/h`;
};

export const formatPace = (minutesPerKm: number): string => {
  if (minutesPerKm <= 0 || !isFinite(minutesPerKm)) {
    return "---";
  }
  const minutes = Math.floor(minutesPerKm);
  const seconds = Math.floor((minutesPerKm - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")} /km`;
};

export const formatElevation = (meters: number): string => {
  return `${Math.round(meters)} m`;
};

export const formatHeartRate = (bpm: number): string => {
  return `${Math.round(bpm)} bpm`;
};

export const formatAltitude = (meters: number): string => {
  return `${Math.round(meters)}m`;
};
