-- ==========================================
-- DIGITAL AUDIT SYSTEM: REGISTRATION FIX
-- ==========================================
-- Run this script in Supabase Dashboard > SQL Editor
-- This fixes the "Database error saving new user" issue.

-- 1. Create table for user profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'ENGINEER' CHECK (role IN ('ADMIN', 'ENGINEER', 'MANAGER', 'VIEWER')),
  organization TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Allow Access
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.user_profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.user_profiles FOR SELECT USING ( true );

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.user_profiles;
CREATE POLICY "Users can insert their own profile." ON public.user_profiles FOR INSERT WITH CHECK ( auth.uid() = id );

DROP POLICY IF EXISTS "Users can update own profile." ON public.user_profiles;
CREATE POLICY "Users can update own profile." ON public.user_profiles FOR UPDATE USING ( auth.uid() = id );

-- 4. Create Automation Function (Trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    'ENGINEER' -- Default role is Engineer
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;
    
  RETURN new;
END;
$$;

-- 5. Activate Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- OPTIONAL: Create Project Assignments Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.project_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'contributor',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(project_id, user_id)
);

ALTER TABLE public.project_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own assignments" ON public.project_assignments;
CREATE POLICY "Users can view their own assignments" ON public.project_assignments FOR SELECT USING ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Admins/Managers can manage assignments" ON public.project_assignments;
CREATE POLICY "Admins/Managers can manage assignments" ON public.project_assignments FOR ALL USING ( 
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role IN ('ADMIN', 'MANAGER')
  )
);
