const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function inspect() {
    console.log('Inspecting users...');
    const { data, error } = await supabase.from('user_profiles').select('*');
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Users found:', data);
    }
}

inspect();
