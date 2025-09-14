# Unified Tracking API

A comprehensive solution for live tracking data from multiple providers (Garmin LiveTrack and Strava Beacon) with a unified interface.

## Architecture Overview

The unified tracking system follows a clean, layered architecture:

```
Frontend Applications
    ↓
Client Utilities (processTrackingUrls)
    ↓
API Endpoints (/api/tracking/*)
    ↓
Provider Converters (Garmin/Strava → Unified Format)
    ↓
Provider APIs (garmin-api.ts, strava-api.ts)
    ↓
External Services (Garmin GraphQL, Strava Beacon)
```

## Key Features

- **Multi-Provider Support**: Seamlessly works with Garmin LiveTrack and Strava Beacon
- **URL Processing**: Automatic provider detection and URL expansion (gar.mn short URLs)
- **Unified Data Format**: Consistent coordinate and athlete data structure
- **Batch Processing**: Efficient parallel processing of multiple athletes
- **Real-Time Updates**: Coordinate updates for active tracking sessions
- **Error Handling**: Comprehensive error reporting with provider-specific details

## Quick Start

### Basic Usage

```typescript
import { processTrackingUrls } from '@/lib/tracking';

const urls = [
  'https://livetrack.garmin.com/session/abc123/token/xyz789',
  'https://www.strava.com/activities/12345/beacon/beacon-id',
  'https://gar.mn/short-link' // Will be automatically expanded
];

const results = await processTrackingUrls(urls);

for (const result of results) {
  if (result.success && result.data) {
    console.log(`Athlete: ${result.data.athleteName}`);
    console.log(`Provider: ${result.provider}`);
    console.log(`Coordinates: ${result.data.coordinates.length} points`);
  } else {
    console.error(`Failed: ${result.error?.message}`);
  }
}
```

### Updates (Real-Time Tracking)

```typescript
import { fetchTrackingUpdates } from '@/lib/tracking';

// Get initial parsed URLs from processTrackingUrls
const parsedUrls = validResults.map(r => ({
  originalUrl: r.originalUrl,
  provider: r.provider!,
  success: true,
  data: { /* provider-specific data */ }
}));

// Fetch updates every 30 seconds
setInterval(async () => {
  const updates = await fetchTrackingUpdates(parsedUrls, lastUpdateTime);
  
  for (const update of updates) {
    if (update.success) {
      console.log(`New coordinates: ${update.coordinates.length}`);
    }
  }
}, 30000);
```

## API Endpoints

### 1. Expand URL Batch
**POST** `/api/tracking/expand-url-batch`

Processes multiple URLs: expands short URLs and parses provider data.

```typescript
// Request
{
  urls: string[]
}

// Response
{
  results: ParsedProviderData[]
}
```

### 2. Fetch Batch
**POST** `/api/tracking/fetch-batch`

Fetches complete tracking data for multiple athletes.

```typescript
// Request
{
  parsedUrls: ParsedProviderData[]
}

// Response
{
  results: TrackingApiResponse[]
}
```

### 3. Fetch Updates Batch
**POST** `/api/tracking/fetch-updates-batch`

Fetches coordinate updates for existing tracking sessions.

```typescript
// Request
{
  parsedUrls: ParsedProviderData[],
  begin?: string  // ISO timestamp for updates since
}

// Response
{
  results: TrackingUpdatesResponse[]
}
```

## Data Types

### UnifiedTrackingData

The core data structure representing an athlete's tracking information:

```typescript
interface UnifiedTrackingData {
  id: string;                    // Original URL
  provider: TrackingProvider;    // 'garmin' | 'strava'
  athleteName: string;           // Athlete's display name
  activityType?: string;         // 'Run', 'Ride', etc.
  coordinates: UnifiedCoordinate[];
  lastUpdate: string;            // ISO timestamp
  stats?: UnifiedStats;          // Distance, time, etc.
}
```

### UnifiedCoordinate

Standardized GPS coordinate format:

```typescript
interface UnifiedCoordinate {
  lat: number;
  lon: number;
  timestamp: string;    // ISO timestamp
  altitude?: number;    // meters
  speed?: number;       // m/s
}
```

## Provider Differences

### Garmin LiveTrack
- **Data Source**: GraphQL API with session tokens
- **Rich Data**: Altitude, speed, heart rate, planned route
- **Authentication**: Session ID + token from URL
- **Updates**: Supports incremental updates with timestamp

### Strava Beacon
- **Data Source**: HTML scraping of beacon pages
- **Basic Data**: Coordinates, athlete name, activity stats
- **Authentication**: Public beacon ID from URL
- **Updates**: Requires full re-fetch (no incremental updates)

## Error Handling

The API provides comprehensive error handling with specific error codes:

```typescript
type UnifiedErrorCode = 
  | 'INVALID_URL'     // URL format not recognized
  | 'PROVIDER_ERROR'  // Provider-specific error
  | 'NETWORK_ERROR'   // Connection/fetch error
  | 'RATE_LIMITED'    // API rate limiting
  | 'UNKNOWN';        // Unexpected error
```

Each error includes:
- `code`: Specific error type
- `message`: Human-readable description
- `provider`: Which provider caused the error (if applicable)

## File Structure

```
src/lib/tracking/
├── index.ts           # Main exports
├── types.ts           # TypeScript definitions
├── providers.ts       # URL detection and parsing
├── converters.ts      # Provider → Unified format
└── client.ts          # Client-side utilities

src/app/api/tracking/
├── expand-url-batch/
│   └── route.ts       # URL processing endpoint
├── fetch-batch/
│   └── route.ts       # Data fetching endpoint
└── fetch-updates-batch/
    └── route.ts       # Updates endpoint
```

## Integration with Existing APIs

The unified API sits on top of the existing provider-specific APIs:

- **Garmin**: Uses refactored `garmin-api.ts` with clean separation
- **Strava**: Uses complete `strava-api.ts` with beacon scraping

All existing functionality remains available while the unified API provides a cleaner interface for multi-provider scenarios.

## Performance Considerations

- **Parallel Processing**: All API calls use `Promise.allSettled` for concurrent execution
- **Batch Operations**: Single API calls handle multiple athletes
- **Error Isolation**: One failed athlete doesn't affect others
- **Update Optimization**: Only fetch new coordinates since last update

## Example Integration

```typescript
// In a React component
import { processTrackingUrls, fetchTrackingUpdates } from '@/lib/tracking';

function MultiTrackingApp() {
  const [athletes, setAthletes] = useState([]);
  
  const addUrls = async (urls: string[]) => {
    const results = await processTrackingUrls(urls);
    setAthletes(prev => [...prev, ...results.filter(r => r.success)]);
  };
  
  const updateAthletes = async () => {
    const parsedUrls = athletes.map(athlete => ({
      originalUrl: athlete.originalUrl,
      provider: athlete.provider,
      success: true,
      data: { /* extract from athlete data */ }
    }));
    
    const updates = await fetchTrackingUpdates(parsedUrls);
    // Merge updates with existing athletes...
  };
  
  return (
    <div>
      {athletes.map(athlete => (
        <AthleteCard key={athlete.originalUrl} athlete={athlete} />
      ))}
    </div>
  );
}
```

This unified approach provides a clean, extensible foundation for multi-provider live tracking applications.
