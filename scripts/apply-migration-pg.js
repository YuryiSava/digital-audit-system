const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function applySql() {
    const client = await pool.connect();
    try {
        const sqlPath = process.argv[2];
        if (!sqlPath) {
            console.error('Usage: node apply-migration-pg.js <file.sql>');
            process.exit(1);
        }

        console.log(`📂 Reading ${sqlPath}...`);
        const sql = fs.readFileSync(path.resolve(process.cwd(), sqlPath), 'utf8');

        console.log('⚡ Executing SQL...');
        await client.query(sql);

        console.log('✅ Applied successfully!');

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

applySql();
