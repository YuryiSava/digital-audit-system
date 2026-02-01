require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkFragments() {
    const normId = '452c6587-bd11-4058-b2e7-9476b037e1dd';

    console.log('\n🔍 ПРОВЕРКА RAW ФРАГМЕНТОВ В БД\n');
    console.log('='.repeat(70) + '\n');

    const { data: fragments, error } = await supabase
        .from('raw_norm_fragments')
        .select('*')
        .eq('normSourceId', normId);

    if (error) {
        console.error('❌ Ошибка:', error);
        return;
    }

    console.log(`📦 Всего фрагментов: ${fragments?.length || 0}\n`);

    if (fragments && fragments.length > 0) {
        const statusCounts = {
            PENDING: 0,
            APPROVED: 0,
            REJECTED: 0,
            CONVERTED: 0
        };

        fragments.forEach(f => {
            statusCounts[f.status] = (statusCounts[f.status] || 0) + 1;
        });

        console.log('📊 По статусам:');
        console.log(`   🟡 PENDING (Ожидают проверки): ${statusCounts.PENDING}`);
        console.log(`   🟢 APPROVED (Одобрено):        ${statusCounts.APPROVED}`);
        console.log(`   🔴 REJECTED (Отклонено):       ${statusCounts.REJECTED}`);
        console.log(`   🔵 CONVERTED (Конвертировано): ${statusCounts.CONVERTED}\n`);

        console.log('📄 Первые 3 фрагмента:\n');
        fragments.slice(0, 3).forEach((f, idx) => {
            console.log(`${idx + 1}. [${f.sourceClause || 'N/A'}] ${f.status}`);
            console.log(`   ${f.rawText.substring(0, 100)}...`);
            console.log(`   Type: ${f.predictedRequirementType || 'N/A'} | Modality: ${f.detectedModality || 'N/A'}\n`);
        });

        console.log('='.repeat(70));
        console.log('✅ ФРАГМЕНТЫ ГОТОВЫ К ПРОВЕРКЕ!\n');
        console.log('🌐 Откройте: http://localhost:3000/norm-library/452c6587-bd11-4058-b2e7-9476b037e1dd');
        console.log('📌 Перейдите на вкладку "RAW Фрагменты"');
        console.log('✓ Проверьте каждый фрагмент');
        console.log('✓ Одобрите нужные (зеленая кнопка)');
        console.log('✓ Отклоните мусор (красная кнопка)');
        console.log('✓ Нажмите "Конвертировать" чтобы создать требования из одобренных\n');
    } else {
        console.log('⚠️  Фрагменты не найдены!\n');
    }
}

checkFragments().catch(console.error);
