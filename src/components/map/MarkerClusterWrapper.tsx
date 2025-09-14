"use client";

import React from "react";
import dynamic from "next/dynamic";

// Proper type import for the component
interface MarkerClusterGroupProps {
  children?: React.ReactNode;
  showCoverageOnHover?: boolean;
  spiderfyOnMaxZoom?: boolean;
  removeOutsideVisibleBounds?: boolean;
  animate?: boolean;
  maxClusterRadius?: number;
  iconCreateFunction?: (cluster: any) => any;
}

// Dynamic import with proper type handling
const MarkerClusterGroup = dynamic(
  () => import("react-leaflet-markercluster"),
  { 
    ssr: false,
    loading: () => <></> // Return empty fragment while loading
  }
) as React.ComponentType<MarkerClusterGroupProps>;

interface MarkerClusterWrapperProps {
  children: React.ReactNode;
}

export default function MarkerClusterWrapper({ children }: MarkerClusterWrapperProps) {
  return (
    <MarkerClusterGroup
      showCoverageOnHover={false}
      spiderfyOnMaxZoom={true}
      removeOutsideVisibleBounds={true}
      animate={true}
      maxClusterRadius={60}
      iconCreateFunction={(cluster: any) => {
        // This will be available via window.L after leaflet loads
        if (typeof window !== "undefined" && (window as any).L) {
          const L = (window as any).L;
          const count = cluster.getChildCount();
          const size = count < 10 ? 'small' : count < 100 ? 'medium' : 'large';
          
          // Get athlete names from the markers in the cluster
          const markers = cluster.getAllChildMarkers();
          const athleteNames = markers
            .map((marker: any) => {
              // Try to extract athlete name from marker options or popup content
              const popup = marker.getPopup();
              if (popup) {
                const content = popup.getContent();
                if (typeof content === 'string') {
                  // Extract name from popup HTML
                  const match = content.match(/<div class="font-bold[^>]*>([^<]+)<\/div>/);
                  return match ? match[1] : null;
                }
              }
              return null;
            })
            .filter(Boolean)
            .slice(0, 3); // Show max 3 names
          
          const extraCount = Math.max(0, count - 3);
          const tooltipText = athleteNames.length > 0 
            ? `${athleteNames.join(', ')}${extraCount > 0 ? ` +${extraCount} more` : ''}`
            : `${count} athletes`;
          
          return L.divIcon({
            html: `<div title="${tooltipText}"><span>${count}</span></div>`,
            className: `marker-cluster marker-cluster-${size}`,
            iconSize: L.point(40, 40, true),
          });
        }
        return null;
      }}
    >
      {children}
    </MarkerClusterGroup>
  );
}
