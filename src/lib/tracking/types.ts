// =============================================================================
// UNIFIED TRACKING TYPES
// =============================================================================

export type TrackingProvider = "garmin" | "strava";

/**
 * Unified error codes
 */
export type UnifiedErrorCode =
    | "INVALID_URL"
    | "PROVIDER_ERROR"
    | "NETWORK_ERROR"
    | "RATE_LIMITED"
    | "UNKNOWN";

/**
 * Unified error structure
 */
export interface UnifiedError {
    code: UnifiedErrorCode;
    message: string;
    provider?: TrackingProvider;
    details?: unknown;
}

/**
 * Provider-specific data after URL parsing
 */
export interface ProviderSpecificData {
    // Garmin
    sessionId?: string;
    token?: string;
    // Strava
    beaconId?: string;
}

/**
 * Provider-specific data after URL parsing
 */
export interface ParsedProviderData {
    originalUrl: string;
    provider: TrackingProvider | null; // null if invalid/unsupported
    success: boolean;
    data?: ProviderSpecificData;
    error?: UnifiedError;
}

/**
 * Minimal coordinate data for frontend
 */
export interface UnifiedCoordinate {
    lat: number;
    lon: number;
    timestamp: string; // ISO timestamp
    altitude?: number; // meters
    speed?: number; // m/s
}

/**
 * Activity stats (when available)
 */
export interface UnifiedStats {
    distance?: number; // meters
    movingTime?: number; // seconds
    elapsedTime?: number; // seconds
    averageSpeed?: number; // meters per second
}

/**
 * Unified tracking data for frontend
 */
export interface UnifiedTrackingData {
    // Essential identification
    id: string; // URL or unique identifier
    provider: TrackingProvider;

    // Athlete info
    athleteName: string;
    activityType?: string; // "Run", "Ride", "Hike", etc.

    // GPS data (core functionality)
    coordinates: UnifiedCoordinate[];

    // Activity stats (if available)
    stats?: UnifiedStats;

    // Metadata
    lastUpdate: string; // ISO timestamp
    batteryLevel?: number; // 0-100 percentage
}

/**
 * Standard response format for all unified APIs
 */
export interface UnifiedResponse<T> {
    success: boolean;
    results: Array<{
        id: string;
        success: boolean;
        data?: T;
        error?: UnifiedError;
    }>;
}

/**
 * API response wrapper for tracking operations
 */
export interface TrackingApiResponse {
    originalUrl: string;
    provider: TrackingProvider | null;
    success: boolean;
    data?: UnifiedTrackingData;
    error?: UnifiedError;
}

/**
 * API response for tracking updates (coordinates only)
 */
export interface TrackingUpdatesResponse {
    originalUrl: string;
    provider: TrackingProvider | null;
    success: boolean;
    coordinates: UnifiedCoordinate[];
    error?: UnifiedError;
}

/**
 * Provider data for tracking requests
 */
export interface ProviderRequest {
    id: string; // unique identifier for this request
    provider: TrackingProvider;
    data: {
        // Garmin
        sessionId?: string;
        token?: string;
        // Strava
        beaconId?: string;
    };
    begin?: string; // for updates only
}
