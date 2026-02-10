
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAll() {
    console.log('🔍 Listing all norm_files paths...');

    const { data: files, error } = await supabase
        .from('norm_files')
        .select('id, normSourceId, storageUrl')
        .limit(20);

    if (error) {
        console.error('❌ Error:', error);
        return;
    }

    files.forEach(f => {
        console.log(`[${f.id}] Source: ${f.normSourceId}`);
        console.log(`    URL: ${f.storageUrl}`);
    });
}

checkAll();
