"use client";

import React from "react";
import dynamic from "next/dynamic";
import { createCustomIcon } from "@/lib/leafletIcons";
import type { AthleteData, AthleteStats } from "@/lib/types";
import {
  formatAltitude,
  formatDistance,
  formatElevation,
  formatHeartRate,
  formatPace,
  formatTime,
} from "@/lib/athleteUtils";

// Dynamic imports for SSR compatibility
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});
const Tooltip = dynamic(
  () => import("react-leaflet").then((mod) => mod.Tooltip),
  { ssr: false }
);

interface AthleteMarkerProps {
  athlete: AthleteData;
  calculateAthleteStats: (athlete: AthleteData) => AthleteStats | null;
}

export default function AthleteMarker({
  athlete,
  calculateAthleteStats,
}: AthleteMarkerProps) {
  if (athlete.error || athlete.coordinates.length === 0) return null;

  const latestPosition = athlete.coordinates[athlete.coordinates.length - 1];
  const customIcon = createCustomIcon(athlete.color);
  const stats = calculateAthleteStats(athlete);

  return (
    <Marker
      position={[latestPosition.lat, latestPosition.lon]}
      icon={customIcon || undefined}
    >
      <Tooltip
        direction="top"
        offset={[0, -10]}
        opacity={0.9}
        permanent={true}
        interactive={false}
        className="athlete-name-tooltip"
      >
        {athlete.profile.name}
      </Tooltip>
      <Popup>
        <div className="min-w-48">
          <div className="font-bold text-base mb-1">{athlete.profile.name}</div>
          {athlete.profile.location && (
            <div className="text-sm text-gray-600 mb-2">
              {athlete.profile.location}
            </div>
          )}

          {stats && (
            <div className="space-y-1 text-xs">
              <div>
                <strong>Distance:</strong> {formatDistance(stats.totalDistance)}
              </div>

              <div>
                <strong>Duration:</strong> {formatTime(stats.totalTime)}
              </div>

              {stats.avgPace && (
                <div>
                  <strong>Pace:</strong> {formatPace(stats.avgPace)}
                </div>
              )}

              {latestPosition.altitude && (
                <div>
                  <strong>Altitude:</strong>{" "}
                  {formatAltitude(latestPosition.altitude)}
                </div>
              )}

              {stats.elevationGain > 0 && (
                <div>
                  <strong>Elevation:</strong> ↗
                  {formatElevation(stats.elevationGain)} ↘
                  {formatElevation(stats.elevationLoss)}
                </div>
              )}

              {stats.avgHeartRate > 0 && (
                <div>
                  <strong>Avg Heart Rate:</strong>{" "}
                  {formatHeartRate(stats.avgHeartRate)}
                </div>
              )}
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}
