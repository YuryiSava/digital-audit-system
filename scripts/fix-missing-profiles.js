const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function fixMissingProfiles() {
    const client = await pool.connect();
    try {
        console.log('🔧 Fixing missing profiles...');

        // 1. Get users without profiles
        const res = await client.query(`
            SELECT au.id, au.email, au.raw_user_meta_data 
            FROM auth.users au
            LEFT JOIN public.user_profiles up ON au.id = up.id
            WHERE up.id IS NULL
        `);

        if (res.rows.length === 0) {
            console.log('✅ No missing profiles found.');
            return;
        }

        console.log(`Found ${res.rows.length} missing profiles.`);

        // 2. Insert them
        for (const user of res.rows) {
            const fullName = user.raw_user_meta_data?.full_name || user.email.split('@')[0];
            const role = 'engineer'; // Default role

            console.log(`   + Creating profile for ${user.email} (${role})...`);

            await client.query(`
                INSERT INTO public.user_profiles (id, email, full_name, role)
                VALUES ($1, $2, $3, $4)
            `, [user.id, user.email, fullName, role]);
        }

        console.log('✅ All fixed!');

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

fixMissingProfiles();
