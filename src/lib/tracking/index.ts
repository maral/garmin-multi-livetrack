/**
 * Unified Tracking API
 * 
 * This module provides a unified interface for working with multiple
 * live tracking providers (Garmin LiveTrack and Strava Beacon).
 * 
 * Key Features:
 * - Provider detection from URLs
 * - URL expansion (handles short URLs like gar.mn)
 * - Unified data format across providers
 * - Batch processing for multiple athletes
 * - Real-time updates
 * 
 * Usage:
 * ```typescript
 * import { processTrackingUrls } from '@/lib/tracking';
 * 
 * const urls = [
 *   'https://livetrack.garmin.com/session/...',
 *   'https://www.strava.com/activities/.../beacon/...'
 * ];
 * 
 * const results = await processTrackingUrls(urls);
 * ```
 */

// Core types
export type {
  TrackingProvider,
  UnifiedError,
  UnifiedErrorCode,
  UnifiedCoordinate,
  UnifiedStats,
  UnifiedTrackingData,
  ParsedProviderData,
  ProviderSpecificData,
  TrackingApiResponse,
  TrackingUpdatesResponse,
  UnifiedResponse,
  ProviderRequest
} from './types';

// Provider detection and URL processing
export {
  detectProvider,
  parseProviderUrl,
  expandUrl,
  processUrl
} from './providers';

// Data converters
export {
  convertGarminToUnified,
  convertStravaToUnified
} from './converters';

// Client-side utilities
export {
  processTrackingUrls,
  fetchTrackingUpdates,
  exampleUsage
} from './client';

/**
 * API Endpoints:
 * 
 * POST /api/tracking/expand-url-batch
 * - Expands and parses multiple URLs
 * - Input: { urls: string[] }
 * - Output: { results: ParsedProviderData[] }
 * 
 * POST /api/tracking/fetch-batch
 * - Fetches tracking data for parsed URLs
 * - Input: { parsedUrls: ParsedProviderData[] }
 * - Output: { results: TrackingApiResponse[] }
 * 
 * POST /api/tracking/fetch-updates-batch
 * - Fetches coordinate updates for existing sessions
 * - Input: { parsedUrls: ParsedProviderData[], begin?: string }
 * - Output: { results: TrackingUpdatesResponse[] }
 */
