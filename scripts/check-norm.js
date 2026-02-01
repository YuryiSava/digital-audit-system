#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkNorm(normId) {
    console.log(`\n🔍 Checking norm: ${normId}\n`);

    const { data: norm } = await supabase
        .from('norm_sources')
        .select('*')
        .eq('id', normId)
        .single();

    if (!norm) {
        console.log('❌ Norm not found!');
        return;
    }

    console.log('📄 Norm details:');
    console.log(`  Code: ${norm.code}`);
    console.log(`  Title: ${norm.title}`);
    console.log(`  ID: ${norm.id}\n`);

    const { data: files } = await supabase
        .from('norm_files')
        .select('*')
        .eq('normSourceId', normId);

    console.log(`📁 Files: ${files?.length || 0}`);
    if (files && files.length > 0) {
        files.forEach(f => {
            console.log(`  - ${f.fileName}`);
            console.log(`    URL: ${f.storageUrl}`);
        });
    }

    const { data: fragments } = await supabase
        .from('raw_norm_fragments')
        .select('*')
        .eq('normSourceId', normId);

    console.log(`\n📦 Fragments: ${fragments?.length || 0}`);
}

const normId = process.argv[2] || 'ef1e40bc-ee2e-4b17-98e1-bb727f3d14fb';
checkNorm(normId);
