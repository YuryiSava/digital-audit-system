require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Fix for self-signed certificates in some dev environments (Supabase usually needs SSL)
// But standard connection string often works.
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
    console.error('Error: DATABASE_URL or POSTGRES_URL needed in .env.local');
    process.exit(1);
}

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false } // Required for Supabase in many environments
});

async function runMigration() {
    try {
        await client.connect();

        // Read the SQL file relative to this script
        const migrationPath = path.join(__dirname, '../migrations/add-typical-faults.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('Running migration: add-typical-faults.sql...');

        // Execute SQL
        await client.query(sql);

        console.log('✅ Migration successful!');
    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await client.end();
    }
}

runMigration();
