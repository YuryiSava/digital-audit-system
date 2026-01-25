require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkRequirements() {
    const normId = 'c3cf3466-0081-4ca1-a3b1-cc75ea70769b';

    console.log('\n🔍 Checking requirements for norm:', normId);

    const { data: requirements, error } = await supabase
        .from('requirements')
        .select('*')
        .eq('normSourceId', normId);

    if (error) {
        console.error('❌ Error:', error);
        return;
    }

    console.log(`\n✅ Found ${requirements.length} requirements\n`);

    if (requirements.length > 0) {
        requirements.slice(0, 5).forEach((req, idx) => {
            console.log(`${idx + 1}. [${req.clause}] ${req.requirementTextShort}`);
            console.log(`   System: ${req.systemId} | Tags: ${req.tags?.join(', ') || 'none'}\n`);
        });
    } else {
        console.log('⚠️  No requirements found! Parser may have failed silently.');
    }
}

checkRequirements();
