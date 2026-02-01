-- Comprehensive RLS fix for all audit-related tables
-- This ensures the entire freeze baseline flow works

-- 1. audit_results (critical!)
ALTER TABLE audit_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to audit results" ON audit_results;
DROP POLICY IF EXISTS "Allow authenticated users full access to audit results" ON audit_results;

CREATE POLICY "Allow public read access to audit results"
ON audit_results
FOR SELECT
USING (true);

CREATE POLICY "Allow authenticated users full access to audit results"
ON audit_results
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 2. Ensure systems table is accessible
ALTER TABLE systems ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to systems" ON systems;

CREATE POLICY "Allow public read access to systems"
ON systems
FOR SELECT
USING (true);

-- 3. Ensure norm_sources is accessible
ALTER TABLE norm_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to norm sources" ON norm_sources;

CREATE POLICY "Allow public read access to norm sources"
ON norm_sources
FOR SELECT
USING (true);
