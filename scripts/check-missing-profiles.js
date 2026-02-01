
const { Pool } = require('pg');
require('dotenv').config();

async function main() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const res = await pool.query("SELECT count(*) FROM auth.users");
    console.log('Auth Users count:', res.rows[0].count);

    const missingRes = await pool.query(`
        SELECT email FROM auth.users 
        WHERE id NOT IN (SELECT id FROM public.user_profiles)
    `);
    console.log('Users without profiles:', missingRes.rows.map(r => r.email));

    await pool.end();
}

main().catch(console.error);
