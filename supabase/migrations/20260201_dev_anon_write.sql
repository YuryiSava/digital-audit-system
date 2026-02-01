-- =====================================================
-- RELAXED RLS FOR DEVELOPMENT
-- =====================================================
-- Temporarily allows anonymous users to write
-- TODO: Remove in production, implement proper auth

-- Allow anonymous users to write to projects
CREATE POLICY "projects_write_anon_dev"
ON projects FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- Allow anonymous users to write to audit_checklists
CREATE POLICY "audit_checklists_write_anon_dev"
ON audit_checklists FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- Allow anonymous users to write to audit_results
CREATE POLICY "audit_results_write_anon_dev"
ON audit_results FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- Allow anonymous users to write to requirement_sets
CREATE POLICY "requirement_sets_write_anon_dev"
ON requirement_sets FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- Allow anonymous users to write to requirements
CREATE POLICY "requirements_write_anon_dev"
ON requirements FOR ALL
TO anon
USING (true)
WITH CHECK (true);

SELECT '⚠️ Development mode: Anonymous users can write to database' as notice;
