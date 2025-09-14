# Garmin Multi LiveTrack Repository Summary

Run the development server:

```bash
pnpm dev
```

## Architecture Overview
This is a Next.js 15 application that enables viewing multiple Garmin LiveTrack URLs simultaneously in two modes:
- **Grid View**: Dynamic iframe grid layout for individual athlete tracking pages
- **Multi-Track Map**: Single interactive Leaflet map displaying all athletes with real-time updates

## Tech Stack
- **Frontend**: Next.js 15 with React 19, TypeScript, Tailwind CSS, App Router
- **Database**: Supabase (server-side only configuration)
- **Maps**: Leaflet with React-Leaflet for interactive mapping
- **Build**: Turbopack for fast development and builds

## Core Architecture

### Batch Processing System
The app uses efficient batch APIs to prevent server overload:
- `/api/garmin-fetch-batch`: Initial athlete data loading with full info (coordinates, course points, profile)
- `/api/garmin-fetch-updates-batch`: Lean periodic updates with only new coordinates
- `/api/expand-url-batch`: Batch URL expansion for gar.mn short URLs

### Key Components
- **MultiTrackApp**: Main app component with state management hooks
- **TrackingMap**: Leaflet map with real-time athlete tracking
- **AthleteManagement Hook**: Manages athlete state with batch processing
- **LiveTracking Hook**: Handles periodic updates and play/pause controls

### Data Flow
1. User inputs Garmin LiveTrack URLs (supports gar.mn/xxx and full URLs)
2. URLs are batch expanded and parsed to extract sessionId/token
3. Initial batch API call fetches full athlete data (coordinates, course, profile)
4. Periodic lean updates fetch only new coordinates using timestamp-based queries
5. Real-time map updates with athlete positions and statistics

### State Management
- React hooks pattern with useRef for stable function references
- Batch processing prevents duplicate API calls per sessionId
- Efficient timestamp-based updates avoid duplicate coordinate fetching
- Color-coded athletes with automatic assignment from predefined palette

### GraphQL Integration
The app interfaces with Garmin's LiveTrack GraphQL API:
- `trackPointsBySessionId`: Fetches coordinate data with timestamp filtering
- `courseBySessionId`: Fetches planned route and course points
- Proper query structure matching for batch operations

### Performance Optimizations
- Server-side API routes for CORS handling and API key management
- Promise.allSettled for parallel external API calls
- Lean update system separates initial loads from periodic refreshes
- Timestamp increment prevents duplicate coordinate transmission

### Database Layer
- Supabase for sharing functionality and grid state persistence
- Repository pattern with shared grid data storage
- Type-safe database operations with TypeScript interfaces

### Key Files
- `src/hooks/useAthleteManagement.ts`: Core athlete state and batch processing
- `src/lib/garmin-api.ts`: Client-side batch API functions
- `src/app/api/*/route.ts`: Server-side batch endpoints
- `src/components/MultiTrackApp.tsx`: Main application component
- `src/components/TrackingMap.tsx`: Real-time map visualization

### Sharing System
- URL-based sharing with unique share IDs
- Persistent grid states stored in Supabase
- Share button generates shareable links for multi-athlete sessions

The application prioritizes performance through batch processing, bandwidth efficiency via lean updates, and real-time visualization of multiple athlete tracking sessions.