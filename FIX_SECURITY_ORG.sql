-- =========================================================
-- FIX SECURITY: ORGANIZATIONS
-- =========================================================

-- 1. Enable RLS
ALTER TABLE IF EXISTS public.organizations ENABLE ROW LEVEL SECURITY;

-- 2. Create Policy (Allow authenticated users)
-- Adjust this if you need stricter control (e.g. only members can see)
-- For now, we allow all engineers to access so the app works.
CREATE POLICY "Auth Access" ON public.organizations FOR ALL TO authenticated USING (true);
