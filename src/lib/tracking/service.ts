import type { 
    UnifiedTrackingData, 
    UnifiedCoordinate,
    TrackingType,
    ExpandUrlsRequest,
    ExpandUrlsResponse,
    FetchDataRequest,
    FetchDataResponse,
    FetchUpdatesRequest,
    FetchUpdatesResponse
} from './types';
import { parseTrackingUrls, groupIdentifiersByProvider } from './urlParser';
import { getProvider } from './providers/index';

/**
 * Expand URLs into tracking identifiers
 */
export async function expandUrls(request: ExpandUrlsRequest): Promise<ExpandUrlsResponse> {
    const results = parseTrackingUrls(request.urls);
    return { results };
}

/**
 * Fetch tracking data for multiple identifiers
 */
export async function fetchTrackingData(request: FetchDataRequest): Promise<FetchDataResponse> {
    const results: UnifiedTrackingData[] = [];
    
    // Group identifiers by provider to make batch calls
    const groups = groupIdentifiersByProvider(request.identifiers);
    
    // Process each provider group
    const providerPromises = Object.entries(groups).map(async ([providerType, identifiers]) => {
        try {
            const provider = getProvider(providerType as TrackingType);
            const data = identifiers.map(id => id.data);
            return await provider.fetchTrackingData(data, request.begin);
        } catch (error) {
            console.error(`Error fetching data from ${providerType}:`, error);
            return [];
        }
    });
    
    // Wait for all provider requests to complete
    const providerResults = await Promise.allSettled(providerPromises);
    
    // Collect all successful results
    providerResults.forEach(result => {
        if (result.status === 'fulfilled') {
            results.push(...result.value);
        }
    });
    
    return { results };
}

/**
 * Fetch tracking updates (coordinates only) for multiple identifiers
 */
export async function fetchTrackingUpdates(request: FetchUpdatesRequest): Promise<FetchUpdatesResponse> {
    const results: { id: string; coordinates: UnifiedCoordinate[] }[] = [];
    
    // Group identifiers by provider to make batch calls
    const groups = groupIdentifiersByProvider(request.identifiers);
    
    // Process each provider group
    const providerPromises = Object.entries(groups).map(async ([providerType, identifiers]) => {
        try {
            const provider = getProvider(providerType as TrackingType);
            const data = identifiers.map(id => id.data);
            return await provider.fetchTrackingUpdates(data, request.begin);
        } catch (error) {
            console.error(`Error fetching updates from ${providerType}:`, error);
            return [];
        }
    });
    
    // Wait for all provider requests to complete
    const providerResults = await Promise.allSettled(providerPromises);
    
    // Collect all successful results
    providerResults.forEach(result => {
        if (result.status === 'fulfilled') {
            results.push(...result.value);
        }
    });
    
    return { results };
}
