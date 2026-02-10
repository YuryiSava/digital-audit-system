/**
 * Скрипт для выгрузки образцов фрагментов из БД
 * Запуск: node scripts/export-fragment-samples.js
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function exportSamples() {
    console.log('📊 Выгрузка образцов фрагментов...\n');

    // Получить последние фрагменты
    const { data: fragments, error } = await supabase
        .from('raw_norm_fragments')
        .select('fragmentId, sourceSection, sourceClause, rawText, detectedModality, predictedRequirementType, confidenceScore')
        .order('createdAt', { ascending: false })
        .limit(20);

    if (error) {
        console.error('❌ Ошибка:', error.message);
        return;
    }

    if (!fragments || fragments.length === 0) {
        console.log('⚠️ Фрагменты не найдены');
        return;
    }

    console.log(`✅ Найдено ${fragments.length} фрагментов\n`);
    console.log('='.repeat(100));

    fragments.forEach((f, i) => {
        console.log(`\n📋 ФРАГМЕНТ ${i + 1} [${f.fragmentId}]`);
        console.log('-'.repeat(80));
        console.log(`Раздел: ${f.sourceSection || 'не указан'}`);
        console.log(`Пункт: ${f.sourceClause || 'не указан'}`);
        console.log(`Модальность: ${f.detectedModality || 'не определена'}`);
        console.log(`Тип требования: ${f.predictedRequirementType || 'не определен'}`);
        console.log(`Уверенность: ${f.confidenceScore || 'N/A'}`);
        console.log(`\n📝 ТЕКСТ:`);
        console.log(f.rawText);
        console.log('='.repeat(100));
    });
}

exportSamples();
