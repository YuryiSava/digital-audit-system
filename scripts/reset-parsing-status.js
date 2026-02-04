/**
 * Скрипт для сброса застрявшего статуса парсинга
 * Использование: node scripts/reset-parsing-status.js <norm_source_id>
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const normSourceId = process.argv[2];

if (!normSourceId) {
    console.error('❌ Укажите ID документа:');
    console.error('   node scripts/reset-parsing-status.js <norm_source_id>');
    console.error('\nПример:');
    console.error('   node scripts/reset-parsing-status.js a339a46c-33f5-4945-abc0-bee817ec15c7');
    process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Не найдены переменные окружения NEXT_PUBLIC_SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY');
    console.error('   Проверьте файл .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetStatus() {
    console.log(`🔄 Сброс статуса для документа: ${normSourceId}...`);

    const { data, error } = await supabase
        .from('norm_sources')
        .update({
            status: 'DRAFT',
            parsing_details: null,
            updatedAt: new Date().toISOString()
        })
        .eq('id', normSourceId)
        .select();

    if (error) {
        console.error('❌ Ошибка:', error.message);
        process.exit(1);
    }

    if (!data || data.length === 0) {
        console.error('❌ Документ не найден в базе данных');
        process.exit(1);
    }

    console.log('✅ Статус успешно сброшен!');
    console.log('📋 Обновленный документ:', data[0].name || data[0].id);
    console.log('🔄 Обновите страницу в браузере (F5)');
}

resetStatus();
