require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
    console.log('🔍 Finding test checklist...\n');

    const { data: projects } = await supabase
        .from('projects')
        .select('id, name, status')
        .order('createdAt', { ascending: false })
        .limit(3);

    if (!projects || projects.length === 0) {
        console.log('❌ No projects found');
        return;
    }

    console.log('Recent projects:');
    projects.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.name} (${p.status})`);
    });
    console.log('');

    const projectId = projects[0].id;
    const { data: checklists } = await supabase
        .from('audit_checklists')
        .select('id, status')
        .eq('projectId', projectId);

    console.log(`Using: "${projects[0].name}"`);
    console.log(`Checklists: ${checklists?.length || 0}`);

    if (checklists && checklists.length > 0) {
        const checklistId = checklists[0].id;
        console.log('');
        console.log('🔗 DESKTOP: Open in browser:');
        console.log(`   http://localhost:3000/field/checklist/${checklistId}`);
        console.log('');
        console.log('📱 MOBILE: Open on phone:');
        console.log(`   http://192.168.1.65:3000/field/checklist/${checklistId}`);
        console.log('');
        console.log('🧪 TEST PLAN:');
        console.log('  1. Open checklist on mobile');
        console.log('  2. Fill 2-3 items (status + comment)');
        console.log('  3. Turn OFF Wi-Fi');
        console.log('  4. Fill 2 more items offline');
        console.log('  5. Turn ON Wi-Fi');
        console.log('  6. Check sync indicator');
    } else {
        console.log('');
        console.log('❌ No checklists found for this project');
        console.log('   Create a new checklist first');
    }
})();
