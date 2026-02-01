const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config(); // Fallback to .env

const migrationFile = process.argv[2];

if (!migrationFile) {
    console.error('Please provide a migration file path.');
    process.exit(1);
}

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
    try {
        await client.connect();
        console.log('🔌 Connected to database...');

        const sql = fs.readFileSync(migrationFile, 'utf8');
        console.log(`📄 Applying migration: ${path.basename(migrationFile)}...`);

        await client.query(sql);

        console.log('✅ Migration applied successfully!');
    } catch (err) {
        console.error('❌ Error executing migration:', err);
    } finally {
        await client.end();
    }
}

runMigration();
