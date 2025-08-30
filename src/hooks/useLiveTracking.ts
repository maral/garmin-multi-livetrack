import { useState, useEffect, useCallback } from "react";
import { LIVE_UPDATE_INTERVAL } from "@/lib/constants";
import type { AthleteData } from "@/lib/types";

export const useLiveTracking = (
  athletes: AthleteData[],
  updateAllAthletes: () => Promise<void>
) => {
  const [isLive, setIsLive] = useState(true);
  const [liveInterval, setLiveInterval] = useState<NodeJS.Timeout | null>(null);

  const startLiveTracking = useCallback(() => {
    // For manual start (play button), show alert if no athletes
    if (athletes.length === 0) {
      alert("Please add some athletes first!");
      return;
    }

    setIsLive(true);
    console.log("Live tracking enabled");
  }, [athletes.length]);

  const stopLiveTracking = useCallback(() => {
    setIsLive(false);
    if (liveInterval) {
      clearInterval(liveInterval);
      setLiveInterval(null);
    }
    console.log("Live tracking stopped");
  }, [liveInterval]);

  const toggleLiveTracking = useCallback(() => {
    if (isLive) {
      stopLiveTracking();
    } else {
      startLiveTracking();
    }
  }, [isLive, startLiveTracking, stopLiveTracking]);

  // Auto-start live tracking when athletes are loaded and isLive is true
  useEffect(() => {
    if (isLive && athletes.length > 0 && !liveInterval) {
      const validAthletes = athletes.filter(
        (athlete) => !athlete.error && athlete.sessionId && athlete.token
      );
      if (validAthletes.length > 0) {
        const interval = setInterval(updateAllAthletes, LIVE_UPDATE_INTERVAL);
        setLiveInterval(interval);
        console.log("Live tracking auto-started");
      }
    }
  }, [athletes, isLive, liveInterval, updateAllAthletes]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (liveInterval) {
        clearInterval(liveInterval);
      }
    };
  }, [liveInterval]);

  return {
    isLive,
    setIsLive,
    liveInterval,
    setLiveInterval,
    startLiveTracking,
    stopLiveTracking,
    toggleLiveTracking,
  };
};
