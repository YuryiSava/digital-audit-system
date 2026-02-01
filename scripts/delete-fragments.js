#!/usr/bin/env node
/**
 * Удаление всех фрагментов для норматива
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function deleteFragments(normSourceId) {
    console.log(`\n🗑️  Deleting fragments for norm: ${normSourceId}\n`);

    const { data, error } = await supabase
        .from('raw_norm_fragments')
        .delete()
        .eq('normSourceId', normSourceId);

    if (error) {
        console.error('❌ Error:', error.message);
        return;
    }

    console.log('✅ Fragments deleted successfully!\n');
}

const normId = process.argv[2];
if (!normId) {
    console.log('Usage: node delete-fragments.js <norm-source-id>');
    console.log('Example: node delete-fragments.js ef1e40bc-ee2e-4b17-98e1-bb727f3d14fb');
    process.exit(1);
}

deleteFragments(normId);
