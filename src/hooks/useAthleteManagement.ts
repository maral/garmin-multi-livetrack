import { useState, useCallback, useRef, useEffect } from "react";
import {
  parseGarminUrl,
  fetchGarminTrackingDataBatch,
  expandGarminUrlsBatch,
  isValidGarminUrl,
} from "@/lib/garmin-api";
import { ATHLETE_COLORS, DEFAULT_MAP_CENTER } from "@/lib/constants";
import type { AthleteData } from "@/lib/types";

export const useAthleteManagement = () => {
  const [athletes, setAthletes] = useState<AthleteData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_MAP_CENTER);
  
  // Use a ref to always have access to the latest athletes state
  const athletesRef = useRef<AthleteData[]>([]);
  
  // Keep the ref in sync with the state
  useEffect(() => {
    athletesRef.current = athletes;
  }, [athletes]);

  const updateAllAthletes = useCallback(async () => {
    const currentAthletes = athletesRef.current;
    
    if (currentAthletes.length === 0) return;

    try {
      // Prepare batch request - only include athletes with valid sessionId and token
      const validAthletes = currentAthletes.filter(
        athlete => athlete.sessionId && athlete.token && !athlete.error
      );

      if (validAthletes.length === 0) {
        return;
      }

      // Create batch request - deduplicate by sessionId to avoid duplicate API calls
      const uniqueAthletes = validAthletes.reduce((acc, athlete) => {
        if (!acc.some(a => a.sessionId === athlete.sessionId)) {
          acc.push(athlete);
        }
        return acc;
      }, [] as AthleteData[]);

      const batchRequest = uniqueAthletes.map(athlete => ({
        sessionId: athlete.sessionId,
        token: athlete.token,
        begin: athlete.coordinates.length > 0
          ? athlete.coordinates[athlete.coordinates.length - 1].timestamp
          : undefined,
      }));

      // Fetch all athlete data in a single batch request
      const batchResults = await fetchGarminTrackingDataBatch(batchRequest);

      // Process results with proper error handling
      const updatedAthletes = validAthletes.map(athlete => {
        const result = batchResults.get(athlete.sessionId);
        
        if (!result) {
          return athlete;
        }

        if (!result.coordinates || result.coordinates.length === 0) {
          return athlete;
        }
        
        return {
          ...athlete,
          coordinates: [...athlete.coordinates, ...result.coordinates],
        };
      });

      // Update state with batched results
      setAthletes(updatedAthletes);
    } catch (error) {
      console.error("Failed to batch update athletes:", error);
    }
  }, []); // No dependencies - use ref instead

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

    try {
      // Step 1: Batch expand all URLs that need expansion (gar.mn short URLs)
      const urlsNeedingExpansion = urlList.filter(url => {
        try {
          const urlObj = new URL(url);
          return urlObj.hostname === "gar.mn" || urlObj.hostname === "www.gar.mn";
        } catch {
          return false;
        }
      });
      
      // Expand short URLs in batch
      const expandedUrlsMap = urlsNeedingExpansion.length > 0 
        ? await expandGarminUrlsBatch(urlsNeedingExpansion)
        : new Map<string, string | null>();

      // Step 2: Parse all URLs to get sessionId and token
      const parsedAthletes: Array<{
        index: number;
        sessionId: string;
        token: string;
        color: string;
        originalUrl: string;
        error?: string;
      }> = [];

      for (let i = 0; i < urlList.length; i++) {
        const url = urlList[i];
        const color = ATHLETE_COLORS[i % ATHLETE_COLORS.length];
        
        try {
          let urlToProcess = url;
          
          // Use expanded URL if it was a short URL
          if (urlsNeedingExpansion.includes(url)) {
            const expanded = expandedUrlsMap.get(url);
            if (!expanded) {
              parsedAthletes.push({
                index: i,
                sessionId: "",
                token: "",
                color,
                originalUrl: url,
                error: "Failed to expand short URL"
              });
              continue;
            }
            urlToProcess = expanded;
          }
          
          const parsed = parseGarminUrl(urlToProcess);
          if (!parsed) {
            parsedAthletes.push({
              index: i,
              sessionId: "",
              token: "",
              color,
              originalUrl: url,
              error: "Failed to parse URL"
            });
            continue;
          }

          parsedAthletes.push({
            index: i,
            sessionId: parsed.sessionId,
            token: parsed.token,
            color,
            originalUrl: url
          });
        } catch (error) {
          parsedAthletes.push({
            index: i,
            sessionId: "",
            token: "",
            color,
            originalUrl: url,
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }

      // Step 3: Batch fetch tracking data for all valid athletes
      const validAthletes = parsedAthletes.filter(a => a.sessionId && a.token && !a.error);
      const batchRequest = validAthletes.map(athlete => ({
        sessionId: athlete.sessionId,
        token: athlete.token
      }));

      const trackingDataMap = batchRequest.length > 0 
        ? await fetchGarminTrackingDataBatch(batchRequest)
        : new Map();

      // Step 4: Create final athlete objects
      const newAthletes: AthleteData[] = parsedAthletes.map(athlete => {
        const athleteId = `athlete-${athlete.index}`;
        
        if (athlete.error) {
          return {
            id: athleteId,
            sessionId: athlete.sessionId,
            token: athlete.token,
            coordinates: [],
            profile: { name: `Athlete ${athlete.index + 1}`, location: "" },
            lastUpdate: new Date().toISOString(),
            color: athlete.color,
            originalUrl: athlete.originalUrl,
            error: athlete.error,
          } as AthleteData;
        }

        const trackingData = trackingDataMap.get(athlete.sessionId);
        
        if (trackingData) {
          return {
            ...trackingData,
            id: athleteId,
            color: athlete.color,
            originalUrl: athlete.originalUrl,
            isLoading: false,
          } as AthleteData;
        } else {
          return {
            id: athleteId,
            sessionId: athlete.sessionId,
            token: athlete.token,
            coordinates: [],
            profile: { name: `Athlete ${athlete.index + 1}`, location: "" },
            lastUpdate: new Date().toISOString(),
            color: athlete.color,
            originalUrl: athlete.originalUrl,
            error: "Failed to fetch tracking data",
            isLoading: false,
          } as AthleteData;
        }
      });

      setAthletes(newAthletes);

      // Calculate map center from all athletes
      const validAthletesWithCoords = newAthletes.filter(
        (athlete) => athlete.coordinates && athlete.coordinates.length > 0
      );

      if (validAthletesWithCoords.length > 0) {
        // Calculate bounds
        const allCoords = validAthletesWithCoords.flatMap((athlete) => athlete.coordinates);
        const lats = allCoords.map((coord) => coord.position.lat);
        const lngs = allCoords.map((coord) => coord.position.lon);

        const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
        const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;

        setMapCenter([centerLat, centerLng]);
      }

    } catch (error) {
      console.error("Failed to process URLs:", error);
      alert("Failed to process URLs. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
