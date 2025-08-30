"use client";

import React from "react";
import dynamic from "next/dynamic";
import { createCustomIcon } from "@/lib/leafletIcons";
import type { TrackingMapProps } from "@/lib/types";

// Dynamic import of MapContainer to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
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
const Polyline = dynamic(
  () => import("react-leaflet").then((mod) => mod.Polyline),
  { ssr: false }
);

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
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

const formatSpeed = (mps: number): string => {
  const kmh = mps * 3.6;
  return `${kmh.toFixed(1)} km/h`;
};

const formatElevation = (meters: number): string => {
  return `${Math.round(meters)} m`;
};

export default function TrackingMap({
  athletes,
  mapCenter,
  isClient,
  calculateAthleteStats,
}: TrackingMapProps) {
  // Initialize leaflet icons when component mounts
  React.useEffect(() => {
    if (isClient) {
      // Component mounted on client
    }
  }, [isClient]);

  // Calculate bounds for fitting all athletes with padding
  const getMapBounds = () => {
    const validAthletes = athletes.filter(
      (athlete) =>
        !athlete.error && athlete.coordinates && athlete.coordinates.length > 0
    );

    if (validAthletes.length === 0) {
      return null;
    }

    // Get all current positions
    const positions = validAthletes.map((athlete) => {
      const latest = athlete.coordinates[athlete.coordinates.length - 1];
      return [latest.position.lat, latest.position.lon] as [number, number];
    });

    if (positions.length === 1) {
      // Single athlete - create a small bounds around them
      const lat = positions[0][0];
      const lng = positions[0][1];
      const offset = 0.005; // Small offset for single athlete
      return [
        [lat - offset, lng - offset],
        [lat + offset, lng + offset],
      ] as [[number, number], [number, number]];
    }

    // Multiple athletes - calculate bounds
    const lats = positions.map((p) => p[0]);
    const lngs = positions.map((p) => p[1]);

    return [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ] as [[number, number], [number, number]];
  };

  const bounds = getMapBounds();

  // Fallback viewport for when there are no bounds
  const fallbackViewport = { center: mapCenter, zoom: 13 };

  // Sort athletes by total distance (ascending order, so leader renders last and appears on top)
  const sortedAthletes = [...athletes].sort((a, b) => {
    const statsA = calculateAthleteStats(a);
    const statsB = calculateAthleteStats(b);

    // If either athlete has no stats, put them at the beginning (render first)
    if (!statsA && !statsB) return 0;
    if (!statsA) return -1;
    if (!statsB) return 1;

    // Sort by distance (ascending - smallest distance first, leader last)
    return statsA.totalDistance - statsB.totalDistance;
  });

  return (
    <>
      {!isClient && (
        <div className="h-full flex items-center justify-center bg-gray-100">
          <div className="text-gray-500">Loading map...</div>
        </div>
      )}
      {isClient && typeof window !== "undefined" && (
        <MapContainer
          {...(bounds
            ? {
                bounds: bounds,
                boundsOptions: {
                  padding: [20, 20],
                  maxZoom: 16,
                },
              }
            : {
                center: fallbackViewport.center,
                zoom: fallbackViewport.zoom,
              })}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* Remove the MapBoundsHandler since we're calculating viewport directly */}

          {/* First render all planned routes (bottom layer) */}
          {sortedAthletes.map((athlete) => {
            if (athlete.error || athlete.coordinates.length === 0) return null;

            const courseCoordinates =
              athlete.coursePoints?.map(
                (point) =>
                  [point.position.lat, point.position.lon] as [number, number]
              ) || [];

            return (
              <div key={`course-${athlete.id}`}>
                {/* Planned route (course) line */}
                {courseCoordinates.length > 1 && (
                  <Polyline
                    positions={courseCoordinates}
                    color="#bd6bcc"
                    weight={2}
                    opacity={1}
                  />
                )}
              </div>
            );
          })}

          {/* Then render all actual routes (reverse order so leader's line is on top) */}
          {sortedAthletes
            .slice()
            .reverse()
            .map((athlete) => {
              if (athlete.error || athlete.coordinates.length === 0)
                return null;

              const routeCoordinates = athlete.coordinates.map(
                (coord) =>
                  [coord.position.lat, coord.position.lon] as [number, number]
              );

              return (
                <div key={`routes-${athlete.id}`}>
                  {/* Actual route line */}
                  {routeCoordinates.length > 1 && (
                    <Polyline
                      positions={routeCoordinates}
                      color={athlete.color}
                      weight={3}
                      opacity={1}
                    />
                  )}
                </div>
              );
            })}

          {/* Finally render all markers (normal order so leader's marker is on top) */}
          {sortedAthletes.map((athlete) => {
            if (athlete.error || athlete.coordinates.length === 0) return null;

            const latestPosition =
              athlete.coordinates[athlete.coordinates.length - 1];

            return (
              <div key={`markers-${athlete.id}`}>
                {/* Current position marker */}
                {(() => {
                  const customIcon = createCustomIcon(athlete.color);
                  return (
                    <Marker
                      position={[
                        latestPosition.position.lat,
                        latestPosition.position.lon,
                      ]}
                      icon={customIcon || undefined}
                    >
                      <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
                        {athlete.profile.name}
                      </Tooltip>
                      <Popup>
                        <div className="min-w-48">
                          <div className="font-bold text-base mb-1">
                            {athlete.profile.name}
                          </div>
                          {athlete.profile.location && (
                            <div className="text-sm text-gray-600 mb-2">
                              {athlete.profile.location}
                            </div>
                          )}

                          {(() => {
                            const stats = calculateAthleteStats(athlete);
                            return stats ? (
                              <div className="space-y-1 text-xs">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <strong>Distance:</strong>{" "}
                                    {formatDistance(stats.totalDistance)}
                                  </div>
                                  <div>
                                    <strong>Time:</strong>{" "}
                                    {formatTime(stats.totalTime)}
                                  </div>
                                  <div>
                                    <strong>Speed:</strong>{" "}
                                    {formatSpeed(stats.avgSpeed)}
                                  </div>
                                  <div>
                                    <strong>Max:</strong>{" "}
                                    {formatSpeed(stats.maxSpeed)}
                                  </div>
                                </div>

                                {latestPosition.altitude && (
                                  <div>
                                    <strong>Altitude:</strong>{" "}
                                    {Math.round(latestPosition.altitude)}m
                                  </div>
                                )}

                                {stats.elevationGain > 0 && (
                                  <div>
                                    <strong>Elevation:</strong> ↗
                                    {formatElevation(stats.elevationGain)} ↘
                                    {formatElevation(stats.elevationLoss)}
                                  </div>
                                )}

                                {latestPosition.fitnessData
                                  ?.heartRateBeatsPerMin && (
                                  <div>
                                    <strong>Heart Rate:</strong>{" "}
                                    {
                                      latestPosition.fitnessData
                                        .heartRateBeatsPerMin
                                    }{" "}
                                    bpm (avg: {Math.round(stats.avgHeartRate)})
                                  </div>
                                )}

                                <div className="mt-2 pt-1 border-t">
                                  <div>
                                    <strong>Activity:</strong>{" "}
                                    {stats.activityType}
                                  </div>
                                  <div>
                                    <strong>Points:</strong>{" "}
                                    {athlete.coordinates.length} tracked,{" "}
                                    {athlete.coursePoints?.length || 0} planned
                                  </div>
                                  <div className="text-gray-500">
                                    Last:{" "}
                                    {new Date(
                                      athlete.lastUpdate
                                    ).toLocaleTimeString()}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500">
                                Route: {athlete.coordinates.length} points
                                <br />
                                Last update:{" "}
                                {new Date(
                                  athlete.lastUpdate
                                ).toLocaleTimeString()}
                              </div>
                            );
                          })()}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })()}
              </div>
            );
          })}
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
