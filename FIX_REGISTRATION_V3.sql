-- =========================================================
-- FIX REGISTRATION V3 (Safe Mode & Cleanup)
-- =========================================================

-- 1. DELETE the stuck user (if exists) so you can try registering again
-- Note: We need to find the ID first, but direct delete by email is easier if permissions allow.
-- If this fails due to permissions, ignore it and just try a NEW email address.
DO $$
BEGIN
  DELETE FROM auth.users WHERE email = 'usa523@mail.ru';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not delete user, they might not exist or permission denied.';
END
$$;

-- 2. Drop previous triggers to be clean
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Create a "Soft Fail" Trigger Function
-- This function attempts to create a profile, but if it fails, it LOGS the error
-- and allows the User Registration to proceed anyway. This prevents the "Database Error".
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, role)
    VALUES (
      new.id,
      new.email,
      COALESCE(new.raw_user_meta_data->>'full_name', new.email),
      'engineer'
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- If profile creation fails, we allow the user creation to succeed!
    -- You might end up with a user without a profile, but at least they can log in.
    RAISE WARNING 'Profile creation failed for user %: %', new.id, SQLERRM;
  END;
  
  RETURN new;
END;
$$;

-- 4. Re-attach the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Ensure Table permissions (Again)
GRANT ALL ON public.user_profiles TO postgres, anon, authenticated, service_role;
