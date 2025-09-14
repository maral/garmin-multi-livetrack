/**
 * New simplified athlete management hook using Zustand store
 * This replaces the old useAthleteManagement hook
 */
import { useEffect, useCallback } from 'react';
import { 
  useAthletes, 
  useIsLoading, 
  useMapCenter,
  useIsLiveTracking,
  useAthleteStore 
} from '@/lib/store/athleteStore';
import { 
  processUrlsAction, 
  updateAllAthletesAction,
  toggleLiveTrackingAction 
} from '@/lib/store/actions';
import { LIVE_UPDATE_INTERVAL } from '@/lib/constants';

interface UseAthleteManagementReturn {
  // State
  athletes: ReturnType<typeof useAthletes>;
  isLoading: boolean;
  mapCenter: [number, number] | undefined;
  isLiveTracking: boolean;
  
  // Actions
  processUrls: (urls: string[]) => Promise<void>;
  updateAllAthletes: () => Promise<void>;
  toggleLiveTracking: () => void;
}

export function useAthleteManagement(): UseAthleteManagementReturn {
  // Get state from store
  const athletes = useAthletes();
  const isLoading = useIsLoading();
  const mapCenter = useMapCenter();
  const isLiveTracking = useIsLiveTracking();
  
  // Get just the count to avoid array reference issues
  const athletesWithIdentifiersCount = useAthleteStore((state) => 
    state.athletes.filter((athlete) => athlete.identifier && !athlete.error).length
  );

  // Memoize actions to prevent unnecessary re-renders
  const processUrls = useCallback(processUrlsAction, []);
  const toggleLiveTracking = useCallback(toggleLiveTrackingAction, []);

  // Live tracking effect - use stable updateAllAthletesAction directly
  useEffect(() => {
    if (!isLiveTracking || athletesWithIdentifiersCount === 0) {
      return;
    }

    const interval = setInterval(() => {
      updateAllAthletesAction(); // Use the action directly, not the memoized callback
    }, LIVE_UPDATE_INTERVAL);

    console.log('Live tracking started for', athletesWithIdentifiersCount, 'athletes');

    return () => {
      clearInterval(interval);
      console.log('Live tracking stopped');
    };
  }, [isLiveTracking, athletesWithIdentifiersCount]); // Keep minimal deps

  return {
    // State
    athletes,
    isLoading,
    mapCenter,
    isLiveTracking,
    
    // Actions
    processUrls,
    updateAllAthletes: updateAllAthletesAction, // Use the action directly
    toggleLiveTracking,
  };
}
