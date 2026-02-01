
const { Pool } = require('pg');
require('dotenv').config();

async function main() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const res = await pool.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'");
    console.log('Tables:', res.rows.map(r => r.tablename));

    const projectsRes = await pool.query("SELECT count(*) FROM projects");
    console.log('Projects count:', projectsRes.rows[0].count);

    const usersRes = await pool.query("SELECT count(*) FROM user_profiles");
    console.log('Profiles count:', usersRes.rows[0].count);

    await pool.end();
}

main().catch(console.error);
