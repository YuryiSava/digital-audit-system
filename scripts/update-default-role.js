const { Pool } = require('pg');
require('dotenv').config();

async function main() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    console.log('--- UPDATING DEFAULT USER ROLE TO VIEWER ---');

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
            'viewer'
          )
          ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            full_name = EXCLUDED.full_name;
          RETURN new;
        END;
        $$;
    `);

    console.log('   Trigger handle_new_user updated: default role is now viewer.');

    await pool.end();
}

main().catch(console.error);
