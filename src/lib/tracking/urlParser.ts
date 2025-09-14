import type { TrackingIdentifier, ParsedUrl } from './types';
import { providers, getSupportedProviders } from './providers/index';

/**
 * Parse a URL and return a tracking identifier (with async URL expansion support)
 */
export async function parseTrackingUrlAsync(url: string): Promise<ParsedUrl> {
    const result: ParsedUrl = {
        originalUrl: url,
        identifier: null,
        success: false
    };

    try {
        // First, try to expand the URL if it's a short URL
        let expandedUrl = url;
        
        // Check if it's a gar.mn URL that needs expansion
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname === "gar.mn") {
                const response = await fetch(url, { 
                    method: 'HEAD', 
                    redirect: 'manual' 
                });
                
                const location = response.headers.get('location');
                if (location) {
                    expandedUrl = location;
                }
            }
        } catch (expandError) {
            console.error('Error expanding URL:', expandError);
            // Continue with original URL if expansion fails
        }
        
        // Try each provider until one succeeds
        for (const providerType of getSupportedProviders()) {
            const provider = providers[providerType];
            
            if (provider.isValidUrl(expandedUrl)) {
                const data = provider.parseUrl(expandedUrl);
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
            details: { url, expandedUrl, supportedProviders: getSupportedProviders() }
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
 * Parse a URL and return a tracking identifier (synchronous version)
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
 * Parse multiple URLs in batch (async version with URL expansion)
 */
export async function parseTrackingUrlsAsync(urls: string[]): Promise<ParsedUrl[]> {
    const results = await Promise.allSettled(
        urls.map(url => parseTrackingUrlAsync(url))
    );
    
    return results.map((result, index) => {
        if (result.status === 'fulfilled') {
            return result.value;
        } else {
            return {
                originalUrl: urls[index],
                identifier: null,
                success: false,
                error: {
                    code: "UNKNOWN",
                    message: result.reason instanceof Error ? result.reason.message : "Unknown error",
                    details: result.reason
                }
            };
        }
    });
}

/**
 * Parse multiple URLs in batch (synchronous version)
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
