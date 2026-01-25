require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkNorm() {
    // Find the norm
    console.log('🔍 Searching for norm "CH РК 2.02-01-2023"...\n');

    const { data: norms, error: normError } = await supabase
        .from('norm_sources')
        .select('*')
        .ilike('code', '%2.02-01-2023%');

    if (normError) {
        console.error('❌ Error:', normError);
        return;
    }

    if (!norms || norms.length === 0) {
        console.log('❌ Norm not found');
        return;
    }

    console.log(`✅ Found ${norms.length} matching norm(s):\n`);

    for (const norm of norms) {
        console.log(`📋 Norm ID: ${norm.id}`);
        console.log(`   Code: ${norm.code}`);
        console.log(`   Type: ${norm.type}`);
        console.log('');

        // Get all files for this norm
        const { data: files, error: filesError } = await supabase
            .from('norm_files')
            .select('*')
            .eq('normId', norm.id);

        if (filesError) {
            console.error('❌ Files error:', filesError);
            continue;
        }

        console.log(`   📁 Files attached to this norm: ${files.length}\n`);

        files.forEach((file, idx) => {
            console.log(`   ${idx + 1}. ID: ${file.id}`);
            console.log(`      Name: ${file.fileName}`);
            console.log(`      Path: ${file.storageUrl}`);
            console.log(`      Created: ${file.createdAt}`);

            if (file.storageUrl.includes('test/data') || file.storageUrl.includes('test\\data')) {
                console.log(`      🔴 GHOST FILE DETECTED!`);
            }
            console.log('');
        });
    }
}

checkNorm().catch(console.error);
