#!/usr/bin/env node
/**
 * Откат автоматически созданных требований
 * Удаляет требования созданные ai-parser-v2 без валидации
 */

require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function rollbackAutoRequirements(normId) {
    console.log('\n🔄 ОТКАТ АВТОМАТИЧЕСКИ СОЗДАННЫХ ТРЕБОВАНИЙ\n');
    console.log('='.repeat(70) + '\n');

    try {
        // Получить информацию о норме
        const { data: norm } = await supabase
            .from('norm_sources')
            .select('*')
            .eq('id', normId)
            .single();

        if (!norm) {
            throw new Error('Норма не найдена');
        }

        console.log(`📋 Норма: ${norm.code} - ${norm.title}\n`);

        // Подсчитать автоматически созданные требования
        const { data: autoReqs, error: countError } = await supabase
            .from('requirements')
            .select('*')
            .eq('normSourceId', normId)
            .eq('createdBy', 'ai-parser-v2');

        if (countError) {
            throw new Error(`Ошибка подсчета: ${countError.message}`);
        }

        console.log(`⚠️  Найдено автоматически созданных требований: ${autoReqs?.length || 0}`);

        if (!autoReqs || autoReqs.length === 0) {
            console.log('✅ Нет автоматических требований для удаления\n');
            return;
        }

        // Показать примеры
        console.log('\n📄 Примеры требований для удаления:');
        autoReqs.slice(0, 5).forEach((req, idx) => {
            console.log(`   ${idx + 1}. [${req.clause}] ${req.requirementTextShort.substring(0, 60)}...`);
        });

        console.log(`\n🗑️  Удаление ${autoReqs.length} автоматических требований...\n`);

        // Удалить
        const { error: deleteError } = await supabase
            .from('requirements')
            .delete()
            .eq('normSourceId', normId)
            .eq('createdBy', 'ai-parser-v2');

        if (deleteError) {
            throw new Error(`Ошибка удаления: ${deleteError.message}`);
        }

        console.log(`✅ Удалено ${autoReqs.length} требований\n`);

        // Проверка
        const { data: remaining } = await supabase
            .from('requirements')
            .select('id')
            .eq('normSourceId', normId);

        console.log(`📊 Осталось требований: ${remaining?.length || 0}\n`);

        console.log('='.repeat(70));
        console.log('✅ ОТКАТ ЗАВЕРШЕН!\n');

    } catch (error) {
        console.error('\n❌ ОШИБКА:', error.message);
        throw error;
    }
}

// CLI
const normId = process.argv[2];

if (!normId) {
    console.error('\n❌ Использование: node rollback-auto-requirements.js <norm-id>\n');
    console.error('Пример: node rollback-auto-requirements.js 452c6587-bd11-4058-b2e7-9476b037e1dd\n');
    process.exit(1);
}

rollbackAutoRequirements(normId);
