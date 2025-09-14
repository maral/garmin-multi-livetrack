import type { TrackingType, TrackingProvider } from '../types';
import { stravaProvider } from './strava';
import { garminProvider } from './garmin';

/**
 * Registry of all tracking providers
 */
export const providers: Record<TrackingType, TrackingProvider> = {
    strava: stravaProvider,
    garmin: garminProvider
};

/**
 * Get provider by tracking type
 */
export function getProvider(type: TrackingType): TrackingProvider {
    const provider = providers[type];
    if (!provider) {
        throw new Error(`Unknown tracking provider: ${type}`);
    }
    return provider;
}

/**
 * Get all supported provider types
 */
export function getSupportedProviders(): TrackingType[] {
    return Object.keys(providers) as TrackingType[];
}

/**
 * Check if a provider type is supported
 */
export function isProviderSupported(type: string): type is TrackingType {
    return type in providers;
}
