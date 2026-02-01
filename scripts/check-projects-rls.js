
const { Pool } = require('pg');
require('dotenv').config();

async function main() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    // Check if RLS is enabled on projects
    const rlsRes = await pool.query("SELECT relname, relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND relname = 'projects'");
    console.log('Projects table RLS:', rlsRes.rows[0]);

    // Check policies for projects
    const polRes = await pool.query("SELECT policyname FROM pg_policies WHERE tablename = 'projects'");
    console.log('Projects policies:', polRes.rows.map(r => r.policyname));

    await pool.end();
}

main().catch(console.error);
