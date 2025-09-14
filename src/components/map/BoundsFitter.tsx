"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import { calculateAthleteBounds } from "@/lib/mapUtils";
import type { AthleteData } from "@/lib/types";

interface BoundsFitterProps {
  athletes: AthleteData[];
}

/**
 * Component to handle automatic map bounds fitting when athletes are loaded.
 * Only fits bounds when the count of valid athletes increases (new athletes added),
 * not during live coordinate updates to preserve user's current view.
 */
export default function BoundsFitter({ athletes }: BoundsFitterProps) {
  const map = useMap();
  const previousValidCountRef = useRef(0);

  // Extract the complex expression to a separate variable for static checking
  const athleteLoadingState = athletes
    .map((a) => (a.coordinates.length > 0 ? "loaded" : "empty"))
    .join(",");

  useEffect(() => {
    if (!map) return;

    const validAthletes = athletes.filter(
      (athlete) => !athlete.error && athlete.coordinates.length > 0
    );

    const currentValidCount = validAthletes.length;

    // Only fit bounds if:
    // 1. We have valid athletes, AND
    // 2. The count of valid athletes increased (new athletes loaded or added)
    const shouldFitBounds =
      currentValidCount > 0 &&
      currentValidCount > previousValidCountRef.current;

    if (shouldFitBounds) {
      const bounds = calculateAthleteBounds(validAthletes);
      if (bounds) {
        try {
          map.fitBounds(bounds, {
            padding: [20, 20], // 20px padding around edges
            maxZoom: 15, // Don't zoom too close
          });
        } catch (error) {
          console.warn("Failed to fit bounds:", error);
        }
      }
    }

    // Update the previous count
    previousValidCountRef.current = currentValidCount;
  }, [
    map,
    athletes,
    athleteLoadingState, // Use the extracted variable
  ]);

  return null; // This component doesn't render anything
}
