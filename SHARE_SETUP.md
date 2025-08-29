# Share Feature Setup Instructions

## 1. Supabase Setup

### Database Setup

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run the SQL script from `database/create_shared_grids_table.sql`

### Environment Variables

1. Copy your Supabase URL and anon key from your Supabase dashboard
2. Update the `.env.local` file with your actual values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## 2. How the Share Feature Works

### Creating a Share Link

1. Set up your grid layout with URLs
2. Click the "Share" button in the top bar
3. Click "Create Share Link"
4. Copy the generated link to share with others

### Accessing Shared Grids

- Shared grids are accessible at `/share/XXXX` where XXXX is the 4-character share ID
- Shared grids are **fully editable** - recipients can modify URLs, grid layout, and create new shares
- No authentication required - anyone with the link can view and edit the shared grid
- **Server-side rendered** - grids load instantly with data (no loading spinners!)

### Database Schema

The `shared_grids` table stores:

- `id`: Unique UUID primary key
- `share_id`: 4-character random string (A-Z, a-z, 0-9)
- `rows`: Number of grid rows
- `cols`: Number of grid columns
- `cell_data`: JSON object containing all cell URLs and states
- `created_at`: Timestamp when the share was created

### Security

- Row Level Security (RLS) is enabled
- Public read access for anyone with a share link
- Public insert access to create new shares
- Share IDs are randomly generated with 62^4 = ~14.7 million possible combinations

### Optional Cleanup

The SQL script includes commented code for automatically deleting shares older than 30 days using pg_cron extension.

## 3. Technical Details

### Architecture

- **Unified Component**: Single `DynamicGrid` component handles both main and shared views
- **Server Components**: Shared grids use Next.js server components for instant loading
- **No API Routes**: Direct database access from server components
- **Full Editability**: Shared grids are starting points, not read-only snapshots

### Share ID Generation

- 4 random characters from A-Z, a-z, 0-9
- Collision detection with retry logic
- Very low probability of collisions

### Components

- `DynamicGrid` - Unified grid component with optional initial state
- `ShareButton` - Modal dialog for creating share links
- Server-side data fetching with `getSharedGridData`
- Custom not-found page for invalid share links

### Dependencies Added

- `@supabase/supabase-js` - Supabase JavaScript client

### Key Benefits

1. **Instant Loading**: Server-side rendering eliminates loading states
2. **SEO Friendly**: Grid content is in the initial HTML
3. **Code Reuse**: Single component handles both editing and sharing
4. **Collaborative**: Recipients can build on shared grids and re-share
