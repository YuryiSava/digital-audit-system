require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials!');
    console.log('URL:', supabaseUrl);
    console.log('Key:', supabaseKey ? 'Present' : 'Missing');
    process.exit(1);
}

console.log('✅ Supabase configured');
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanDatabase() {
    try {
        // Find all ghost files
        console.log('\n🔍 Searching for ghost files...');
        const { data: ghostFiles, error: fetchError } = await supabase
            .from('norm_files')
            .select('*')
            .or('storageUrl.ilike.%test/data%,storageUrl.ilike.%test\\data%');

        if (fetchError) {
            console.error('❌ Error fetching:', fetchError);
            return;
        }

        console.log(`\n📊 Found ${ghostFiles.length} ghost files:\n`);
        ghostFiles.forEach((file, idx) => {
            console.log(`${idx + 1}. ID: ${file.id}`);
            console.log(`   File: ${file.fileName}`);
            console.log(`   Path: ${file.storageUrl}\n`);
        });

        if (ghostFiles.length === 0) {
            console.log('✅ No ghost files found! Database is clean.');
            return;
        }

        // Delete them
        console.log('🗑️  Deleting ghost files...');
        const ids = ghostFiles.map(f => f.id);

        const { error: deleteError } = await supabase
            .from('norm_files')
            .delete()
            .in('id', ids);

        if (deleteError) {
            console.error('❌ Error deleting:', deleteError);
            return;
        }

        console.log(`\n✅ Successfully deleted ${ids.length} ghost files!`);

    } catch (err) {
        console.error('❌ Unexpected error:', err);
    }
}

cleanDatabase();
