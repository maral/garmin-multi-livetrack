-- Add type column to shared_grids table to differentiate between different share types
ALTER TABLE shared_grids ADD COLUMN type VARCHAR(20) NOT NULL DEFAULT 'grid';

-- Create an index on type for faster filtering
CREATE INDEX IF NOT EXISTS idx_shared_grids_type ON shared_grids(type);

-- Update existing records to be 'grid' type
UPDATE shared_grids SET type = 'grid' WHERE type = 'grid';
