/**
 * Store selectors - simple functions that read from store state
 */
import { useAthleteStore } from './athleteStore';
import type { AthleteData } from '@/lib/types';

// Basic getters
export function getAthleteById(id: string): AthleteData | undefined {
  return useAthleteStore.getState().athletes.find(athlete => athlete.id === id);
}

export function getValidAthletes(): AthleteData[] {
  return useAthleteStore.getState().athletes.filter(athlete => !athlete.error && athlete.coordinates.length > 0);
}

export function getAthletesWithIdentifiers(): AthleteData[] {
  return useAthleteStore.getState().athletes.filter(athlete => athlete.identifier && !athlete.error);
}

export function getSelectedAthlete(): AthleteData | null {
  const state = useAthleteStore.getState();
  const { selectedAthleteId, athletes } = state;
  return selectedAthleteId ? athletes.find(a => a.id === selectedAthleteId) || null : null;
}

// Component hooks (for reactive updates)
export const useAthletes = () => useAthleteStore(state => state.athletes);
export const useIsLoading = () => useAthleteStore(state => state.isLoading);
export const useIsLiveTracking = () => useAthleteStore(state => state.isLiveTracking);
export const useMapCenter = () => useAthleteStore(state => state.mapCenter);
export const useSelectedAthleteId = () => useAthleteStore(state => state.selectedAthleteId);
export const useError = () => useAthleteStore(state => state.error);

// Computed selectors for components
export const useValidAthletes = () => useAthleteStore(state => 
  state.athletes.filter(athlete => !athlete.error && athlete.coordinates.length > 0)
);

export const useAthletesWithIdentifiers = () => useAthleteStore(state => 
  state.athletes.filter(athlete => athlete.identifier && !athlete.error)
);

export const useSelectedAthlete = () => useAthleteStore(state => {
  const { selectedAthleteId, athletes } = state;
  return selectedAthleteId ? athletes.find(a => a.id === selectedAthleteId) || null : null;
});
