/**
 * Actions for athlete data management
 * These functions contain the business logic and interact with the store via setters
 */
import { fetchTrackingUpdates, processTrackingUrls } from "@/lib/unifiedClient";
import type { AthleteData } from "@/lib/types";
import { 
  addAthletes, 
  setLoading, 
  setError, 
  setMapCenter, 
  updateAthleteCoordinates,
  updateLastFetchTimestamp,
  getLastFetchTimestamp,
  removeAthlete,
  clearAllAthletes,
  setLiveTracking,
  selectAthlete
} from "./setters";
import { 
  getAthletesWithIdentifiers
} from "./selectors";
import { useAthleteStore } from "./athleteStore";

/**
 * Process URLs and add athletes to the store
 */
export async function processUrlsAction(urls: string[]): Promise<void> {
  if (urls.length === 0) return;

  setLoading(true);
  setError(null);

  try {
    const results = await processTrackingUrls(urls);

    const newAthletes: AthleteData[] = [];
    let firstValidCoordinate: [number, number] | undefined;

    for (const result of results) {
      if (result.success && result.data) {
        // Use unified data directly - no conversion needed!
        const athleteData: AthleteData = {
          id: result.data.id,
          provider: result.data.identifier.type,
          profile: {
            name: result.data.athleteName,
            location: result.data.activityType || "",
          },
          coordinates: result.data.coordinates, // Direct assignment!
          lastUpdate: result.data.lastUpdate,
          color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`,
          originalUrl: result.originalUrl,
          identifier: result.identifier || undefined,
          stats: result.data.stats, // Preserve native stats!
          activityType: result.data.activityType,
          batteryLevel: result.data.batteryLevel,
        };

        newAthletes.push(athleteData);

        // Set map center to the first athlete with coordinates
        if (!firstValidCoordinate && result.data.coordinates.length > 0) {
          const firstCoord = result.data.coordinates[0];
          firstValidCoordinate = [firstCoord.lat, firstCoord.lon];
        }
      } else {
        // Create an error athlete entry
        newAthletes.push({
          id: result.originalUrl,
          provider: result.identifier?.type || "garmin",
          profile: { name: "Failed to load", location: "" },
          coordinates: [],
          lastUpdate: new Date().toISOString(),
          color: "#ff0000",
          originalUrl: result.originalUrl,
          error: result.error?.message || "Unknown error",
          identifier: result.identifier || undefined,
        });
      }
    }

    addAthletes(newAthletes);

    // Set map center if we found coordinates and no center is set
    const currentMapCenter = useAthleteStore.getState().mapCenter;
    if (firstValidCoordinate && !currentMapCenter) {
      setMapCenter(firstValidCoordinate);
    }
  } catch (error) {
    console.error("Error processing URLs:", error);
    setError(error instanceof Error ? error.message : "Failed to process URLs");
  } finally {
    setLoading(false);
  }
}

/**
 * Update all athletes with new tracking data
 */
export async function updateAllAthletesAction(): Promise<void> {
  const validAthletes = getAthletesWithIdentifiers();
  
  if (validAthletes.length === 0) return;

  try {
    // Create identifier array for the update function
    const identifierArray = validAthletes.map((athlete) => athlete.identifier!);

    // Determine if this is initial load or update by checking if any athlete has a last fetch timestamp
    const hasAnyFetchTimestamp = validAthletes.some((athlete) =>
      getLastFetchTimestamp(athlete.id)
    );

    // For subsequent updates, use the oldest fetch timestamp to ensure we don't miss any data
    let beginTimestamp: Date | undefined = undefined;
    if (hasAnyFetchTimestamp) {
      const oldestTimestamp = validAthletes
        .map((athlete) => getLastFetchTimestamp(athlete.id))
        .filter((timestamp): timestamp is string => timestamp !== undefined)
        .sort()[0]; // Get the oldest timestamp

      if (oldestTimestamp) {
        beginTimestamp = new Date(oldestTimestamp);
      }
    }

    const updates = await fetchTrackingUpdates(identifierArray, beginTimestamp);

    const coordinateUpdates: Array<
      { athleteId: string; coordinates: AthleteData["coordinates"] }
    > = [];
    const successfulAthleteIds: string[] = [];
    const currentTime = new Date().toISOString();

    for (const athlete of validAthletes) {
      const update = updates.find((u) =>
        u.identifier &&
        athlete.identifier &&
        u.identifier.type === athlete.identifier.type &&
        ((u.identifier.type === "garmin" &&
          athlete.identifier.type === "garmin" &&
          u.identifier.data.sessionId === athlete.identifier.data.sessionId) ||
          (u.identifier.type === "strava" &&
            athlete.identifier.type === "strava" &&
            u.identifier.data.beaconId === athlete.identifier.data.beaconId))
      );

      if (update && update.success && update.coordinates) {
        const lastFetchTime = getLastFetchTimestamp(athlete.id);

        // For updates, always filter and append new coordinates to existing ones
        let newCoords = update.coordinates;
        
        if (lastFetchTime) {
          // Filter coordinates to only include new ones since last fetch
          const lastFetchDate = new Date(lastFetchTime);
          newCoords = update.coordinates.filter((coord) =>
            new Date(coord.timestamp) > lastFetchDate
          );
        }

        // Always append new coordinates to existing ones (never replace)
        const newCoordinates = [...athlete.coordinates, ...newCoords];

        coordinateUpdates.push({
          athleteId: athlete.id,
          coordinates: newCoordinates,
        });

        // Track which athletes were successfully updated
        successfulAthleteIds.push(athlete.id);
      }
    }

    // Batch update all coordinates at once for better performance
    if (coordinateUpdates.length > 0) {
      updateAthleteCoordinates(coordinateUpdates);

      // Only update fetch timestamps for athletes that were successfully updated
      successfulAthleteIds.forEach((athleteId) => {
        updateLastFetchTimestamp(athleteId, currentTime);
      });
    }

    setError(null); // Clear any previous errors on successful update
  } catch (error) {
    console.error("Error updating athletes:", error);
    setError(
      error instanceof Error ? error.message : "Failed to update athlete data",
    );
  }
}/**
 * Remove athlete by ID
 */
export function removeAthleteAction(id: string): void {
  removeAthlete(id);
}

/**
 * Clear all athlete data
 */
export function clearAllAthletesAction(): void {
  clearAllAthletes();
}

/**
 * Toggle live tracking on/off
 */
export function toggleLiveTrackingAction(): void {
  const isLiveTracking = useAthleteStore.getState().isLiveTracking;
  setLiveTracking(!isLiveTracking);
}

/**
 * Select athlete for detailed view
 */
export function selectAthleteAction(athleteId: string | null): void {
  selectAthlete(athleteId);
}

/**
 * Process URLs and replace athletes in the store (used for editing)
 * Preserves existing athletes when their URLs are still in the new list
 */
export async function replaceAthletesAction(urls: string[]): Promise<void> {
  if (urls.length === 0) {
    // If no URLs provided, clear all athletes
    clearAllAthletes();
    return;
  }

  const athletes = useAthleteStore.getState().athletes;

  setLoading(true);
  setError(null);

  try {
    // Create a map of existing athletes by their original URL
    const existingAthletesByUrl = new Map<string, AthleteData>();
    athletes.forEach((athlete) => {
      if (athlete.originalUrl) {
        existingAthletesByUrl.set(athlete.originalUrl, athlete);
      }
    });

    // Determine which URLs are new vs existing
    const newUrls = urls.filter((url) => !existingAthletesByUrl.has(url));

    // Process only the new URLs
    const newAthletes: AthleteData[] = [];
    if (newUrls.length > 0) {
      const results = await processTrackingUrls(newUrls);

      for (const result of results) {
        if (result.success && result.data) {
          // Use unified data directly - no conversion needed!
          const athleteData: AthleteData = {
            id: result.data.id,
            provider: result.data.identifier.type,
            profile: {
              name: result.data.athleteName,
              location: result.data.activityType || "",
            },
            coordinates: result.data.coordinates,
            lastUpdate: result.data.lastUpdate,
            color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`,
            originalUrl: result.originalUrl,
            identifier: result.identifier || undefined,
            stats: result.data.stats,
            activityType: result.data.activityType,
            batteryLevel: result.data.batteryLevel,
          };

          newAthletes.push(athleteData);
        } else {
          // Create an error athlete entry
          newAthletes.push({
            id: result.originalUrl,
            provider: result.identifier?.type || "garmin",
            profile: { name: "Failed to load", location: "" },
            coordinates: [],
            lastUpdate: new Date().toISOString(),
            color: "#ff0000",
            originalUrl: result.originalUrl,
            error: result.error?.message || "Unknown error",
            identifier: result.identifier || undefined,
          });
        }
      }
    }

    // Build the final athletes array in the order of the input URLs
    const finalAthletes: AthleteData[] = [];
    let firstValidCoordinate: [number, number] | undefined;

    for (const url of urls) {
      const existingAthlete = existingAthletesByUrl.get(url);
      if (existingAthlete) {
        // Use existing athlete (preserves accumulated data)
        finalAthletes.push(existingAthlete);

        // Check for map center from existing athlete
        if (!firstValidCoordinate && existingAthlete.coordinates.length > 0) {
          const firstCoord = existingAthlete.coordinates[0];
          firstValidCoordinate = [firstCoord.lat, firstCoord.lon];
        }
      } else {
        // Use new athlete
        const newAthlete = newAthletes.find((a) => a.originalUrl === url);
        if (newAthlete) {
          finalAthletes.push(newAthlete);

          // Check for map center from new athlete
          if (!firstValidCoordinate && newAthlete.coordinates.length > 0) {
            const firstCoord = newAthlete.coordinates[0];
            firstValidCoordinate = [firstCoord.lat, firstCoord.lon];
          }
        }
      }
    }

    // Clear all and add the reordered/filtered athletes
    clearAllAthletes();
    addAthletes(finalAthletes);

    // Set map center if we found coordinates and no center is set currently
    const currentMapCenter = useAthleteStore.getState().mapCenter;
    if (firstValidCoordinate && !currentMapCenter) {
      setMapCenter(firstValidCoordinate);
    }
  } catch (error) {
    console.error("Error replacing athletes:", error);
    setError(error instanceof Error ? error.message : "Failed to process URLs");
  } finally {
    setLoading(false);
  }
}
