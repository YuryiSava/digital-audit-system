require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function safeCleanup() {
    const normId = 'c3cf3466-0081-4ca1-a3b1-cc75ea70769b'; // СН РК 2.02-01-2023

    console.log('\n🔍 Step 1: Checking requirements for norm:', normId);

    const { data: requirements } = await supabase
        .from('requirements')
        .select('id, requirementId, createdBy')
        .eq('normSourceId', normId);

    console.log(`   Found ${requirements?.length || 0} requirements`);

    if (!requirements || requirements.length === 0) {
        console.log('✅ No requirements to clean up');
        return;
    }

    // Get requirement IDs
    const reqIds = requirements.map(r => r.id);

    console.log('\n🔍 Step 2: Checking audit results that use these requirements...');

    const { data: auditResults } = await supabase
        .from('audit_results')
        .select('id, requirementId')
        .in('requirementId', reqIds);

    console.log(`   Found ${auditResults?.length || 0} audit results using these requirements`);

    if (auditResults && auditResults.length > 0) {
        console.log('\n⚠️  WARNING: These requirements are used in audits!');
        console.log('   Deleting audit results first...');

        const { error: auditError } = await supabase
            .from('audit_results')
            .delete()
            .in('requirementId', reqIds);

        if (auditError) {
            console.error('❌ Error deleting audit results:', auditError);
            return;
        }

        console.log(`   ✅ Deleted ${auditResults.length} audit results`);
    }

    console.log('\n🗑️  Step 3: Deleting requirements...');

    const { error } = await supabase
        .from('requirements')
        .delete()
        .eq('normSourceId', normId);

    if (error) {
        console.error('❌ Error deleting requirements:', error);
    } else {
        console.log(`✅ Successfully deleted ${requirements.length} requirements`);
        console.log('\n🎯 Ready to re-parse!');
    }
}

safeCleanup();
