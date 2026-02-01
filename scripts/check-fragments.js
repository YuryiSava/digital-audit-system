#!/usr/bin/env node
/**
 * Проверка фрагментов в базе данных
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkFragments() {
    console.log('\n🔍 Checking raw_norm_fragments table...\n');

    // Get all fragments
    const { data: fragments, error } = await supabase
        .from('raw_norm_fragments')
        .select('*')
        .order('createdAt', { ascending: false });

    if (error) {
        console.error('❌ Error:', error.message);
        return;
    }

    console.log(`📊 Total fragments in database: ${fragments.length}\n`);

    if (fragments.length === 0) {
        console.log('⚠️  No fragments found in database!');
        console.log('\nPossible reasons:');
        console.log('1. Parser failed to save to database');
        console.log('2. Wrong database connection');
        console.log('3. Table does not exist\n');
        return;
    }

    // Group by normSourceId
    const byNorm = {};
    fragments.forEach(f => {
        if (!byNorm[f.normSourceId]) {
            byNorm[f.normSourceId] = [];
        }
        byNorm[f.normSourceId].push(f);
    });

    console.log('📋 Fragments by norm:\n');
    for (const [normId, frags] of Object.entries(byNorm)) {
        console.log(`  ${normId}: ${frags.length} fragments`);
        console.log(`    Status breakdown:`);

        const statuses = {};
        frags.forEach(f => {
            statuses[f.status] = (statuses[f.status] || 0) + 1;
        });

        for (const [status, count] of Object.entries(statuses)) {
            console.log(`      ${status}: ${count}`);
        }
        console.log('');
    }

    // Show last 5 fragments
    console.log('📄 Last 5 fragments:\n');
    fragments.slice(0, 5).forEach((f, i) => {
        console.log(`${i + 1}. ${f.fragmentId}`);
        console.log(`   Norm: ${f.normSourceId}`);
        console.log(`   Clause: ${f.sourceClause || 'N/A'}`);
        console.log(`   Status: ${f.status}`);
        console.log(`   Text: ${f.rawText.substring(0, 100)}...`);
        console.log('');
    });
}

checkFragments().catch(console.error);
