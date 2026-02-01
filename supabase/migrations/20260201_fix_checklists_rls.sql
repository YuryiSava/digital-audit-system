-- Fix RLS for audit and project checklists
-- These tables need to allow authenticated users to create and manage checklists

-- 1. Audit Checklists
ALTER TABLE audit_checklists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to audit checklists" ON audit_checklists;
DROP POLICY IF EXISTS "Allow authenticated users full access to audit checklists" ON audit_checklists;

CREATE POLICY "Allow public read access to audit checklists"
ON audit_checklists
FOR SELECT
USING (true);

CREATE POLICY "Allow authenticated users full access to audit checklists"
ON audit_checklists
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 2. Project Checklists (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'project_checklists') THEN
        ALTER TABLE project_checklists ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Allow public read access to project checklists" ON project_checklists;
        DROP POLICY IF EXISTS "Allow authenticated users full access to project checklists" ON project_checklists;
        
        CREATE POLICY "Allow public read access to project checklists"
        ON project_checklists
        FOR SELECT
        USING (true);
        
        CREATE POLICY "Allow authenticated users full access to project checklists"
        ON project_checklists
        FOR ALL
        TO authenticated
        USING (true)
        WITH CHECK (true);
    END IF;
END$$;

-- 3. Requirements table (ensure it's accessible)
ALTER TABLE requirements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to requirements" ON requirements;
DROP POLICY IF EXISTS "Allow authenticated users full access to requirements" ON requirements;

CREATE POLICY "Allow public read access to requirements"
ON requirements
FOR SELECT
USING (true);

CREATE POLICY "Allow authenticated users full access to requirements"
ON requirements
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
