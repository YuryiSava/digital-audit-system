require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkRequirementSets() {
    const { data, error } = await supabase
        .from('requirement_sets')
        .select('*')
        .limit(5);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('\n📊 Requirement Sets in database:', data.length);
    data.forEach(set => {
        console.log(`\n- ${set.requirementSetId}`);
        console.log(`  ID: ${set.id}`);
        console.log(`  System: ${set.systemId}`);
        console.log(`  Status: ${set.status}`);
    });

    if (data.length === 0) {
        console.log('\n⚠️  No requirement sets found!');
        console.log('We need to create one manually or fix the schema.');
    }
}

checkRequirementSets();
