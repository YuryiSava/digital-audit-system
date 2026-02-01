-- Add Pre-Audit Setup fields to projects table
-- Run this in Supabase SQL Editor or via migration script

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS "systemsInScope" TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "scopeDepth" TEXT DEFAULT 'STANDARD',
ADD COLUMN IF NOT EXISTS "scopeExclusions" TEXT,
ADD COLUMN IF NOT EXISTS "baselineFrozen" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "baselineFrozenAt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "baselineFrozenBy" TEXT;

-- Add comment
COMMENT ON COLUMN projects."systemsInScope" IS 'Array of system IDs in scope for audit (e.g., [APS, SOUE])';
COMMENT ON COLUMN projects."scopeDepth" IS 'Audit depth: BASIC, STANDARD, or DEEP';
COMMENT ON COLUMN projects."baselineFrozen" IS 'Whether baseline has been frozen (snapshot created)';
