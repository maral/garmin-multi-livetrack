import { useState, useCallback } from "react";
import {
  parseAnyGarminUrl,
  fetchGarminTrackingData,
  isValidGarminUrl,
} from "@/lib/garmin-api";
import { ATHLETE_COLORS, DEFAULT_MAP_CENTER } from "@/lib/constants";
import type { AthleteData } from "@/lib/types";

export const useAthleteManagement = () => {
  const [athletes, setAthletes] = useState<AthleteData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_MAP_CENTER);

  const updateAthleteData = async (athlete: AthleteData): Promise<AthleteData> => {
    try {
      // Get the last timestamp for incremental updates
      const lastTimestamp =
        athlete.coordinates.length > 0
          ? athlete.coordinates[athlete.coordinates.length - 1].timestamp
          : undefined;

      const trackingData = await fetchGarminTrackingData(
        athlete.sessionId,
        athlete.token,
        lastTimestamp
      );

      if (trackingData && trackingData.coordinates.length > 0) {
        // Merge new coordinates with existing ones
        const newCoordinates = lastTimestamp
          ? [...athlete.coordinates, ...trackingData.coordinates]
          : trackingData.coordinates;

        return {
          ...athlete,
          coordinates: newCoordinates,
          profile: trackingData.profile,
          lastUpdate: new Date().toISOString(),
          error: undefined,
        };
      }

      return athlete; // No new data, return unchanged
    } catch (error) {
      console.error(`Failed to update athlete ${athlete.profile.name}:`, error);
      return athlete; // Return unchanged on error
    }
  };

  const updateAllAthletes = useCallback(async () => {
    if (athletes.length === 0) return;

    try {
      // Update all athletes simultaneously
      const updatePromises = athletes.map((athlete) =>
        updateAthleteData(athlete)
      );
      const updatedAthletes = await Promise.all(updatePromises);

      // Only update state if there are actual changes
      const hasChanges = updatedAthletes.some(
        (updated, index) =>
          updated.coordinates.length !== athletes[index].coordinates.length
      );

      if (hasChanges) {
        setAthletes(updatedAthletes);
        console.log("Live update: Updated athlete data");
      }
    } catch (error) {
      console.error("Failed to update athletes:", error);
    }
  }, [athletes]);

  const processUrls = useCallback(async (urls: string) => {
    const urlList = urls
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    if (urlList.length === 0) {
      alert("Please enter at least one Garmin LiveTrack URL");
      return;
    }

    // Validate URLs
    const invalidUrls = urlList.filter((url) => !isValidGarminUrl(url));
    if (invalidUrls.length > 0) {
      alert(`Invalid URLs found:\n${invalidUrls.join("\n")}`);
      return;
    }

    // Start loading and clear current athletes
    setIsLoading(true);
    setAthletes([]);

    // Process all URLs in parallel
    const athletePromises = urlList.map(async (url, i) => {
      const color = ATHLETE_COLORS[i % ATHLETE_COLORS.length];
      const athleteId = `athlete-${i}`;

      try {
        // Parse the URL (handle both short and long formats) - this may call expand-url API
        const parsed = await parseAnyGarminUrl(url);
        if (!parsed) {
          return {
            id: athleteId,
            sessionId: "",
            token: "",
            coordinates: [],
            profile: { name: `Athlete ${i + 1}`, location: "" },
            lastUpdate: new Date().toISOString(),
            color,
            originalUrl: url,
            error: "Failed to parse URL",
          } as AthleteData;
        }

        // Fetch tracking data - this calls garmin-fetch API
        const trackingData = await fetchGarminTrackingData(
          parsed.sessionId,
          parsed.token
        );

        if (trackingData) {
          return {
            ...trackingData,
            id: athleteId,
            color,
            originalUrl: url,
            isLoading: false,
          } as AthleteData;
        } else {
          return {
            id: athleteId,
            sessionId: parsed.sessionId,
            token: parsed.token,
            coordinates: [],
            profile: { name: `Athlete ${i + 1}`, location: "" },
            lastUpdate: new Date().toISOString(),
            color,
            originalUrl: url,
            error: "Failed to fetch tracking data",
            isLoading: false,
          } as AthleteData;
        }
      } catch (error) {
        return {
          id: athleteId,
          sessionId: "",
          token: "",
          coordinates: [],
          profile: { name: `Athlete ${i + 1}`, location: "" },
          lastUpdate: new Date().toISOString(),
          color,
          originalUrl: url,
          error: error instanceof Error ? error.message : "Unknown error",
        } as AthleteData;
      }
    });

    // Wait for all athletes to be processed in parallel
    const newAthletes = await Promise.all(athletePromises);

    setAthletes(newAthletes);
    setIsLoading(false);

    // Calculate map center from all athletes
    const validAthletes = newAthletes.filter(
      (athlete) => athlete.coordinates && athlete.coordinates.length > 0
    );

    if (validAthletes.length > 0) {
      // Calculate bounds
      const allCoords = validAthletes.flatMap((athlete) => athlete.coordinates);
      const lats = allCoords.map((coord) => coord.position.lat);
      const lngs = allCoords.map((coord) => coord.position.lon);

      const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
      const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;

      setMapCenter([centerLat, centerLng]);
    }

    return newAthletes;
  }, []);

  return {
    athletes,
    isLoading,
    mapCenter,
    setAthletes,
    setIsLoading,
    setMapCenter,
    updateAllAthletes,
    processUrls,
  };
};
