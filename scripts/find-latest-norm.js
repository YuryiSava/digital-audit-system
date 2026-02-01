require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function findLatestNorm() {
    console.log('🔍 Looking for latest norm...');

    // Get latest norm
    const { data: norms, error } = await supabase
        .from('norm_sources')
        .select('id, code, title, updatedAt')
        .order('updatedAt', { ascending: false })
        .limit(1);

    if (error) {
        console.error('❌ Error:', error.message);
        return;
    }

    if (norms && norms.length > 0) {
        const norm = norms[0];
        console.log(`✅ Latest Norm Found:`);
        console.log(`   ID: ${norm.id}`);
        console.log(`   Code: ${norm.code}`);
        console.log(`   Title: ${norm.title}`);
        console.log(`   Updated: ${new Date(norm.updatedAt).toLocaleString()}`);
        console.log('\n🚀 To run manual parsing:');
        console.log(`   node scripts/parse-pdf-universal.js DIRECT ${norm.id}`);
    } else {
        console.log('❌ No norms found.');
    }
}

findLatestNorm();
