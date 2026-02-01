const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

// We need to use the connection string directly to query auth schema usually, 
// OR try the postgres client if installed. 
// But let's try via Supabase client with SERVICE KEY if I can find it? 
// No service key. 
// Let's use 'pg' library with the DATABASE_URL which is postgres/postgres.
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function listAuthUsers() {
    try {
        console.log('Connecting to DB...');
        const client = await pool.connect();
        try {
            console.log('Querying auth.users...');
            // Select id, email from auth.users
            const res = await client.query('SELECT id, email, created_at, raw_user_meta_data FROM auth.users ORDER BY created_at DESC');
            console.log('Found Auth Users:');
            res.rows.forEach(u => {
                console.log(` - ${u.email} (ID: ${u.id}) [${u.created_at}]`);
            });

            // Also check if they are in public.user_profiles
            const resProfiles = await client.query('SELECT id, email, role FROM public.user_profiles');
            const profileIds = new Set(resProfiles.rows.map(r => r.id));

            console.log('\nMissing Profiles for:');
            res.rows.forEach(u => {
                if (!profileIds.has(u.id)) {
                    console.log(`!!! MISSING PROFILE: ${u.email} (ID: ${u.id})`);
                }
            });

        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

listAuthUsers();
