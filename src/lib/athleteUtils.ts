import type { AthleteData, AthleteStats } from "@/lib/types";

// Function to calculate athlete statistics
export const calculateAthleteStats = (athlete: AthleteData): AthleteStats | null => {
  if (!athlete.coordinates || athlete.coordinates.length === 0) {
    return null;
  }

  const coords = athlete.coordinates;
  const latest = coords[coords.length - 1];

  // Basic stats
  const totalDistance = latest.fitnessData?.totalDistanceMeters || 0;
  const activityType = latest.fitnessData?.activityType || "Unknown";

  // Time calculation
  const startTime = new Date(coords[0].timestamp).getTime();
  const endTime = new Date(latest.timestamp).getTime();
  const totalTime = (endTime - startTime) / 1000; // in seconds

  // Speed calculations
  const speeds = coords.map((c) => c.speed || 0).filter((s) => s > 0);
  const avgSpeed =
    speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;
  const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;

  // Elevation calculations
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

  // Heart rate calculations
  const heartRates = coords
    .map((c) => c.fitnessData?.heartRateBeatsPerMin)
    .filter((hr) => hr && hr > 0) as number[];
  const avgHeartRate =
    heartRates.length > 0
      ? heartRates.reduce((a, b) => a + b, 0) / heartRates.length
      : 0;
  const maxHeartRate = heartRates.length > 0 ? Math.max(...heartRates) : 0;

  return {
    totalDistance,
    totalTime,
    avgSpeed,
    maxSpeed,
    elevationGain,
    elevationLoss,
    minAltitude,
    maxAltitude,
    avgHeartRate,
    maxHeartRate,
    activityType,
  };
};

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
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export const formatSpeed = (mps: number): string => {
  const kmh = mps * 3.6;
  return `${kmh.toFixed(1)} km/h`;
};

export const formatElevation = (meters: number): string => {
  return `${Math.round(meters)} m`;
};
