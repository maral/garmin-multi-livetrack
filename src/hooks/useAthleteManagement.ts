import { useState, useCallback } from "react";
import { AthleteData } from "@/lib/types";
import { processTrackingUrls, fetchTrackingUpdates } from "@/lib/unifiedClient";
import { convertUnifiedToAthleteData } from "@/lib/athleteConverters";
import { ParsedProviderData } from "@/lib/tracking/types";

interface UseAthleteManagementReturn {
  athletes: AthleteData[];
  isLoading: boolean;
  mapCenter: [number, number] | undefined;
  updateAllAthletes: () => Promise<void>;
  processUrls: (urls: string[]) => Promise<void>;
}

export function useAthleteManagement(): UseAthleteManagementReturn {
  const [athletes, setAthletes] = useState<AthleteData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number] | undefined>();

  const updateAllAthletes = useCallback(async () => {
    if (athletes.length === 0) return;

    try {
      const validAthletes = athletes.filter(
        athlete => athlete.parsedData && !athlete.error
      );

      if (validAthletes.length === 0) return;

      // Create parsed data array for the update function
      const parsedDataArray = validAthletes.map(athlete => athlete.parsedData!);
      const updates = await fetchTrackingUpdates(parsedDataArray);
      
      const updatedAthletes = athletes.map(athlete => {
        if (!athlete.parsedData || athlete.error) return athlete;
        
        const update = updates.find(u => 
          u.originalUrl === athlete.originalUrl
        );
        
        if (update && update.success && update.coordinates) {
          // Convert unified coordinates to Garmin format for the athlete
          const garminCoordinates = update.coordinates.map(coord => ({
            position: { lat: coord.lat, lon: coord.lon },
            timestamp: coord.timestamp,
            altitude: coord.altitude,
            speed: coord.speed,
            heading: undefined,
            fitnessData: undefined,
          }));

          // Update athlete with new coordinates
          return {
            ...athlete,
            coordinates: garminCoordinates,
            lastUpdate: new Date().toISOString(),
          };
        }
        
        return athlete;
      });

      setAthletes(updatedAthletes);
    } catch (error) {
      console.error("Failed to update athletes:", error);
    }
  }, [athletes]);

  const processUrls = useCallback(async (urls: string[]) => {
    if (urls.length === 0) return;

    setIsLoading(true);
    
    try {
      const results = await processTrackingUrls(urls);
      
      const newAthletes = results.map((result, index) => {
        const color = `hsl(${(index * 360) / results.length}, 70%, 50%)`;
        
        if (!result.success || result.error) {
          return {
            id: `athlete-${index}`,
            provider: result.provider || 'garmin',
            sessionId: '',
            token: '',
            coordinates: [],
            profile: { name: `Error: ${urls[index]}`, location: "" },
            lastUpdate: new Date().toISOString(),
            color,
            originalUrl: urls[index],
            error: result.error?.message || "Failed to process URL",
            parsedData: undefined,
          } as AthleteData;
        }

        if (result.data) {
          // Create a parsed data object from the result
          const parsedData: ParsedProviderData = {
            originalUrl: urls[index],
            provider: result.provider!,
            success: true,
            data: {
              sessionId: result.provider === 'garmin' ? result.data.id : undefined,
              token: result.provider === 'garmin' ? result.data.id : undefined,
              beaconId: result.provider === 'strava' ? result.data.id : undefined,
            }
          };
          
          return convertUnifiedToAthleteData(result.data, color, parsedData);
        }

        // Fallback for unexpected result structure
        return {
          id: `athlete-${index}`,
          provider: result.provider || 'garmin',
          sessionId: '',
          token: '',
          coordinates: [],
          profile: { name: `Athlete ${index + 1}`, location: "" },
          lastUpdate: new Date().toISOString(),
          color,
          originalUrl: urls[index],
          error: "Unexpected result structure",
          parsedData: undefined,
        } as AthleteData;
      });

      // Set map center to first athlete with coordinates
      const athleteWithCoords = newAthletes.find(
        (athlete) => athlete.coordinates.length > 0
      );
      if (athleteWithCoords && athleteWithCoords.coordinates.length > 0) {
        const firstCoord = athleteWithCoords.coordinates[0];
        setMapCenter([firstCoord.position.lat, firstCoord.position.lon]);
      }

      setAthletes(newAthletes);
    } catch (error) {
      console.error("Failed to process URLs:", error);
      alert("Failed to process URLs. Please check your input and try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    athletes,
    isLoading,
    mapCenter,
    updateAllAthletes,
    processUrls,
  };
}
