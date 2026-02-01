const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function check() {
    try {
        const client = await pool.connect();
        try {
            console.log('🔍 CHECKING DATA DIRECTLY (ADMIN ACCESS)...');

            const tables = ['norm_sources', 'requirements', 'projects', 'user_profiles', 'raw_norm_fragments'];

            for (const table of tables) {
                try {
                    const res = await client.query(`SELECT count(*) FROM "${table}"`);
                    console.log(`   📦 ${table}: ${res.rows[0].count} rows`);
                } catch (err) {
                    console.log(`   ❌ ${table}: Error (maybe table missing)`);
                }
            }

        } finally {
            client.release();
        }
    } catch (e) {
        console.error('Connection error:', e);
    } finally {
        await pool.end();
    }
}

check();
