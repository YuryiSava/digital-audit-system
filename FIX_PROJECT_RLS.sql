-- =========================================================
-- FIX RLS FOR PROJECTS TABLE
-- =========================================================

-- 1. Enable RLS ensuring it is on
ALTER TABLE IF EXISTS public.projects ENABLE ROW LEVEL SECURITY;

-- 2. Create "Auth Access" Policy for projects (missing in previous fix)
DROP POLICY IF EXISTS "Auth Access" ON public.projects;

CREATE POLICY "Auth Access" ON public.projects
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 3. Grant permissions to roles just in case
GRANT ALL ON public.projects TO service_role;
GRANT ALL ON public.projects TO authenticated;
GRANT ALL ON public.projects TO anon;

-- 4. Fix sequences if needed? (Usually handled by CUID/UUID but good practice)
-- Projects use CUID strings, so no sequence fix needed.

