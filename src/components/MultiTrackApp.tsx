"use client";

import { useState, useEffect } from "react";
import { initializeLeafletIcons } from "@/lib/leafletIcons";
import { useAthleteStatsCalculator } from "@/hooks/useAthleteStats";
import { useAthleteManagement } from "@/hooks/useAthleteManagement";
import { useAthleteModal } from "@/hooks/useAthleteModal";
import { useEditingState } from "@/hooks/useEditingState";
import { clearAllAthletesAction, replaceAthletesAction } from "@/lib/store/actions";
import AthletesSummary from "@/components/AthletesSummary";
import AthleteStatsModal from "@/components/AthleteStatsModal";
import UrlInputForm from "@/components/UrlInputForm";
import TrackingMap from "@/components/TrackingMap";
import MultiTrackHeader from "@/components/MultiTrackHeader";

interface MultiTrackAppProps {
  initialUrls?: string[];
}

export default function MultiTrackApp({
  initialUrls = [],
}: MultiTrackAppProps) {
  const [isClient, setIsClient] = useState(false);

  // Initialize client-side state
  useEffect(() => {
    setIsClient(true);
    initializeLeafletIcons();
  }, []);

  // Zustand-based hooks for state management
  const { 
    athletes, 
    isLoading, 
    mapCenter, 
    isLiveTracking,
    processUrls, 
    toggleLiveTracking 
  } = useAthleteManagement();

  const {
    selectedAthlete,
    isStatsModalOpen,
    handleAthleteClick,
    handleStatsModalClose,
  } = useAthleteModal();

  // Memoized stats calculator
  const calculateAthleteStats = useAthleteStatsCalculator();

  const {
    urls,
    setUrls,
    isEditing,
    startEditing,
    cancelEditing,
    resetForm,
    completeEditing,
  } = useEditingState(initialUrls);

  // Process URLs handler
  const handleProcessUrls = async () => {
    if (!urls.trim()) return;

    const urlList = urls
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    if (urlList.length === 0) return;

    try {
      if (isEditing) {
        // When editing, replace all athletes
        await replaceAthletesAction(urlList);
      } else {
        // When first loading, add to existing athletes
        await processUrls(urlList);
      }
      completeEditing();
      resetForm();
    } catch (error) {
      console.error("Error processing URLs:", error);
    }
  };

  // Toggle live tracking
  const handleToggleLiveTracking = () => {
    if (!isLiveTracking && athletes.length === 0) {
      alert("Please add some athletes first!");
      return;
    }
    toggleLiveTracking();
  };

  // Load initial URLs if provided
  useEffect(() => {
    if (initialUrls.length > 0) {
      setUrls(initialUrls.join("\n"));
      handleProcessUrls();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUrls]);

  // Show URL input form when editing or no athletes loaded
  if (isEditing || (athletes.length === 0 && !isLoading)) {
    return (
      <UrlInputForm
        urls={urls}
        setUrls={setUrls}
        onProcessUrls={handleProcessUrls}
        onCancel={isEditing ? cancelEditing : undefined}
        onClearAll={isEditing ? () => clearAllAthletesAction() : undefined}
        isLoading={isLoading}
        isEditing={isEditing}
      />
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="h-screen flex flex-col">
        {/* Header */}
        <MultiTrackHeader
          athletes={athletes}
          isLive={isLiveTracking}
          toggleLiveTracking={handleToggleLiveTracking}
          onSettingsClick={() => startEditing()} // Start editing on settings click
        />

        {/* Athletes Summary */}
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
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-lg">Loading athletes...</div>
              <div className="text-sm mt-2">
                Processing tracking URLs
              </div>
            </div>
          </div>
        ) : athletes.length > 0 ? (
          <div className="flex-1 min-h-0" style={{ height: "100%" }}>
            <TrackingMap
              athletes={athletes}
              mapCenter={mapCenter || [40.7128, -74.0060]} // Default to NYC coordinates
              isClient={isClient}
              calculateAthleteStats={calculateAthleteStats}
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-lg">No athletes loaded</div>
              <div className="text-sm mt-2">
                Add some Garmin LiveTrack or Strava Beacon URLs to get started
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
