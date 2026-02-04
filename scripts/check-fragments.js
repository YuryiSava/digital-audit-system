/**
 * Скрипт для проверки наличия фрагментов после парсинга
 * Использование: node scripts/check-fragments.js <norm_source_id>
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const normSourceId = process.argv[2] || 'a339a46c-33f5-4945-abc0-bee817ec15c7';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Не найдены переменные окружения');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFragments() {
    console.log(`🔍 Проверка фрагментов для документа: ${normSourceId}...\n`);

    // 1. Проверяем статус документа
    const { data: norm, error: normError } = await supabase
        .from('norm_sources')
        .select('title, code, status, parsing_details')
        .eq('id', normSourceId)
        .single();

    if (normError) {
        console.error('❌ Ошибка получения документа:', normError.message);
        return;
    }

    console.log(`📄 Документ: ${norm.title || norm.code || normSourceId}`);
    console.log(`📊 Статус: ${norm.status}`);
    console.log(`📝 Детали: ${norm.parsing_details || 'нет'}\n`);

    // 2. Проверяем фрагменты
    const { data: fragments, error: fragError, count } = await supabase
        .from('raw_norm_fragments')
        .select('*', { count: 'exact' })
        .eq('normSourceId', normSourceId);

    if (fragError) {
        console.error('❌ Ошибка получения фрагментов:', fragError.message);
        return;
    }

    console.log(`✅ Найдено фрагментов: ${count || 0}`);

    if (fragments && fragments.length > 0) {
        console.log('\n📋 Первые 3 фрагмента:');
        fragments.slice(0, 3).forEach((f, i) => {
            console.log(`\n${i + 1}. ${f.sourceSection || 'без раздела'} - ${f.sourceClause || 'без пункта'}`);
            console.log(`   Текст: ${f.rawText?.substring(0, 100)}...`);
        });
    } else {
        console.log('\n⚠️  Фрагменты не найдены!');
        console.log('Возможно, парсинг завершился с ошибкой или не до конца.');
    }
}

checkFragments();
