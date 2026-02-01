-- Add name and notes columns to requirement_sets table
-- This allows requirement sets to display norm names instead of system names

ALTER TABLE requirement_sets
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update existing sets to have a default name based on system
UPDATE requirement_sets
SET name = COALESCE(
    (SELECT s.name FROM systems s WHERE s.id = requirement_sets."systemId"),
    'Requirement Set'
)
WHERE name IS NULL;

COMMENT ON COLUMN requirement_sets.name IS 'Display name for the requirement set (e.g., norm code and title)';
COMMENT ON COLUMN requirement_sets.notes IS 'Description or additional information about the requirement set';
