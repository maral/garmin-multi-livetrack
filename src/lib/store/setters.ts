/**
 * Store setters - simple functions that modify store state
 */
import { useAthleteStore } from './athleteStore';
import type { AthleteData } from '@/lib/types';

// Core data operations
export function addAthletes(newAthletes: AthleteData[]) {
  useAthleteStore.setState(state => {
    const existingIds = new Set(state.athletes.map(a => a.id));
    const uniqueNewAthletes = newAthletes.filter(athlete => !existingIds.has(athlete.id));
    
    return {
      athletes: [...state.athletes, ...uniqueNewAthletes],
      error: null,
    };
  });
}

export function updateAthlete(athleteId: string, updates: Partial<AthleteData>) {
  useAthleteStore.setState(state => ({
    athletes: state.athletes.map(athlete =>
      athlete.id === athleteId ? { ...athlete, ...updates } : athlete
    ),
  }));
}

export function removeAthlete(athleteId: string) {
  useAthleteStore.setState(state => {
    const newTimestamps = { ...state.lastFetchTimestamps };
    delete newTimestamps[athleteId];
    
    return {
      athletes: state.athletes.filter(athlete => athlete.id !== athleteId),
      selectedAthleteId: state.selectedAthleteId === athleteId ? null : state.selectedAthleteId,
      lastFetchTimestamps: newTimestamps,
    };
  });
}

export function clearAllAthletes() {
  useAthleteStore.setState({
    athletes: [],
    selectedAthleteId: null,
    mapCenter: undefined,
    lastFetchTimestamps: {},
  });
}

export function updateAthleteCoordinates(updates: Array<{ athleteId: string; coordinates: AthleteData['coordinates'] }>) {
  useAthleteStore.setState(state => {
    const updateMap = new Map(updates.map(u => [u.athleteId, u.coordinates]));
    
    return {
      athletes: state.athletes.map(athlete => {
        const newCoordinates = updateMap.get(athlete.id);
        if (newCoordinates) {
          return {
            ...athlete,
            coordinates: newCoordinates,
            lastUpdate: new Date().toISOString(),
          };
        }
        return athlete;
      }),
    };
  });
}

// State management
export function setLoading(loading: boolean) {
  useAthleteStore.setState({ isLoading: loading });
}

export function setLiveTracking(isLive: boolean) {
  useAthleteStore.setState({ isLiveTracking: isLive });
}

export function setError(error: string | null) {
  useAthleteStore.setState({ error });
}

// Timestamp tracking
export function updateLastFetchTimestamp(athleteId: string, timestamp: string) {
  useAthleteStore.setState(state => ({
    lastFetchTimestamps: {
      ...state.lastFetchTimestamps,
      [athleteId]: timestamp,
    },
  }));
}

export function getLastFetchTimestamp(athleteId: string): string | undefined {
  return useAthleteStore.getState().lastFetchTimestamps[athleteId];
}

// Map operations
export function setMapCenter(center: [number, number]) {
  useAthleteStore.setState({ mapCenter: center });
}

// Selection
export function selectAthlete(athleteId: string | null) {
  useAthleteStore.setState({ selectedAthleteId: athleteId });
}
