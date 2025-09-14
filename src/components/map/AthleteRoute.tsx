"use client";

import React from "react";
import dynamic from "next/dynamic";
import type { AthleteData } from "@/lib/types";

// Dynamic import for SSR compatibility
const Polyline = dynamic(
  () => import("react-leaflet").then((mod) => mod.Polyline),
  { ssr: false }
);

interface AthleteRouteProps {
  athlete: AthleteData;
}

export default function AthleteRoute({ athlete }: AthleteRouteProps) {
  if (athlete.error || athlete.coordinates.length === 0) return null;

  const polylinePositions = athlete.coordinates.map((coord) => [
    coord.lat,
    coord.lon,
  ]) as [number, number][];

  return (
    <Polyline
      positions={polylinePositions}
      color={athlete.color}
      weight={3}
      opacity={0.7}
    />
  );
}
