-- TEMPORARY: Disable RLS on all audit-related tables for testing
-- WARNING: This is for testing only! Re-enable with proper policies in production

ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE requirement_sets DISABLE ROW LEVEL SECURITY;
ALTER TABLE requirements DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_checklists DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE systems DISABLE ROW LEVEL SECURITY;
ALTER TABLE norm_sources DISABLE ROW LEVEL SECURITY;

-- Log
SELECT 'RLS temporarily disabled for testing' as status;
