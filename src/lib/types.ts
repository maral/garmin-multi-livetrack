// Shared type definitions for the multi-track application
import type { GarminCoordinate, GarminCoursePoint } from "@/lib/garmin-api";
import type {
  TrackingIdentifier,
  TrackingType,
} from "@/lib/tracking/types";

export interface AthleteStats {
  totalDistance: number;
  totalTime: number;
  avgSpeed: number;
  maxSpeed: number;
  elevationGain: number;
  elevationLoss: number;
  minAltitude: number;
  maxAltitude: number;
  avgHeartRate: number;
  maxHeartRate: number;
  activityType: string;
}

export interface AthleteData {
  id: string;
  provider: TrackingType;
  profile: { name: string; location: string };
  coordinates: GarminCoordinate[]; // Still using Garmin format for backward compatibility
  coursePoints?: GarminCoursePoint[];
  lastUpdate: string;
  color: string;
  originalUrl: string;
  error?: string;
  isLoading?: boolean;
  // Store tracking identifier for updates
  identifier?: TrackingIdentifier;
}

// Component props interfaces
export interface AthletesSummaryProps {
  athletes: AthleteData[];
  onAthleteClick: (athlete: AthleteData) => void;
  calculateAthleteStats: (athlete: AthleteData) => AthleteStats | null;
  isLoading?: boolean;
}

export interface TrackingMapProps {
  athletes: AthleteData[];
  mapCenter: [number, number];
  isClient: boolean;
  calculateAthleteStats: (athlete: AthleteData) => AthleteStats | null;
}

export interface AthleteStatsModalProps {
  athlete: AthleteData | null;
  stats: AthleteStats | null;
  isOpen: boolean;
  onClose: () => void;
}
