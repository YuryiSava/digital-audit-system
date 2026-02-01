import dotenv from 'dotenv';
import pg from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const { Client } = pg;

async function applyMigration() {
    console.log('🔧 Applying RLS fix for requirement_sets...\n');

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        throw new Error('DATABASE_URL not found in environment');
    }

    const client = new Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connected to database\n');

        const sqlPath = join(process.cwd(), 'supabase', 'migrations', '20260201_fix_requirement_sets_rls.sql');
        const sql = readFileSync(sqlPath, 'utf-8');

        console.log('📝 Executing migration...\n');
        await client.query(sql);

        console.log('✅ RLS policies updated successfully!\n');
        console.log('📋 Applied policies:');
        console.log('   1. Public users can read PUBLISHED/ACTIVE sets');
        console.log('   2. Authenticated users can read all sets');
        console.log('   3. Only ADMIN/NORMATIVIST can modify sets\n');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await client.end();
    }
}

applyMigration()
    .then(() => {
        console.log('🎯 Now refresh the Pre-Audit Setup page - requirement sets should appear!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Fatal error:', error);
        process.exit(1);
    });
