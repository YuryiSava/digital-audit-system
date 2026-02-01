
const { Pool } = require('pg');
require('dotenv').config();

async function main() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    console.log('--- Database Consistency Check ---');

    // 1. Check for uppercase roles
    const res = await pool.query("SELECT email, role FROM user_profiles WHERE role = 'ENGINEER' OR role = 'ADMIN' OR role = 'MANAGER' OR role = 'VIEWER'");
    console.log('Uppercase roles found:', res.rows);

    // 2. Fix them to lowercase
    if (res.rows.length > 0) {
        console.log('Fixing roles to lowercase...');
        await pool.query("UPDATE user_profiles SET role = lower(role) WHERE role IN ('ENGINEER', 'ADMIN', 'MANAGER', 'VIEWER')");
        console.log('Fixed.');
    }

    // 3. Update the trigger to use lowercase
    console.log('Updating handle_new_user trigger to use lowercase...');
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
            'engineer' -- LOWERCASE DEFAULT
          )
          ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            full_name = EXCLUDED.full_name;
            
          RETURN new;
        END;
        $$;
    `);
    console.log('Trigger updated.');

    await pool.end();
}

main().catch(console.error);
