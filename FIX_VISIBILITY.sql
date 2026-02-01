-- =========================================================
-- FIX VISIBILITY FOR NORM LIBRARY
-- =========================================================

-- 1. Norm Sources (Allow Access for ALL Authenticated)
ALTER TABLE public.norm_sources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth Read" ON public.norm_sources;
CREATE POLICY "Auth Read" ON public.norm_sources FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth Insert" ON public.norm_sources FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth Update" ON public.norm_sources FOR UPDATE TO authenticated USING (true);

-- 2. Norm Files
ALTER TABLE public.norm_files ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth Read" ON public.norm_files;
CREATE POLICY "Auth Read" ON public.norm_files FOR SELECT TO authenticated USING (true);

-- 3. Requirements (Important!)
ALTER TABLE public.requirements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth Read" ON public.requirements;
CREATE POLICY "Auth Read" ON public.requirements FOR SELECT TO authenticated USING (true);

-- 4. Requirement Sets
ALTER TABLE public.requirement_sets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth Read" ON public.requirement_sets;
CREATE POLICY "Auth Read" ON public.requirement_sets FOR SELECT TO authenticated USING (true);

-- 5. Raw Fragments (For Parser)
ALTER TABLE public.raw_norm_fragments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth Read" ON public.raw_norm_fragments;
CREATE POLICY "Auth Read" ON public.raw_norm_fragments FOR SELECT TO authenticated USING (true);

-- 6. Ensure Service Role Bypass
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
