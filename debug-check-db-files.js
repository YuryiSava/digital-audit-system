
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkFiles() {
    console.log('Checking recent norm files...');
    const { data: files, error } = await supabase
        .from('norm_files')
        .select('id, fileName, storageUrl, uploadedAt')
        .order('uploadedAt', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Found latest 5 files in DB:');
    files.forEach(f => {
        console.log(`- [${f.uploadedAt}] ${f.fileName}`);
        console.log(`  Path: ${f.storageUrl}`);
    });
}

checkFiles();
