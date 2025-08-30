import { useState } from "react";
import type { AthleteData } from "@/lib/types";

export const useAthleteModal = () => {
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteData | null>(null);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  const handleAthleteClick = (athlete: AthleteData) => {
    setSelectedAthlete(athlete);
    setIsStatsModalOpen(true);
  };

  const handleStatsModalClose = () => {
    setIsStatsModalOpen(false);
    setSelectedAthlete(null);
  };

  return {
    selectedAthlete,
    isStatsModalOpen,
    handleAthleteClick,
    handleStatsModalClose,
  };
};
