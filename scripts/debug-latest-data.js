require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkData() {
    console.log('Checking recent data...');

    // 1. Check latest updated source
    const { data: sources, error: sourceError } = await supabase
        .from('norm_sources')
        .select('id, title, status, parsing_details, updatedAt')
        .order('updatedAt', { ascending: false })
        .limit(1);

    if (sourceError) {
        console.error('Error fetching sources:', sourceError);
        return;
    }

    if (!sources || sources.length === 0) {
        console.log('No sources found.');
        return;
    }

    const latestSource = sources[0];
    console.log('Latest Source:', latestSource);

    // 2. Check fragments for this source
    const { data: fragments, error: fragError, count } = await supabase
        .from('raw_norm_fragments')
        .select('id, rawText, createdAt', { count: 'exact' })
        .eq('normSourceId', latestSource.id)
        .order('createdAt', { ascending: false });

    if (fragError) {
        console.error('Error fetching fragments:', fragError);
    } else {
        console.log(`Found ${count} fragments for source ${latestSource.id}`);
        if (fragments.length > 0) {
            console.log('Sample fragment:', fragments[0]);
        } else {
            console.log('WARNING: No fragments found despite parsing finishing!');
        }
    }
}

checkData();
