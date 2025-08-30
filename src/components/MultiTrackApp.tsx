"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Settings, Radio } from "lucide-react";
import {
  parseAnyGarminUrl,
  fetchGarminTrackingData,
  isValidGarminUrl,
} from "@/lib/garmin-api";
import { initializeLeafletIcons } from "@/lib/leafletIcons";
import AthletesSummary from "@/components/AthletesSummary";
import AthleteStatsModal from "@/components/AthleteStatsModal";
import UrlInputForm from "@/components/UrlInputForm";
import TrackingMap from "@/components/TrackingMap";
import MultiTrackShareButton from "@/components/MultiTrackShareButton";
import type { AthleteData, AthleteStats } from "@/lib/types";

const ATHLETE_COLORS = [
  "#ff0000",
  "#00ff00",
  "#0000ff",
  "#ffff00",
  "#ff00ff",
  "#00ffff",
  "#ff8000",
  "#8000ff",
];

// Function to calculate athlete statistics
const calculateAthleteStats = (athlete: AthleteData): AthleteStats | null => {
  if (!athlete.coordinates || athlete.coordinates.length === 0) {
    return null;
  }

  const coords = athlete.coordinates;
  const latest = coords[coords.length - 1];

  // Basic stats
  const totalDistance = latest.fitnessData?.totalDistanceMeters || 0;
  const activityType = latest.fitnessData?.activityType || "Unknown";

  // Time calculation
  const startTime = new Date(coords[0].timestamp).getTime();
  const endTime = new Date(latest.timestamp).getTime();
  const totalTime = (endTime - startTime) / 1000; // in seconds

  // Speed calculations
  const speeds = coords.map((c) => c.speed || 0).filter((s) => s > 0);
  const avgSpeed =
    speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;
  const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;

  // Elevation calculations
  const altitudes = coords
    .map((c) => c.altitude)
    .filter((a) => a !== undefined) as number[];
  let elevationGain = 0;
  let elevationLoss = 0;

  for (let i = 1; i < altitudes.length; i++) {
    const diff = altitudes[i] - altitudes[i - 1];
    if (diff > 0) elevationGain += diff;
    if (diff < 0) elevationLoss += Math.abs(diff);
  }

  const minAltitude = altitudes.length > 0 ? Math.min(...altitudes) : 0;
  const maxAltitude = altitudes.length > 0 ? Math.max(...altitudes) : 0;

  // Heart rate calculations
  const heartRates = coords
    .map((c) => c.fitnessData?.heartRateBeatsPerMin)
    .filter((hr) => hr && hr > 0) as number[];
  const avgHeartRate =
    heartRates.length > 0
      ? heartRates.reduce((a, b) => a + b, 0) / heartRates.length
      : 0;
  const maxHeartRate = heartRates.length > 0 ? Math.max(...heartRates) : 0;

  return {
    totalDistance,
    totalTime,
    avgSpeed,
    maxSpeed,
    elevationGain,
    elevationLoss,
    minAltitude,
    maxAltitude,
    avgHeartRate,
    maxHeartRate,
    activityType,
  };
};

// Helper functions for formatting
const formatDistance = (meters: number): string => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
};

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const formatSpeed = (mps: number): string => {
  const kmh = mps * 3.6;
  return `${kmh.toFixed(1)} km/h`;
};

const formatElevation = (meters: number): string => {
  return `${Math.round(meters)} m`;
};

interface MultiTrackAppProps {
  initialUrls?: string[];
}

export default function MultiTrackApp({
  initialUrls = [],
}: MultiTrackAppProps) {
  const [urls, setUrls] = useState<string>(initialUrls.join("\n"));
  const [originalUrls, setOriginalUrls] = useState<string>(""); // Track original URLs for cancel functionality
  const [athletes, setAthletes] = useState<AthleteData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Track if we're in edit mode
  const [mapCenter, setMapCenter] = useState<[number, number]>([49.5, 18.2]); // Default center
  const [isClient, setIsClient] = useState(false);

  // Live tracking state
  const [isLive, setIsLive] = useState(true);
  const [liveInterval, setLiveInterval] = useState<NodeJS.Timeout | null>(null);

  // Modal state
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteData | null>(
    null
  );
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Initialize leaflet icons
    initializeLeafletIcons();
  }, []);

  // Modal handlers
  const handleAthleteClick = (athlete: AthleteData) => {
    setSelectedAthlete(athlete);
    setIsStatsModalOpen(true);
  };

  const handleStatsModalClose = () => {
    setIsStatsModalOpen(false);
    setSelectedAthlete(null);
  };

  // Live tracking functions
  const updateAthleteData = async (
    athlete: AthleteData
  ): Promise<AthleteData> => {
    try {
      // Get the last timestamp for incremental updates
      const lastTimestamp =
        athlete.coordinates.length > 0
          ? athlete.coordinates[athlete.coordinates.length - 1].timestamp
          : undefined;

      const trackingData = await fetchGarminTrackingData(
        athlete.sessionId,
        athlete.token,
        lastTimestamp
      );

      if (trackingData && trackingData.coordinates.length > 0) {
        // Merge new coordinates with existing ones
        const newCoordinates = lastTimestamp
          ? [...athlete.coordinates, ...trackingData.coordinates]
          : trackingData.coordinates;

        return {
          ...athlete,
          coordinates: newCoordinates,
          profile: trackingData.profile,
          lastUpdate: new Date().toISOString(),
          error: undefined,
        };
      }

      return athlete; // No new data, return unchanged
    } catch (error) {
      console.error(`Failed to update athlete ${athlete.profile.name}:`, error);
      return athlete; // Return unchanged on error
    }
  };

  const updateAllAthletes = useCallback(async () => {
    if (athletes.length === 0) return;

    try {
      // Update all athletes simultaneously
      const updatePromises = athletes.map((athlete) =>
        updateAthleteData(athlete)
      );
      const updatedAthletes = await Promise.all(updatePromises);

      // Only update state if there are actual changes
      const hasChanges = updatedAthletes.some(
        (updated, index) =>
          updated.coordinates.length !== athletes[index].coordinates.length
      );

      if (hasChanges) {
        setAthletes(updatedAthletes);
        console.log("Live update: Updated athlete data");
      }
    } catch (error) {
      console.error("Failed to update athletes:", error);
    }
  }, [athletes]);

  const startLiveTracking = () => {
    // For manual start (play button), show alert if no athletes
    if (athletes.length === 0) {
      alert("Please add some athletes first!");
      return;
    }

    setIsLive(true);
    // The useEffect will handle starting the interval
    console.log("Live tracking enabled");
  };

  const stopLiveTracking = () => {
    setIsLive(false);
    if (liveInterval) {
      clearInterval(liveInterval);
      setLiveInterval(null);
    }
    console.log("Live tracking stopped");
  };

  const toggleLiveTracking = () => {
    if (isLive) {
      stopLiveTracking();
    } else {
      startLiveTracking();
    }
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (liveInterval) {
        clearInterval(liveInterval);
      }
    };
  }, [liveInterval]);

  const processUrls = useCallback(async () => {
    const urlList = urls
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    if (urlList.length === 0) {
      alert("Please enter at least one Garmin LiveTrack URL");
      return;
    }

    // Validate URLs
    const invalidUrls = urlList.filter((url) => !isValidGarminUrl(url));
    if (invalidUrls.length > 0) {
      alert(`Invalid URLs found:\n${invalidUrls.join("\n")}`);
      return;
    }

    // Start loading and clear current athletes
    setIsLoading(true);
    setAthletes([]);
    setIsEditing(false); // Exit editing mode when processing

    // Store the original URLs for potential cancel operations
    setOriginalUrls(urls);

    // Process all URLs in parallel
    const athletePromises = urlList.map(async (url, i) => {
      const color = ATHLETE_COLORS[i % ATHLETE_COLORS.length];
      const athleteId = `athlete-${i}`;

      try {
        // Parse the URL (handle both short and long formats) - this may call expand-url API
        const parsed = await parseAnyGarminUrl(url);
        if (!parsed) {
          return {
            id: athleteId,
            sessionId: "",
            token: "",
            coordinates: [],
            profile: { name: `Athlete ${i + 1}`, location: "" },
            lastUpdate: new Date().toISOString(),
            color,
            originalUrl: url,
            error: "Failed to parse URL",
          } as AthleteData;
        }

        // Fetch tracking data - this calls garmin-fetch API
        const trackingData = await fetchGarminTrackingData(
          parsed.sessionId,
          parsed.token
        );

        if (trackingData) {
          return {
            ...trackingData,
            id: athleteId,
            color,
            originalUrl: url,
            isLoading: false,
          } as AthleteData;
        } else {
          return {
            id: athleteId,
            sessionId: parsed.sessionId,
            token: parsed.token,
            coordinates: [],
            profile: { name: `Athlete ${i + 1}`, location: "" },
            lastUpdate: new Date().toISOString(),
            color,
            originalUrl: url,
            error: "Failed to fetch tracking data",
            isLoading: false,
          } as AthleteData;
        }
      } catch (error) {
        return {
          id: athleteId,
          sessionId: "",
          token: "",
          coordinates: [],
          profile: { name: `Athlete ${i + 1}`, location: "" },
          lastUpdate: new Date().toISOString(),
          color,
          originalUrl: url,
          error: error instanceof Error ? error.message : "Unknown error",
        } as AthleteData;
      }
    });

    // Wait for all athletes to be processed in parallel
    const newAthletes = await Promise.all(athletePromises);

    setAthletes(newAthletes);
    setIsLoading(false);

    // Calculate map center from all athletes
    const validAthletes = newAthletes.filter(
      (athlete) => athlete.coordinates && athlete.coordinates.length > 0
    );

    if (validAthletes.length > 0) {
      // Calculate bounds
      const allCoords = validAthletes.flatMap((athlete) => athlete.coordinates);
      const lats = allCoords.map((coord) => coord.position.lat);
      const lngs = allCoords.map((coord) => coord.position.lon);

      const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
      const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;

      setMapCenter([centerLat, centerLng]);
    }

    // Resume live tracking after processing URLs (if athletes were loaded)
    if (newAthletes.length > 0) {
      setIsLive(true);
    }
  }, [urls]);

  const startEditing = () => {
    setIsEditing(true);
    setIsLive(false);
  };

  const cancelEditing = () => {
    setUrls(originalUrls);
    setIsEditing(false);

    // Resume live tracking if there are athletes loaded
    if (athletes.length > 0) {
      setIsLive(true);
    }
  };

  const resetForm = () => {
    setUrls("");
    setOriginalUrls("");
    setAthletes([]);
    setIsLive(false);
    if (liveInterval) {
      clearInterval(liveInterval);
      setLiveInterval(null);
    }
  };

  // Load initial URLs if provided
  useEffect(() => {
    if (initialUrls.length > 0) {
      setUrls(initialUrls.join("\n"));
      processUrls();
    }
  }, [initialUrls, processUrls]);

  // Auto-start live tracking when athletes are loaded and isLive is true
  useEffect(() => {
    if (isLive && athletes.length > 0 && !liveInterval) {
      const validAthletes = athletes.filter(
        (athlete) => !athlete.error && athlete.sessionId && athlete.token
      );
      if (validAthletes.length > 0) {
        const interval = setInterval(updateAllAthletes, 15000);
        setLiveInterval(interval);
        console.log("Live tracking auto-started");
      }
    }
  }, [athletes, isLive, liveInterval, updateAllAthletes]);

  if (isEditing || (athletes.length === 0 && !isLoading)) {
    return (
      <UrlInputForm
        urls={urls}
        setUrls={setUrls}
        onProcessUrls={processUrls}
        onCancel={isEditing ? cancelEditing : undefined}
        onClearAll={isEditing ? resetForm : undefined}
        isLoading={isLoading}
        isEditing={isEditing}
      />
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="h-screen flex flex-col">
        {/* Header - matches TopBar design */}
        <div className="h-14 px-4 sm:px-6 py-2 flex items-center justify-between border-b">
          <div className="flex items-center gap-3">
            <h1 className="text-lg sm:text-xl font-bold truncate">
              Garmin Multi LiveTrack
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Live tracking status indicator */}
            {athletes.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-gray-50">
                {isLive ? (
                  <>
                    <Radio className="h-4 w-4 text-red-500 animate-pulse" />
                    <span className="text-sm font-medium text-red-600">
                      LIVE
                    </span>
                  </>
                ) : (
                  <>
                    <div className="h-4 w-4 rounded-full bg-gray-400"></div>
                    <span className="text-sm font-medium text-gray-600">
                      PAUSED
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Live tracking control */}
            {athletes.length > 0 && (
              <Button
                onClick={toggleLiveTracking}
                disabled={athletes.length === 0}
                variant={isLive ? "destructive" : "default"}
                size="sm"
                className="gap-1"
              >
                {isLive ? (
                  <>
                    <Pause className="h-4 w-4" />
                    <span className="hidden sm:inline">Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    <span className="hidden sm:inline">Play</span>
                  </>
                )}
              </Button>
            )}

            {/* Share button */}
            {athletes.length > 0 && (
              <MultiTrackShareButton
                urls={athletes.map((a) => a.originalUrl)}
              />
            )}

            {/* URL Settings button */}
            <Button
              onClick={startEditing}
              variant="outline"
              size="sm"
              className="gap-1"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">URL Settings</span>
            </Button>
          </div>
        </div>

        {/* Athletes Summary - below header */}
        {athletes.length > 0 && (
          <AthletesSummary
            athletes={athletes}
            onAthleteClick={handleAthleteClick}
            calculateAthleteStats={calculateAthleteStats}
            isLoading={isLoading}
          />
        )}

        {/* Main content area */}
        {isLoading && athletes.length === 0 ? (
          /* Full-width loading state */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-lg">Loading athletes...</div>
              <div className="text-sm mt-2">
                Processing Garmin LiveTrack URLs
              </div>
            </div>
          </div>
        ) : athletes.length > 0 ? (
          /* Map takes full width when athletes are loaded */
          <div className="flex-1 min-h-0" style={{ height: "100%" }}>
            <TrackingMap
              athletes={athletes}
              mapCenter={mapCenter}
              isClient={isClient}
              calculateAthleteStats={calculateAthleteStats}
            />
          </div>
        ) : (
          /* Empty state when no athletes and not loading */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-lg">No athletes loaded</div>
              <div className="text-sm mt-2">
                Add some Garmin LiveTrack URLs to get started
              </div>
            </div>
          </div>
        )}

        {/* Stats Modal */}
        <AthleteStatsModal
          athlete={selectedAthlete}
          stats={
            selectedAthlete ? calculateAthleteStats(selectedAthlete) : null
          }
          isOpen={isStatsModalOpen}
          onClose={handleStatsModalClose}
        />
      </div>
    </main>
  );
}

// Export the types and helper functions for reuse
export type { AthleteData, AthleteStats };
export {
  calculateAthleteStats,
  formatDistance,
  formatTime,
  formatSpeed,
  formatElevation,
};
