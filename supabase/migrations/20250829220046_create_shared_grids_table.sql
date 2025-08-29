-- Create the shared_grids table for storing shared grid states
CREATE TABLE IF NOT EXISTS shared_grids (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    share_id VARCHAR(4) NOT NULL UNIQUE,
    rows INTEGER NOT NULL,
    cols INTEGER NOT NULL,
    cell_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create an index on share_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_shared_grids_share_id ON shared_grids(share_id);

-- Create an index on created_at for potential cleanup operations
CREATE INDEX IF NOT EXISTS idx_shared_grids_created_at ON shared_grids(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE shared_grids ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since shares should be accessible to anyone with the link)
-- Allow anyone to read shared grids
CREATE POLICY "Allow public read access" ON shared_grids
    FOR SELECT USING (true);

-- Allow anyone to insert new shared grids
CREATE POLICY "Allow public insert access" ON shared_grids
    FOR INSERT WITH CHECK (true);