const { Client } = require('pg');
require('dotenv').config();

async function updateSchema() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('Connected to database.');

        console.log('Adding columns to check_items...');
        await client.query(`
            ALTER TABLE "check_items" 
            ADD COLUMN IF NOT EXISTS "isMultiple" BOOLEAN NOT NULL DEFAULT false,
            ADD COLUMN IF NOT EXISTS "totalCount" INTEGER,
            ADD COLUMN IF NOT EXISTS "failCount" INTEGER,
            ADD COLUMN IF NOT EXISTS "inspectionMethod" TEXT;
        `);

        console.log('Adding column to requirements...');
        await client.query(`
            ALTER TABLE "requirements" 
            ADD COLUMN IF NOT EXISTS "isMultipleHint" BOOLEAN NOT NULL DEFAULT false;
        `);

        console.log('Database updated successfully.');
    } catch (err) {
        console.error('Error updating database:', err);
    } finally {
        await client.end();
    }
}

updateSchema();
