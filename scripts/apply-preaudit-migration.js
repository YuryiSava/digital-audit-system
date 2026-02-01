#!/usr/bin/env node
/**
 * Apply Pre-Audit fields migration to projects table
 * This script uses Supabase client to execute SQL migration
 */

require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function runMigration() {
    console.log('🔄 Running Pre-Audit fields migration...\n');

    try {
        // Read SQL file
        const sqlPath = path.join(__dirname, '..', 'migrations', 'add_project_preaudit_fields.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('📄 SQL Migration:');
        console.log('─'.repeat(60));
        console.log(sql);
        console.log('─'.repeat(60));
        console.log('');

        // Execute SQL via Supabase RPC
        // Note: This requires a custom SQL function or direct database access
        // For now, let's check if columns already exist

        console.log('🔍 Checking current projects table structure...\n');

        // Try to select a project with new fields
        const { data: testProject, error: testError } = await supabase
            .from('projects')
            .select('id, name, systemsInScope, scopeDepth, baselineFrozen')
            .limit(1);

        if (testError) {
            if (testError.message.includes('column') && testError.message.includes('does not exist')) {
                console.log('❌ New columns do not exist yet.');
                console.log('\n📋 MANUAL STEPS REQUIRED:\n');
                console.log('1. Open Supabase Dashboard: https://supabase.com/dashboard');
                console.log('2. Go to SQL Editor');
                console.log('3. Copy and paste the SQL from: migrations/add_project_preaudit_fields.sql');
                console.log('4. Click "Run" to execute the migration');
                console.log('\nOR use Supabase CLI:');
                console.log('   supabase db execute --file migrations/add_project_preaudit_fields.sql\n');
            } else {
                console.error('❌ Error checking table:', testError.message);
            }
        } else {
            console.log('✅ Migration already applied! New columns exist.');
            console.log('\nCurrent structure includes:');
            console.log('  - systemsInScope (array)');
            console.log('  - scopeDepth (text)');
            console.log('  - scopeExclusions (text)');
            console.log('  - baselineFrozen (boolean)');
            console.log('  - baselineFrozenAt (timestamp)');
            console.log('  - baselineFrozenBy (text)');
        }

    } catch (error) {
        console.error('❌ Migration error:', error.message);
        process.exit(1);
    }
}

runMigration();
