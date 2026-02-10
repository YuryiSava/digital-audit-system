-- Add typical_faults column to requirements table
ALTER TABLE requirements 
ADD COLUMN IF NOT EXISTS typical_faults TEXT[] DEFAULT '{}';

-- Check if column was added successfully
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'requirements' AND column_name = 'typical_faults';
