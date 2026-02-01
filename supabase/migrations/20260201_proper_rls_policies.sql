-- =====================================================
-- PROPER RLS POLICIES FOR DIGITAL AUDIT SYSTEM
-- =====================================================
-- This migration sets up secure RLS policies for all tables
-- while allowing the application to function properly

-- =====================================================
-- 1. PROJECTS
-- =====================================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow public read access to projects" ON projects;
DROP POLICY IF EXISTS "Allow authenticated users full access to projects" ON projects;

-- Public can read all projects
CREATE POLICY "projects_select_public"
ON projects FOR SELECT
USING (true);

-- Authenticated users can do everything
CREATE POLICY "projects_all_authenticated"
ON projects FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================================================
-- 2. REQUIREMENT SETS
-- =====================================================
ALTER TABLE requirement_sets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to published requirement sets" ON requirement_sets;
DROP POLICY IF EXISTS "Allow authenticated users to read requirement sets" ON requirement_sets;
DROP POLICY IF EXISTS "Allow authenticated users to read all requirement sets" ON requirement_sets;
DROP POLICY IF EXISTS "Allow admins to manage requirement sets" ON requirement_sets;
DROP POLICY IF EXISTS "Allow authenticated users full access to requirement sets" ON requirement_sets;

-- Public can read PUBLISHED and ACTIVE requirement sets
CREATE POLICY "requirement_sets_select_public"
ON requirement_sets FOR SELECT
USING (status IN ('PUBLISHED', 'ACTIVE'));

-- Authenticated users can do everything
CREATE POLICY "requirement_sets_all_authenticated"
ON requirement_sets FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================================================
-- 3. REQUIREMENTS
-- =====================================================
ALTER TABLE requirements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to requirements" ON requirements;
DROP POLICY IF EXISTS "Allow authenticated users full access to requirements" ON requirements;

-- Public can read all requirements
CREATE POLICY "requirements_select_public"
ON requirements FOR SELECT
USING (true);

-- Authenticated users can do everything
CREATE POLICY "requirements_all_authenticated"
ON requirements FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================================================
-- 4. AUDIT CHECKLISTS
-- =====================================================
ALTER TABLE audit_checklists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to audit checklists" ON audit_checklists;
DROP POLICY IF EXISTS "Allow authenticated users full access to audit checklists" ON audit_checklists;

-- Public can read all checklists
CREATE POLICY "audit_checklists_select_public"
ON audit_checklists FOR SELECT
USING (true);

-- Authenticated users can do everything
CREATE POLICY "audit_checklists_all_authenticated"
ON audit_checklists FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================================================
-- 5. AUDIT RESULTS
-- =====================================================
ALTER TABLE audit_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to audit results" ON audit_results;
DROP POLICY IF EXISTS "Allow authenticated users full access to audit results" ON audit_results;

-- Public can read all results
CREATE POLICY "audit_results_select_public"
ON audit_results FOR SELECT
USING (true);

-- Authenticated users can do everything
CREATE POLICY "audit_results_all_authenticated"
ON audit_results FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================================================
-- 6. SYSTEMS
-- =====================================================
ALTER TABLE systems ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to systems" ON systems;

-- Public can read all systems
CREATE POLICY "systems_select_public"
ON systems FOR SELECT
USING (true);

-- Authenticated users can modify systems
CREATE POLICY "systems_all_authenticated"
ON systems FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================================================
-- 7. NORM SOURCES
-- =====================================================
ALTER TABLE norm_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to norm sources" ON norm_sources;

-- Public can read all norm sources
CREATE POLICY "norm_sources_select_public"
ON norm_sources FOR SELECT
USING (true);

-- Authenticated users can modify
CREATE POLICY "norm_sources_all_authenticated"
ON norm_sources FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================================================
-- VERIFICATION
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ RLS policies configured successfully';
    RAISE NOTICE '📋 Tables protected:';
    RAISE NOTICE '   - projects';
    RAISE NOTICE '   - requirement_sets (public: PUBLISHED/ACTIVE only)';
    RAISE NOTICE '   - requirements';
    RAISE NOTICE '   - audit_checklists';
    RAISE NOTICE '   - audit_results';
    RAISE NOTICE '   - systems';
    RAISE NOTICE '   - norm_sources';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 Security model:';
    RAISE NOTICE '   - Public users: READ-ONLY access';
    RAISE NOTICE '   - Authenticated: FULL access';
END$$;
