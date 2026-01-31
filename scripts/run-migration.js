const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
    console.log('🔌 Connecting to database...');
    await client.connect();

    try {
        console.log('🏗️ Applying migration: add parsing_details...');
        await client.query(`
      ALTER TABLE "norm_sources" 
      ADD COLUMN IF NOT EXISTS "parsing_details" JSONB DEFAULT NULL;
    `);
        console.log('✅ Migration success: parsing_details column added.');
    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await client.end();
    }
}

runMigration();
