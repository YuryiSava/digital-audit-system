-- Migration: Add defect_items column for Multiple Objects tracking
-- Version: 0.5.0

ALTER TABLE audit_results 
ADD COLUMN IF NOT EXISTS "defect_items" JSONB DEFAULT '[]'::jsonb;

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'audit_results' AND column_name = 'defect_items';
