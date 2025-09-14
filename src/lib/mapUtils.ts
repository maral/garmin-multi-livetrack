import type { AthleteData } from "./types";

/**
 * Calculate bounds for all athletes using Leaflet's LatLngBounds
 * Returns bounds that encompass all athlete positions with padding
 */
export function calculateAthleteBounds(athletes: AthleteData[]): [number, number][] | null {
  if (typeof window === "undefined") return null;
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const L = (window as any).L;
  if (!L) return null;

  const validAthletes = athletes.filter(
    (athlete) => !athlete.error && athlete.coordinates.length > 0
  );

  if (validAthletes.length === 0) return null;

  // Create a new LatLngBounds object
  const bounds = L.latLngBounds();

  // Add all athlete positions to bounds
  validAthletes.forEach(athlete => {
    if (athlete.coordinates.length > 0) {
      const latestPosition = athlete.coordinates[athlete.coordinates.length - 1];
      bounds.extend([latestPosition.lat, latestPosition.lon]);
    }
  });

  // Return bounds as [[south, west], [north, east]] format for fitBounds
  return [
    [bounds.getSouth(), bounds.getWest()],
    [bounds.getNorth(), bounds.getEast()]
  ];
}

/**
 * Get center point from bounds (fallback for when bounds can't be used)
 */
export function getBoundsCenter(bounds: [number, number][] | null): [number, number] {
  if (!bounds) return [40.7128, -74.0060]; // NYC fallback
  
  const [[south, west], [north, east]] = bounds;
  return [(south + north) / 2, (west + east) / 2];
}
