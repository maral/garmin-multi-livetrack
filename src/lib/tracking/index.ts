/**
 * Unified Tracking API
 * 
 * This module provides a unified interface for working with multiple
 * live tracking providers (Garmin LiveTrack and Strava Beacon).
 */

// Export all types
export type * from './types';

// Export main service functions
export { expandUrls, fetchTrackingData, fetchTrackingUpdates } from './service';

// Export URL parsing utilities
export { parseTrackingUrl, parseTrackingUrls } from './urlParser';

// Export provider registry
export { getProvider, getSupportedProviders, isProviderSupported } from './providers/index';
