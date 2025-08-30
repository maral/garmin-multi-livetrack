"use client";

import { MapPin, TrendingUp } from "lucide-react";
import { Button } from "./ui/button";
import type { AthletesSummaryProps } from "@/lib/types";

// Helper functions for formatting
const formatDistanceShort = (meters: number): string => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
};

const formatElevationShort = (meters: number): string => {
  return `${Math.round(meters)} m`;
};

export default function AthletesSummary({
  athletes,
  onAthleteClick,
  calculateAthleteStats,
  isLoading = false,
}: AthletesSummaryProps) {
  // Sort athletes by race position (descending order - leader first in summary)
  const sortedAthletes = [...athletes].sort((a, b) => {
    const statsA = calculateAthleteStats(a);
    const statsB = calculateAthleteStats(b);

    // If either athlete has no stats, put them at the end
    if (!statsA && !statsB) return 0;
    if (!statsA) return 1;
    if (!statsB) return -1;

    // Sort by distance (descending - leader with most distance first)
    return statsB.totalDistance - statsA.totalDistance;
  });

  return (
    <div className="px-4 sm:px-6 py-3 border-b bg-gray-50">
      {sortedAthletes.length === 0 ? (
        <div className="text-center text-gray-500 text-sm">
          {isLoading
            ? "Loading athletes..."
            : "No athletes loaded. Add some Garmin LiveTrack URLs to get started."}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {sortedAthletes.map((athlete, index) => {
            const stats = calculateAthleteStats(athlete);

            return (
              <Button
                key={athlete.id}
                variant="outline"
                size="sm"
                className="h-auto p-2 gap-2 bg-white hover:bg-gray-100"
                onClick={() => onAthleteClick(athlete)}
              >
                {/* Position badge */}
                {stats && !athlete.error && (
                  <span className="text-xs font-bold bg-gray-100 text-gray-700 rounded-full w-5 h-5 flex items-center justify-center">
                    {index + 1}
                  </span>
                )}

                {/* Name and stats */}
                <div className="flex flex-col items-start text-left gap-0.5">
                  <div className="flex flex-row items-center gap-1">
                    {/* Color indicator */}
                    <div
                      className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: athlete.color }}
                    />
                    <span className="font-medium text-sm">
                      {athlete.error ? "Error" : athlete.profile.name}
                    </span>
                  </div>

                  {stats && !athlete.error && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {formatDistanceShort(stats.totalDistance)}
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {formatElevationShort(stats.elevationGain)}
                      </div>
                    </div>
                  )}

                  {athlete.error && (
                    <span
                      className="text-xs text-red-500"
                      title={athlete.error}
                    >
                      Error loading data
                    </span>
                  )}
                </div>
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
