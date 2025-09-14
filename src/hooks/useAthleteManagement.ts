import { useState, useCallback } from "react";
import { AthleteData } from "@/lib/types";
import { processTrackingUrls, fetchTrackingUpdates } from "@/lib/unifiedClient";
import { convertUnifiedToAthleteData } from "@/lib/athleteConverters";

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
        athlete => athlete.identifier && !athlete.error
      );

      if (validAthletes.length === 0) return;

      // Create identifier array for the update function
      const identifierArray = validAthletes.map(athlete => athlete.identifier!);
      const updates = await fetchTrackingUpdates(identifierArray);
      
      const updatedAthletes = athletes.map(athlete => {
        if (!athlete.identifier || athlete.error) return athlete;
        
        const update = updates.find(u => 
          u.identifier && 
          athlete.identifier &&
          u.identifier.type === athlete.identifier.type &&
          ((u.identifier.type === 'garmin' && 
            athlete.identifier.type === 'garmin' &&
            u.identifier.data.sessionId === athlete.identifier.data.sessionId) ||
           (u.identifier.type === 'strava' && 
            athlete.identifier.type === 'strava' &&
            u.identifier.data.beaconId === athlete.identifier.data.beaconId))
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
      console.error('Error updating athletes:', error);
    }
  }, [athletes]);

  const processUrls = useCallback(async (urls: string[]) => {
    if (urls.length === 0) return;

    setIsLoading(true);
    
    try {
      const results = await processTrackingUrls(urls);
      
      const newAthletes: AthleteData[] = [];
      let firstValidCoordinate: [number, number] | undefined;

      for (const result of results) {
        if (result.success && result.data) {
          // Convert to athlete data format
          const athleteData = convertUnifiedToAthleteData(
            result.data,
            `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`,
            result.identifier || undefined
          );

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
            provider: result.identifier?.type || 'garmin',
            profile: { name: 'Failed to load', location: '' },
            coordinates: [],
            coursePoints: [],
            lastUpdate: new Date().toISOString(),
            color: '#ff0000',
            originalUrl: result.originalUrl,
            error: result.error?.message || 'Unknown error',
            identifier: result.identifier || undefined,
          });
        }
      }

      setAthletes(prev => [...prev, ...newAthletes]);
      
      if (firstValidCoordinate && !mapCenter) {
        setMapCenter(firstValidCoordinate);
      }
    } catch (error) {
      console.error('Error processing URLs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [mapCenter]);

  return {
    athletes,
    isLoading,
    mapCenter,
    updateAllAthletes,
    processUrls,
  };
}
