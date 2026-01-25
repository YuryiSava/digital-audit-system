require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkResults() {
    const normId = 'c3cf3466-0081-4ca1-a3b1-cc75ea70769b';

    console.log('\n📊 Результаты парсинга СН РК 2.02-01-2023:\n');

    const { data: requirements } = await supabase
        .from('requirements')
        .select('clause, systemId, requirementTextShort, tags, checkMethod')
        .eq('normSourceId', normId)
        .order('clause');

    if (!requirements || requirements.length === 0) {
        console.log('❌ Требования не найдены!');
        return;
    }

    console.log(`✅ Всего требований: ${requirements.length}\n`);

    // Группировка по системам
    const bySystem = {};
    requirements.forEach(r => {
        bySystem[r.systemId] = (bySystem[r.systemId] || 0) + 1;
    });

    console.log('📋 По системам:');
    Object.entries(bySystem).sort((a, b) => b[1] - a[1]).forEach(([sys, count]) => {
        console.log(`   ${sys.padEnd(20)} : ${count}`);
    });

    console.log('\n📝 Примеры требований:\n');

    // Примеры по каждой системе
    const systemsToShow = ['FIRE_GENERAL', 'APS', 'SOUE', 'FIRE_POWER'];
    systemsToShow.forEach(sys => {
        const example = requirements.find(r => r.systemId === sys);
        if (example) {
            console.log(`${sys}:`);
            console.log(`  [${example.clause}] ${example.requirementTextShort?.substring(0, 80)}...`);
            console.log(`  Tags: ${example.tags?.join(', ') || 'none'}`);
            console.log('');
        }
    });

    // Проверка cross-system requirements
    const withMultipleSystems = requirements.filter(r =>
        r.tags && r.tags.some(tag =>
            tag === 'APS' || tag === 'SOUE' || tag === 'FIRE_POWER' || tag === 'AUPT'
        )
    );

    console.log(`\n🔗 Cross-system требований: ${withMultipleSystems.length}`);
    if (withMultipleSystems.length > 0) {
        const example = withMultipleSystems[0];
        console.log(`\nПример:`);
        console.log(`  SystemId: ${example.systemId}`);
        console.log(`  Tags: ${example.tags?.join(', ')}`);
        console.log(`  Text: ${example.requirementTextShort?.substring(0, 100)}...`);
    }
}

checkResults();
