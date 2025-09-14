# Strava Beacon API Implementation

## Overview

I've successfully reverse-engineered and implemented a Strava Beacon API similar to your existing Garmin API structure. This allows the application to support Strava Beacon URLs in addition to Garmin LiveTrack URLs.

## What Was Created

### 1. Core API Library (`src/lib/strava-api.ts`)

**Interfaces:**

- `StravaCoordinate` - GPS coordinates with timestamps
- `StravaProfile` - Athlete profile information
- `StravaTrackingData` - Complete tracking session data
- `ParsedStravaUrl` - Parsed beacon ID from URL

**Functions:**

- `isValidStravaUrl()` - Validates Strava beacon URLs
- `parseStravaUrl()` - Extracts beacon ID from URL
- `fetchStravaTrackingDataBatch()` - Batch fetch full tracking data
- `fetchStravaTrackingUpdatesBatch()` - Batch fetch only new coordinates

### 2. Server-Side API Routes

**`/api/strava-fetch-batch`** (`src/app/api/strava-fetch-batch/route.ts`)

- Fetches complete athlete tracking data including:
  - Athlete name (extracted from HTML page)
  - GPS coordinates with timestamps
  - Activity stats (distance, time, battery level)
  - Activity type mapping

**`/api/strava-fetch-updates-batch`** (`src/app/api/strava-fetch-updates-batch/route.ts`)

- Fetches only new coordinates since a given timestamp
- Optimized for periodic updates to reduce bandwidth

## Strava Beacon API Structure

### URL Format

```txt
https://www.strava.com/beacon/{beaconId}
```

### API Endpoint

```txt
https://www.strava.com/beacon/{beaconId}?minimum_timestamp={timestamp}&_={cacheBuster}
```

**Required Headers:**

- `X-Requested-With: XMLHttpRequest`
- `Referer: https://www.strava.com/beacon/{beaconId}`
- Proper user agent and CORS headers

### Response Format

```json
{
  "streams": {
    "timestamp": [1757090304, 1757090432, ...],
    "latlng": [[45.952671, 9.307005], [45.95269, 9.306834], ...]
  },
  "live_activity_id": 192027048963412426,
  "athlete_id": 44709781,
  "update_time": 1757090946,
  "utc_offset": 0,
  "activity_type": 4,
  "status": 3,
  "stats": {
    "distance": 379.5436540334632,
    "moving_time": 474,
    "elapsed_time": 474
  },
  "battery_level": 71,
  "source_app": "Strava"
}
```

## Key Differences from Garmin API

1. **No Authentication**: Strava Beacon doesn't require API keys or tokens
2. **Simpler Structure**: Uses beacon ID instead of session ID + token
3. **HTML Parsing**: Athlete name extracted from HTML page, not API
4. **No Course Data**: Strava Beacon doesn't provide planned route information
5. **No Fitness Data**: No heart rate, power, cadence data available
6. **Activity Type Mapping**: Different activity type enumeration than Garmin

## Testing

The implementation has been tested with:

- URL validation and parsing
- Full batch data fetching
- Incremental updates with timestamp filtering
- Real Strava beacon URL: `https://www.strava.com/beacon/vdQITEBRoc0`

## Integration Notes

The Strava API follows the same patterns as your existing Garmin API:

- Batch processing to handle multiple athletes
- Promise.allSettled for parallel requests
- Consistent error handling and response formats
- TypeScript interfaces matching your existing structure

This makes it easy to integrate into your existing multi-track application with minimal changes to the frontend code.

## Usage Example

```typescript
import {
  isValidStravaUrl,
  parseStravaUrl,
  fetchStravaTrackingDataBatch,
} from "@/lib/strava-api";

// Validate URL
const isValid = isValidStravaUrl("https://www.strava.com/beacon/vdQITEBRoc0");

// Parse beacon ID
const parsed = parseStravaUrl("https://www.strava.com/beacon/vdQITEBRoc0");
// Returns: { beaconId: 'vdQITEBRoc0' }

// Fetch tracking data
const results = await fetchStravaTrackingDataBatch([
  { beaconId: "vdQITEBRoc0" },
]);
```

The API is now ready for integration into your existing multi-track application!
