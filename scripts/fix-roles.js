const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
    console.log('--- DB FIX START ---');

    // 1. Upgrade all users to admin
    const { error: uError } = await supabase
        .from('user_profiles')
        .update({ role: 'admin' })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // hack to update all

    if (uError) console.error('Error upgrading users:', uError);
    else console.log('✅ All users upgraded to admin');

    // 2. Assign all projects to everyone? 
    // Actually as admins they will see everything now without assignments.

    console.log('--- DB FIX END ---');
}

fix();
