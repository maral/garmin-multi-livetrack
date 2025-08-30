"use client";

import { useState, useEffect } from "react";
import { initializeLeafletIcons } from "@/lib/leafletIcons";
import { calculateAthleteStats } from "@/lib/athleteUtils";
import { useAthleteManagement } from "@/hooks/useAthleteManagement";
import { useLiveTracking } from "@/hooks/useLiveTracking";
import { useEditingState } from "@/hooks/useEditingState";
import { useAthleteModal } from "@/hooks/useAthleteModal";
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

  // Custom hooks for state management
  const { athletes, isLoading, mapCenter, updateAllAthletes, processUrls } =
    useAthleteManagement();

  const {
    urls,
    setUrls,
    isEditing,
    startEditing,
    cancelEditing,
    resetForm,
    completeEditing,
    saveOriginalUrls,
  } = useEditingState(initialUrls);

  const {
    isLive,
    setIsLive,
    liveInterval,
    setLiveInterval,
    toggleLiveTracking,
  } = useLiveTracking(athletes, updateAllAthletes);

  const {
    selectedAthlete,
    isStatsModalOpen,
    handleAthleteClick,
    handleStatsModalClose,
  } = useAthleteModal();

  // Process URLs handler
  const handleProcessUrls = async () => {
    await processUrls(urls);
    saveOriginalUrls(urls);
    setIsLive(true);
    // Exit editing mode after successfully processing URLs
    if (isEditing) {
      completeEditing();
    }
  };

  // Enhanced editing handlers
  const handleStartEditing = () => {
    startEditing();
    setIsLive(false);
  };

  const handleCancelEditing = () => {
    cancelEditing();
    if (athletes.length > 0) {
      setIsLive(true);
    }
  };

  const handleResetForm = () => {
    resetForm();
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
        onCancel={isEditing ? handleCancelEditing : undefined}
        onClearAll={isEditing ? handleResetForm : undefined}
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
          isLive={isLive}
          toggleLiveTracking={toggleLiveTracking}
          onSettingsClick={handleStartEditing}
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
                Processing Garmin LiveTrack URLs
              </div>
            </div>
          </div>
        ) : athletes.length > 0 ? (
          <div className="flex-1 min-h-0" style={{ height: "100%" }}>
            <TrackingMap
              athletes={athletes}
              mapCenter={mapCenter}
              isClient={isClient}
              calculateAthleteStats={calculateAthleteStats}
            />
          </div>
        ) : (
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
