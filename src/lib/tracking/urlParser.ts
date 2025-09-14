import type { TrackingIdentifier, ParsedUrl } from './types';
import { providers, getSupportedProviders } from './providers/index';

/**
 * Parse a URL and return a tracking identifier
 */
export function parseTrackingUrl(url: string): ParsedUrl {
    const result: ParsedUrl = {
        originalUrl: url,
        identifier: null,
        success: false
    };

    try {
        // Try each provider until one succeeds
        for (const providerType of getSupportedProviders()) {
            const provider = providers[providerType];
            
            if (provider.isValidUrl(url)) {
                const data = provider.parseUrl(url);
                if (data) {
                    result.identifier = {
                        type: providerType,
                        data
                    } as TrackingIdentifier;
                    result.success = true;
                    return result;
                }
            }
        }

        // No provider could parse the URL
        result.error = {
            code: "INVALID_URL",
            message: "URL is not a valid tracking URL from any supported provider",
            details: { url, supportedProviders: getSupportedProviders() }
        };
    } catch (error) {
        result.error = {
            code: "UNKNOWN",
            message: error instanceof Error ? error.message : "Unknown error parsing URL",
            details: error
        };
    }

    return result;
}

/**
 * Parse multiple URLs in batch
 */
export function parseTrackingUrls(urls: string[]): ParsedUrl[] {
    return urls.map(url => parseTrackingUrl(url));
}

/**
 * Group tracking identifiers by provider type
 */
export function groupIdentifiersByProvider(identifiers: TrackingIdentifier[]): Record<string, TrackingIdentifier[]> {
    const groups: Record<string, TrackingIdentifier[]> = {};
    
    for (const identifier of identifiers) {
        if (!groups[identifier.type]) {
            groups[identifier.type] = [];
        }
        groups[identifier.type].push(identifier);
    }
    
    return groups;
}
