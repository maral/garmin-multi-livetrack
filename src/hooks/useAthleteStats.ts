/**
 * Optimized athlete stats calculation with memoization
 */
import { useMemo } from 'react';
import { calculateAthleteStats as baseCalculateAthleteStats } from '@/lib/athleteUtils';
import type { AthleteData, AthleteStats } from '@/lib/types';

/**
 * Memoized stats calculator for components that need a function
 */
export function useAthleteStatsCalculator() {
  return useMemo(() => {
    const calculatorFunction = (athlete: AthleteData): AthleteStats | null => {
      return baseCalculateAthleteStats(athlete);
    };
    return calculatorFunction;
  }, []);
}
