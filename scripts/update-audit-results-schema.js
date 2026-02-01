const { Client } = require('pg');
require('dotenv').config();

async function updateSchema() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('Connected to database.');

        console.log('Adding columns to audit_results...');
        await client.query(`
            ALTER TABLE "audit_results" 
            ADD COLUMN IF NOT EXISTS "isMultiple" BOOLEAN NOT NULL DEFAULT false,
            ADD COLUMN IF NOT EXISTS "totalCount" INTEGER,
            ADD COLUMN IF NOT EXISTS "failCount" INTEGER,
            ADD COLUMN IF NOT EXISTS "inspectionMethod" TEXT;
        `);

        console.log('Database updated successfully.');
    } catch (err) {
        console.error('Error updating database:', err);
    } finally {
        await client.end();
    }
}

updateSchema();
