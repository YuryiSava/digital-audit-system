const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listNorms() {
    console.log('Checking norms...');
    const { data, error } = await supabase
        .from('norm_sources')
        .select('code, title')
        .limit(10);

    if (error) console.error(error);
    else console.log(JSON.stringify(data, null, 2));
}

listNorms();
