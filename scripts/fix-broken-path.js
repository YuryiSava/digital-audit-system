
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixPath() {
    console.log('🔍 Searching for broken file records...');

    // 1. Find the record with the bad path
    // We look for any record containing '05-versions-space.pdf'
    const { data: badFiles, error } = await supabase
        .from('norm_files')
        .select('*')
        .ilike('storageUrl', '%05-versions-space.pdf%');

    if (error) {
        console.error('❌ Error searching:', error);
        return;
    }

    if (!badFiles || badFiles.length === 0) {
        console.log('✅ No broken records found! (Maybe already fixed?)');
        return;
    }

    console.log(`⚠️ Found ${badFiles.length} broken records.`);

    // 2. The correct absolute path for the user's uploaded file
    // We use the full absolute path since our parser supports it (as seen in universal-parser.ts logic)
    const CORRECT_PATH = String.raw`D:\digital-audit-system\public\uploads\norms\1769314049178-PUE_Respubliki_Kazakhstanstr._.pdf`;

    for (const file of badFiles) {
        console.log(`   Fixing record ID: ${file.id} (Source: ${file.normSourceId})`);
        console.log(`   Old Path: ${file.storageUrl}`);

        const { error: updateError } = await supabase
            .from('norm_files')
            .update({ storageUrl: CORRECT_PATH })
            .eq('id', file.id);

        if (updateError) {
            console.error('   ❌ Update failed:', updateError);
        } else {
            console.log(`   ✅ Corrected to: ${CORRECT_PATH}`);
        }
    }
}

fixPath();
