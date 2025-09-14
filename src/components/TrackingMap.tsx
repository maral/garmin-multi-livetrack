"use client";

import React from "react";
import dynamic from "next/dynamic";
import type { TrackingMapProps } from "@/lib/types";
import AthleteMarker from "./map/AthleteMarker";
import AthleteRoute from "./map/AthleteRoute";
import MarkerClusterWrapper from "./map/MarkerClusterWrapper";
import BoundsFitter from "./map/BoundsFitter";

// Dynamic import of MapContainer to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);

export default function TrackingMap({
  athletes,
  mapCenter,
  isClient,
  calculateAthleteStats,
}: TrackingMapProps) {
  if (!isClient || typeof window === "undefined") {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading map...</div>
      </div>
    );
  }

  const validAthletes = athletes.filter(
    (athlete) => !athlete.error && athlete.coordinates.length > 0
  );

  // Sort athletes by distance (leader first for routes, normal order for markers)
  const sortedAthletes = [...validAthletes].sort((a, b) => {
    const aStats = calculateAthleteStats(a);
    const bStats = calculateAthleteStats(b);
    if (!aStats || !bStats) return 0;
    return bStats.totalDistance - aStats.totalDistance;
  });

  return (
    <>
      {isClient && typeof window !== "undefined" && (
        <MapContainer
          center={mapCenter}
          zoom={13}
          className="h-full w-full"
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* Component to handle bounds fitting */}
          <BoundsFitter
            athletes={athletes}
            calculateAthleteStats={calculateAthleteStats}
          />

          {/* Render routes first (leader's route on top) */}
          {sortedAthletes.map((athlete) => (
            <AthleteRoute key={`route-${athlete.id}`} athlete={athlete} />
          ))}

          {/* Render markers with clustering */}
          <MarkerClusterWrapper>
            {sortedAthletes.map((athlete) => (
              <AthleteMarker
                key={`marker-${athlete.id}`}
                athlete={athlete}
                calculateAthleteStats={calculateAthleteStats}
              />
            ))}
          </MarkerClusterWrapper>
        </MapContainer>
      )}
      {isClient && typeof window !== "undefined" && athletes.length === 0 && (
        <div className="h-full flex items-center justify-center bg-gray-50">
          <div className="text-gray-500">No athletes to display on map</div>
        </div>
      )}
    </>
  );
}
