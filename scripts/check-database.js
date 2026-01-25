require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkDatabase() {
    console.log('\n📊 Статистика базы данных:\n');

    // Norms
    const { data: norms, count: normsCount } = await supabase
        .from('norm_sources')
        .select('*', { count: 'exact' });

    console.log(`📚 Нормативы: ${normsCount || 0}`);

    // Files
    const { count: filesCount } = await supabase
        .from('norm_files')
        .select('*', { count: 'exact', head: true });

    console.log(`📄 PDF файлов: ${filesCount || 0}`);

    // Requirements
    const { data: requirements, count: reqsCount } = await supabase
        .from('requirements')
        .select('systemId, createdBy', { count: 'exact' });

    console.log(`✅ Требований: ${reqsCount || 0}`);

    if (requirements && requirements.length > 0) {
        // Group by system
        const bySystem = {};
        requirements.forEach(r => {
            bySystem[r.systemId] = (bySystem[r.systemId] || 0) + 1;
        });

        console.log('\n   По системам:');
        Object.entries(bySystem).forEach(([sys, count]) => {
            console.log(`   - ${sys}: ${count}`);
        });

        // By source
        const bySource = {};
        requirements.forEach(r => {
            bySource[r.createdBy] = (bySource[r.createdBy] || 0) + 1;
        });

        console.log('\n   По источнику:');
        Object.entries(bySource).forEach(([src, count]) => {
            console.log(`   - ${src}: ${count}`);
        });
    }

    // Projects
    const { count: projectsCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true });

    console.log(`\n🏗️  Проектов: ${projectsCount || 0}`);

    // Checklists
    const { count: checklistsCount } = await supabase
        .from('checklists')
        .select('*', { count: 'exact', head: true });

    console.log(`📋 Чек-листов: ${checklistsCount || 0}`);

    // Audit results
    const { count: auditsCount } = await supabase
        .from('audit_results')
        .select('*', { count: 'exact', head: true });

    console.log(`🔍 Результатов аудита: ${auditsCount || 0}`);

    console.log('\n' + '─'.repeat(40));
    console.log('✅ База готова к работе!');
}

checkDatabase();
