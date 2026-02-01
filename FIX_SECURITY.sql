-- =========================================================
-- SECURITY FIX SCRIPT
-- =========================================================
-- This script enables Row Level Security (RLS) on all sensitive tables
-- to fix the "Critical Security Alert" in Supabase dashboard.

-- 1. Enable RLS on core tables
ALTER TABLE IF EXISTS public.audit_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.defect_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.severity_levels ENABLE ROW LEVEL SECURITY;

-- 2. Create "Public Read" policies for reference data (Dicts)
-- Systems, Defects, Severity Levels are public reference data, everyone can read.

-- Systems
DROP POLICY IF EXISTS "Public read access" ON public.systems;
CREATE POLICY "Public read access" ON public.systems FOR SELECT USING (true);

-- Defect Types
DROP POLICY IF EXISTS "Public read access" ON public.defect_types;
CREATE POLICY "Public read access" ON public.defect_types FOR SELECT USING (true);

-- Severity Levels
DROP POLICY IF EXISTS "Public read access" ON public.severity_levels;
CREATE POLICY "Public read access" ON public.severity_levels FOR SELECT USING (true);

-- 3. Create "Authenticated Access" for sensitive data
-- Audit Baselines should be viewable by logged in users.

DROP POLICY IF EXISTS "Authenticated users can view baselines" ON public.audit_baselines;
CREATE POLICY "Authenticated users can view baselines" ON public.audit_baselines FOR SELECT TO authenticated USING (true);

-- 4. Enable RLS on other potential unsecured tables just in case
ALTER TABLE IF EXISTS public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.check_items ENABLE ROW LEVEL SECURITY;

-- Project Policies (Allow all authenticated for now to unblock sync)
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.projects;
CREATE POLICY "Enable read access for authenticated users" ON public.projects FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.check_items;
CREATE POLICY "Enable read access for authenticated users" ON public.check_items FOR SELECT TO authenticated USING (true);
