
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDuplicates() {
    console.log('🔍 Checking for sources with multiple files...');

    const { data: files, error } = await supabase
        .from('norm_files')
        .select('*')
        .order('uploadedAt', { ascending: false }); // Get ALL files

    if (error) {
        console.error('❌ Error:', error);
        return;
    }

    if (!files) {
        console.log('No files found.');
        return;
    }

    const counts = {};
    files.forEach(f => {
        counts[f.normSourceId] = (counts[f.normSourceId] || 0) + 1;
    });

    Object.entries(counts).forEach(([sourceId, count]) => {
        if (count > 1) {
            console.log(`⚠️ Source ${sourceId} has ${count} files!`);
            const sourceFiles = files.filter(f => f.normSourceId === sourceId);
            sourceFiles.forEach(f => console.log(`   - [${f.id}] ${f.storageUrl}`));
        }
    });
}

checkDuplicates();
