# Garmin Multi LiveTrack

A web application for viewing multiple Garmin LiveTrack URLs with two different visualization modes.

## Features

**Grid View** (`/grid`):

- Dynamic grid layout for multiple tracking pages
- Inline editing and bulk URL import
- Individual athlete tracking pages

**Multi-Track Map** (`/multi-track`):

- Single interactive map with all athletes
- Live tracking with real-time updates
- Athlete statistics and race comparison
- Play/pause controls for live updates

Both modes support short (gar.mn/xxx) and long Garmin LiveTrack URL formats.

## Getting Started

### Database Setup

1. Copy environment variables:

```bash
cp .env.local.example .env.local
```

1. Configure your Supabase database URL in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

1. Run database migrations:

```bash
npx supabase db push
```

### Development Server

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
