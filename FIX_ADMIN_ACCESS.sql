-- =========================================================
-- FIX VISIBILITY FOR RAW FRAGMENTS & ADMIN ALL ACCESS
-- =========================================================

-- 1. Ensure Raw Fragments are visible to ALL authenticated users (for now)
ALTER TABLE public.raw_norm_fragments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Auth Read" ON public.raw_norm_fragments;
CREATE POLICY "Auth Read" ON public.raw_norm_fragments 
    FOR SELECT 
    TO authenticated 
    USING (true);

DROP POLICY IF EXISTS "Auth Edit" ON public.raw_norm_fragments;
CREATE POLICY "Auth Edit" ON public.raw_norm_fragments 
    FOR ALL 
    TO authenticated 
    USING (true)
    WITH CHECK (true);

-- 2. UNIVERSAL ADMIN POLICY
-- This is a hammer: if your role is 'admin' or 'ADMIN', you can do ANYTHING on specific tables.
-- We apply this to key tables just to be sure.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() 
    AND role IN ('ADMIN', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply Admin Override to Norms
DROP POLICY IF EXISTS "Admin All" ON public.norm_sources;
CREATE POLICY "Admin All" ON public.norm_sources FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Apply Admin Override to Requirements
DROP POLICY IF EXISTS "Admin All" ON public.requirements;
CREATE POLICY "Admin All" ON public.requirements FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Apply Admin Override to Fragments
DROP POLICY IF EXISTS "Admin All" ON public.raw_norm_fragments;
CREATE POLICY "Admin All" ON public.raw_norm_fragments FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

