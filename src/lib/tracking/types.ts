// =============================================================================
// UNIFIED TRACKING TYPES
// =============================================================================

/**
 * Supported tracking provider types
 */
export type TrackingType = TrackingIdentifier["type"];

/**
 * Type-safe tracking identifier that abstracts provider-specific data
 */
export type TrackingIdentifier =
    | {
        type: "strava";
        data: {
            beaconId: string;
        };
    }
    | {
        type: "garmin";
        data: {
            sessionId: string;
            token: string;
        };
    };

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
    provider?: TrackingType;
    details?: unknown;
}

/**
 * URL parsing result
 */
export interface ParsedUrl {
    originalUrl: string;
    identifier: TrackingIdentifier | null;
    success: boolean;
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
    identifier: TrackingIdentifier;

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
 * API response wrapper for tracking operations
 */
export interface TrackingApiResponse {
    originalUrl: string;
    identifier: TrackingIdentifier | null;
    success: boolean;
    data?: UnifiedTrackingData;
    error?: UnifiedError;
}

/**
 * API response for tracking updates (coordinates only)
 */
export interface TrackingUpdatesResponse {
    originalUrl: string;
    identifier: TrackingIdentifier | null;
    success: boolean;
    coordinates: UnifiedCoordinate[];
    error?: UnifiedError;
}

// =============================================================================
// PROVIDER INTERFACE
// =============================================================================

/**
 * Provider interface that each tracking provider must implement
 */
export interface TrackingProvider {
    // Parse URL and extract provider-specific data
    parseUrl(url: string): TrackingIdentifier["data"] | null;

    // Validate if URL is supported by this provider
    isValidUrl(url: string): boolean;

    // Fetch complete tracking data for multiple identifiers
    fetchTrackingData(
        identifiers: TrackingIdentifier["data"][],
        begin?: string,
    ): Promise<UnifiedTrackingData[]>;

    // Fetch only new coordinates since timestamp for multiple identifiers
    fetchTrackingUpdates(
        identifiers: TrackingIdentifier["data"][],
        begin: Date,
    ): Promise<{ id: string; coordinates: UnifiedCoordinate[] }[]>;
}

// =============================================================================
// API REQUEST/RESPONSE TYPES
// =============================================================================

/**
 * Request to expand URLs into tracking identifiers
 */
export interface ExpandUrlsRequest {
    urls: string[];
}

/**
 * Response from URL expansion
 */
export interface ExpandUrlsResponse {
    results: ParsedUrl[];
}

/**
 * Request to fetch tracking data
 */
export interface FetchDataRequest {
    identifiers: TrackingIdentifier[];
    begin?: string;
}

/**
 * Response from tracking data fetch
 */
export interface FetchDataResponse {
    results: UnifiedTrackingData[];
}

/**
 * Request to fetch tracking updates
 */
export interface FetchUpdatesRequest {
    identifiers: TrackingIdentifier[];
    begin: string;
}

/**
 * Response from tracking updates fetch
 */
export interface FetchUpdatesResponse {
    results: { id: string; coordinates: UnifiedCoordinate[] }[];
}
