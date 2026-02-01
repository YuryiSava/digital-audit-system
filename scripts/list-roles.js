
const { Pool } = require('pg');
require('dotenv').config();

async function main() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const res = await pool.query("SELECT email, role FROM user_profiles");
    console.log('Profiles:', res.rows);
    await pool.end();
}

main().catch(console.error);
