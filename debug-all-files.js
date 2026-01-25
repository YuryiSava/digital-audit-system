require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllFiles() {
    console.log('Fetching ALL norm files from database...\n');

    const { data: files, error } = await supabase
        .from('norm_files')
        .select('*')
        .order('createdAt', { ascending: false });

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Total files in DB: ${files.length}\n`);

    files.forEach((file, idx) => {
        console.log(`${idx + 1}. [ID: ${file.id}]`);
        console.log(`   File: ${file.fileName}`);
        console.log(`   Path: ${file.storageUrl}`);
        console.log(`   Created: ${file.createdAt}`);

        if (file.storageUrl.includes('test/data')) {
            console.log(`   ⚠️  GHOST FILE - contains test/data!`);
        }
        console.log('');
    });

    const ghostFiles = files.filter(f => f.storageUrl.includes('test/data'));
    console.log(`\n🔴 Found ${ghostFiles.length} ghost files with test/data paths`);
}

checkAllFiles().catch(console.error);
