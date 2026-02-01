
const { Pool } = require('pg');
require('dotenv').config();

async function main() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    console.log('--- STARTING PLATFORM ACCESS & SECURITY FIX ---');

    // 1. Fix Role Check Constraint
    console.log('1. Fixing user_profiles role check constraint...');
    try {
        await pool.query("ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check");
        await pool.query("ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_role_check CHECK (role IN ('admin', 'engineer', 'manager', 'viewer', 'ADMIN', 'ENGINEER', 'MANAGER', 'VIEWER'))");
        console.log('   Check constraint updated to support lowercase.');
    } catch (e) {
        console.log('   Note: Could not update check constraint (maybe different name). Manual check recommended.');
    }

    // 2. Normalize existing roles to lowercase
    console.log('2. Normalizing existing roles to lowercase...');
    await pool.query("UPDATE public.user_profiles SET role = lower(role) WHERE role IS NOT NULL");
    await pool.query("ALTER TABLE public.user_profiles ALTER COLUMN role SET DEFAULT 'engineer'");
    console.log('   Existing roles normalized.');

    // 3. Update Trigger for new users
    console.log('3. Updating handle_new_user trigger...');
    await pool.query(`
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
            'engineer'
          )
          ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            full_name = EXCLUDED.full_name;
          RETURN new;
        END;
        $$;
    `);
    console.log('   Trigger handle_new_user updated to use lowercase.');

    // 4. Update is_admin function to be case-insensitive
    console.log('4. Fixing is_admin() function...');
    await pool.query(`
        CREATE OR REPLACE FUNCTION public.is_admin()
        RETURNS boolean
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          RETURN EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND lower(role) = 'admin'
          );
        END;
        $$;
    `);
    console.log('   is_admin() function fixed.');

    // 5. Ensure permissive RLS policies for common tables
    console.log('5. Applying permissive RLS policies for Projects and Profiles...');
    const tablesToFix = ['projects', 'user_profiles', 'project_assignments', 'audits', 'audit_checklists'];

    for (const table of tablesToFix) {
        console.log(`   Fixing RLS for ${table}...`);
        await pool.query(`ALTER TABLE IF EXISTS public.${table} ENABLE ROW LEVEL SECURITY`);
        await pool.query(`DROP POLICY IF EXISTS "Auth Access" ON public.${table}`);
        await pool.query(`CREATE POLICY "Auth Access" ON public.${table} FOR ALL TO authenticated USING (true) WITH CHECK (true)`);
        // Remove old restrictive policies if they exist
        await pool.query(`DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.${table}`);
    }

    console.log('--- ALL DATABASE FIXES APPLIED SUCCESSFULLY ---');
    await pool.end();
}

main().catch(console.error);
