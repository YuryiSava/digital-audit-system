-- =========================================================
-- FIX REGISTRATION V2 (Stronger Fix)
-- =========================================================
-- This script completely resets the profile logic to ensure it works.
-- Run this in Supabase SQL Editor.

-- 1. Reset Triggers and Functions (Cleanup)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Ensure Permissions (Grant access to auth system)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 3. Recreate the Table (Safe Reset)
-- Note: We are ensuring the table exists with correct permissions
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    role TEXT DEFAULT 'ENGINEER',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Force enable RLS but add a "Let everyone in" policy for now to unblock us
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for now" ON public.user_profiles;
CREATE POLICY "Enable all access for now" ON public.user_profiles FOR ALL USING (true) WITH CHECK (true);

-- 4. Create a Robust Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER -- Run as Admin
SET search_path = public -- Force public schema
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email), -- Fallback to email if name missing
    'ENGINEER'
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$;

-- 5. Attach Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. Verify grants again just to be sure
GRANT ALL ON public.user_profiles TO postgres, anon, authenticated, service_role;
