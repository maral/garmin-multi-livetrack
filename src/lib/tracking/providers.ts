import { 
  TrackingProvider, 
  ParsedProviderData
} from './types';
import { 
  isValidGarminUrl, 
  parseGarminUrl 
} from '../garmin-api';
import { 
  isValidStravaUrl, 
  parseStravaUrl 
} from '../strava-api';

/**
 * Detect provider from URL
 */
export function detectProvider(url: string): TrackingProvider | null {
  if (isValidGarminUrl(url)) {
    return 'garmin';
  }
  if (isValidStravaUrl(url)) {
    return 'strava';
  }
  return null;
}

/**
 * Parse URL and extract provider-specific data
 */
export function parseProviderUrl(url: string): ParsedProviderData {
  const provider = detectProvider(url);
  
  if (!provider) {
    return {
      originalUrl: url,
      provider: null,
      success: false,
      error: {
        code: 'INVALID_URL',
        message: 'Unsupported tracking URL format'
      }
    };
  }

  try {
    if (provider === 'garmin') {
      const parsed = parseGarminUrl(url);
      if (!parsed) {
        throw new Error('Failed to parse Garmin URL');
      }
      return {
        originalUrl: url,
        provider,
        success: true,
        data: {
          sessionId: parsed.sessionId,
          token: parsed.token
        }
      };
    }

    if (provider === 'strava') {
      const parsed = parseStravaUrl(url);
      if (!parsed) {
        throw new Error('Failed to parse Strava URL');
      }
      return {
        originalUrl: url,
        provider,
        success: true,
        data: {
          beaconId: parsed.beaconId
        }
      };
    }

    // This shouldn't happen given the provider detection above
    return {
      originalUrl: url,
      provider: null,
      success: false,
      error: {
        code: 'PROVIDER_ERROR',
        message: 'Unsupported provider'
      }
    };
  } catch (error) {
    return {
      originalUrl: url,
      provider,
      success: false,
      error: {
        code: 'PROVIDER_ERROR',
        message: error instanceof Error ? error.message : 'Unknown parsing error',
        provider
      }
    };
  }
}

/**
 * Expand URL if needed (for short URLs like gar.mn)
 */
export async function expandUrl(url: string): Promise<string> {
  try {
    // Only expand URLs that look like they might be shortened
    if (url.includes('gar.mn') || url.length < 50) {
      const response = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
      });
      return response.url;
    }
    return url;
  } catch {
    // If expansion fails, return original URL
    return url;
  }
}

/**
 * Process URL: expand if needed, then parse provider data
 */
export async function processUrl(url: string): Promise<ParsedProviderData> {
  try {
    // First try to expand the URL
    const expandedUrl = await expandUrl(url);
    
    // Then parse the provider data
    const result = parseProviderUrl(expandedUrl);
    
    // Keep original URL in response
    return {
      ...result,
      originalUrl: url
    };
    
  } catch (error) {
    return {
      originalUrl: url,
      provider: null,
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to process URL'
      }
    };
  }
}
