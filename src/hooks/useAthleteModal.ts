/**
 * Simplified athlete modal hook using Zustand store
 */
import { useCallback } from 'react';
import { 
  useSelectedAthlete, 
  useSelectedAthleteId,
} from '@/lib/store/athleteStore';
import { selectAthleteAction } from '@/lib/store/actions';
import type { AthleteData } from '@/lib/types';

interface UseAthleteModalReturn {
  selectedAthlete: AthleteData | null;
  isStatsModalOpen: boolean;
  handleAthleteClick: (athlete: AthleteData) => void;
  handleStatsModalClose: () => void;
}

export function useAthleteModal(): UseAthleteModalReturn {
  const selectedAthlete = useSelectedAthlete();
  const selectedAthleteId = useSelectedAthleteId();

  const handleAthleteClick = useCallback((athlete: AthleteData) => {
    selectAthleteAction(athlete.id);
  }, []);

  const handleStatsModalClose = useCallback(() => {
    selectAthleteAction(null);
  }, []);

  return {
    selectedAthlete: selectedAthlete || null,
    isStatsModalOpen: selectedAthleteId !== null,
    handleAthleteClick,
    handleStatsModalClose,
  };
}
