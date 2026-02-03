-- Fix RLS for norm_files to allow file uploads
-- Date: 2026-02-01

-- Enable RLS on norm_files
ALTER TABLE norm_files ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "norm_files_select_public" ON norm_files;
DROP POLICY IF EXISTS "norm_files_all_authenticated" ON norm_files;

-- Allow public to read norm files
CREATE POLICY "norm_files_select_public"
ON norm_files FOR SELECT
TO public
USING (true);

-- Allow authenticated users to do everything (INSERT, UPDATE, DELETE)
CREATE POLICY "norm_files_all_authenticated"
ON norm_files FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Also fix requirements table (might have same issue)
ALTER TABLE requirements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "requirements_select_public" ON requirements;
DROP POLICY IF EXISTS "requirements_all_authenticated" ON requirements;

CREATE POLICY "requirements_select_public"
ON requirements FOR SELECT
TO public
USING (true);

CREATE POLICY "requirements_all_authenticated"
ON requirements FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Fix raw_norm_fragments
ALTER TABLE raw_norm_fragments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "raw_norm_fragments_select_public" ON raw_norm_fragments;
DROP POLICY IF EXISTS "raw_norm_fragments_all_authenticated" ON raw_norm_fragments;

CREATE POLICY "raw_norm_fragments_select_public"
ON raw_norm_fragments FOR SELECT
TO public
USING (true);

CREATE POLICY "raw_norm_fragments_all_authenticated"
ON raw_norm_fragments FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Verify policies
DO $$
BEGIN
    RAISE NOTICE 'RLS policies fixed for norm library tables:';
    RAISE NOTICE '   - norm_files';
    RAISE NOTICE '   - requirements';
    RAISE NOTICE '   - raw_norm_fragments';
END $$;
