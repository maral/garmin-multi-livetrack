-- Add state_hash column to shared_grids table for tracking unique grid states
ALTER TABLE shared_grids ADD COLUMN state_hash VARCHAR(20) NOT NULL DEFAULT '';

-- Create an index on state_hash for faster lookups when checking for existing shares
CREATE INDEX IF NOT EXISTS idx_shared_grids_state_hash ON shared_grids(state_hash);

-- Update existing records to have a placeholder state_hash (they'll be recalculated if needed)
UPDATE shared_grids SET state_hash = 'legacy_' || share_id WHERE state_hash = '';