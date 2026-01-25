require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugNormPage() {
    const normId = 'c3cf3466-0081-4ca1-a3b1-cc75ea70769b';

    console.log('\n🔍 DEBUG: Fetching norm data...\n');

    // Same logic as getNormById
    const { data: normData, error: normError } = await supabase
        .from('norm_sources')
        .select('*')
        .eq('id', normId)
        .single();

    console.log('1. Norm Data:', normError ? `ERROR: ${normError.message}` : `✅ Found: ${normData.code}`);

    const { data: filesData } = await supabase
        .from('norm_files')
        .select('*')
        .eq('normSourceId', normId);

    console.log(`2. Files: ✅ ${filesData?.length || 0} files`);

    const { data: requirementsData } = await supabase
        .from('requirements')
        .select('*')
        .eq('normSourceId', normId);

    console.log(`3. Requirements: ✅ ${requirementsData?.length || 0} requirements`);

    if (requirementsData && requirementsData.length > 0) {
        console.log('\n📋 Sample Requirements:');
        requirementsData.slice(0, 3).forEach((req, idx) => {
            console.log(`   ${idx + 1}. [${req.clause}] ${req.requirementTextShort?.substring(0, 60)}...`);
        });
    } else {
        console.log('\n❌ NO REQUIREMENTS FOUND!');
        console.log('\nLet\'s check if they exist at all:');

        const { data: allReqs, error: allError } = await supabase
            .from('requirements')
            .select('normSourceId, clause')
            .limit(5);

        console.log('All requirements in DB:', allReqs?.length || 0);
        if (allReqs && allReqs.length > 0) {
            console.log('Sample normSourceIds:', allReqs.map(r => r.normSourceId).join(', '));
        }
    }

    const combined = {
        ...normData,
        files: filesData || [],
        requirements: requirementsData || []
    };

    console.log('\n📦 Final combined object:');
    console.log(`   - Norm: ${combined.code}`);
    console.log(`   - Files: ${combined.files.length}`);
    console.log(`   - Requirements: ${combined.requirements.length}`);
}

debugNormPage();
