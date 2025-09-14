/**
 * Pure Zustand store for athlete state - data only, no functions
 */
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { AthleteData } from "@/lib/types";

export interface AthleteState {
  // Core athlete data
  athletes: AthleteData[];

  // Loading and UI states
  isLoading: boolean;
  isLiveTracking: boolean;

  // Map state
  mapCenter: [number, number] | undefined;

  // Selection state
  selectedAthleteId: string | null;

  // Error state
  error: string | null;

  // Track last fetch timestamps per athlete for incremental updates
  lastFetchTimestamps: Record<string, string>; // athleteId -> ISO timestamp
}

// Initial state
const initialState: AthleteState = {
  athletes: [],
  isLoading: false,
  isLiveTracking: true, // Default to live tracking enabled
  mapCenter: undefined,
  selectedAthleteId: null,
  error: null,
  lastFetchTimestamps: {},
};

export const useAthleteStore = create<AthleteState>()(
  devtools(
    () => initialState,
    {
      name: "athlete-store", // Name for Redux DevTools
    },
  ),
);

// Custom hooks for convenient access to specific parts of the state
export const useAthletes = () => useAthleteStore((state) => state.athletes);
export const useIsLoading = () => useAthleteStore((state) => state.isLoading);
export const useIsLiveTracking = () =>
  useAthleteStore((state) => state.isLiveTracking);
export const useMapCenter = () => useAthleteStore((state) => state.mapCenter);
export const useSelectedAthleteId = () =>
  useAthleteStore((state) => state.selectedAthleteId);
export const useError = () => useAthleteStore((state) => state.error);

// Derived state hooks using selectors
export const useSelectedAthlete = () =>
  useAthleteStore((state) =>
    state.selectedAthleteId
      ? state.athletes.find((a) => a.id === state.selectedAthleteId) || null
      : null
  );

export const useValidAthletes = () =>
  useAthleteStore((state) =>
    state.athletes.filter((athlete) => !athlete.error)
  );

export const useAthletesWithIdentifiers = () =>
  useAthleteStore((state) =>
    state.athletes.filter((athlete) => athlete.identifier)
  );
