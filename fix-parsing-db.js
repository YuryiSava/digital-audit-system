
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function fix() {
    console.log('Searching for broken seeded files...');
    // Look for files with 'test/data' in url which are the seeded ones causing issues
    const { data: files } = await supabase
        .from('norm_files')
        .select('id, storageUrl')
        .ilike('storageUrl', '%test/data%');

    console.log(`Found ${files?.length || 0} broken files.`);

    if (files && files.length > 0) {
        const ids = files.map(f => f.id);
        const { error } = await supabase
            .from('norm_files')
            .delete()
            .in('id', ids);

        if (error) console.error('Delete error:', error);
        else console.log('Successfully deleted broken file records from database.');
    } else {
        console.log('No broken files found.');
    }
}
fix();
