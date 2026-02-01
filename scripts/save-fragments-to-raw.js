#!/usr/bin/env node
/**
 * Сохранение фрагментов в таблицу raw_norm_fragments для валидации
 * НЕ создает requirements автоматически
 */

require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function saveFragmentsToRaw(fragmentsFile, normId) {
    console.log('\n💾 СОХРАНЕНИЕ ФРАГМЕНТОВ В RAW_NORM_FRAGMENTS\n');
    console.log('='.repeat(70) + '\n');

    try {
        // 1. Загрузить фрагменты из файла
        console.log('📂 Step 1: Загрузка фрагментов из файла...');
        const filePath = path.join(process.cwd(), fragmentsFile);
        const rawData = await fs.readFile(filePath, 'utf-8');
        const fragments = JSON.parse(rawData);
        console.log(`   ✅ Загружено ${fragments.length} фрагментов\n`);

        // 2. Получить информацию о норме
        console.log('📋 Step 2: Получение информации о норме...');
        const { data: norm, error: normError } = await supabase
            .from('norm_sources')
            .select('*')
            .eq('id', normId)
            .single();

        if (normError || !norm) {
            throw new Error('Норма не найдена: ' + normError?.message);
        }
        console.log(`   ✅ Норма: ${norm.code} - ${norm.title}\n`);

        // 3. Удалить старые PENDING фрагменты для этой нормы
        console.log('🧹 Step 3: Очистка старых PENDING фрагментов...');
        const { error: deleteError } = await supabase
            .from('raw_norm_fragments')
            .delete()
            .eq('normSourceId', normId)
            .eq('status', 'PENDING');

        if (deleteError) {
            console.warn(`   ⚠️  Ошибка очистки: ${deleteError.message}`);
        } else {
            console.log('   ✅ Старые PENDING фрагменты удалены\n');
        }

        // 4. Преобразовать в RawNormFragment формат
        console.log('🔄 Step 4: Преобразование в формат БД...');

        // Генерируем уникальный префикс из кода нормы
        const normPrefix = norm.code.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 20);
        const timestamp = Date.now().toString().slice(-6); // Последние 6 цифр timestamp для уникальности

        const rawFragments = fragments.map((fragment, index) => ({
            id: uuidv4(),
            fragmentId: `RAW-${normPrefix}-${timestamp}-${String(index + 1).padStart(4, '0')}`,
            normSourceId: normId,
            sourceSection: fragment.source_section || null,
            sourceClause: fragment.source_clause || null,
            rawText: fragment.raw_text || '',
            detectedModality: fragment.detected_modality || null,
            detectedConditions: fragment.detected_conditions || [],
            detectedParameters: fragment.detected_parameters || null,
            predictedRequirementType: fragment.predicted_requirement_type || null,
            confidenceScore: fragment.confidence_score ? parseFloat(fragment.confidence_score) : null,
            status: 'PENDING', // Требуется валидация человеком!
            createdAt: new Date().toISOString(),
            reviewedBy: null,
            convertedToRequirementId: null,
            updatedAt: new Date().toISOString()
        }));

        console.log(`   ✅ Преобразовано ${rawFragments.length} фрагментов\n`);

        // 5. Сохранить пакетами в БД
        console.log('💾 Step 5: Сохранение в базу данных...\n');
        const batchSize = 50;
        let inserted = 0;

        for (let i = 0; i < rawFragments.length; i += batchSize) {
            const batch = rawFragments.slice(i, i + batchSize);

            const { error } = await supabase
                .from('raw_norm_fragments')
                .insert(batch);

            if (error) {
                console.error(`   ❌ Ошибка batch ${Math.floor(i / batchSize) + 1}:`, error.message);
                console.error('   Details:', JSON.stringify(error, null, 2));
            } else {
                inserted += batch.length;
                console.log(`   ✅ Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} фрагментов`);
            }
        }

        console.log(`\n✅ Всего сохранено: ${inserted}/${rawFragments.length} фрагментов\n`);

        // 6. Проверка
        console.log('🔍 Step 6: Проверка...\n');
        const { data: savedFragments, count } = await supabase
            .from('raw_norm_fragments')
            .select('*', { count: 'exact' })
            .eq('normSourceId', normId)
            .eq('status', 'PENDING');

        console.log(`   📊 Фрагментов в статусе PENDING: ${count}\n`);

        // 7. Статистика
        console.log('='.repeat(70));
        console.log('📊 СТАТИСТИКА\n');

        const typeStats = {};
        const modalityStats = {};

        savedFragments.forEach(f => {
            const type = f.predictedRequirementType || 'unknown';
            const modality = f.detectedModality || 'none';
            typeStats[type] = (typeStats[type] || 0) + 1;
            modalityStats[modality] = (modalityStats[modality] || 0) + 1;
        });

        console.log('По типам требований:');
        Object.entries(typeStats)
            .sort((a, b) => b[1] - a[1])
            .forEach(([type, count]) => {
                console.log(`   ${type.padEnd(25)} : ${count}`);
            });

        console.log('\nПо модальности:');
        Object.entries(modalityStats)
            .sort((a, b) => b[1] - a[1])
            .forEach(([mod, count]) => {
                console.log(`   ${mod.padEnd(25)} : ${count}`);
            });

        console.log('\n' + '='.repeat(70));
        console.log('✅ ФРАГМЕНТЫ СОХРАНЕНЫ!\n');
        console.log('⚠️  ВАЖНО: Фрагменты в статусе PENDING требуют валидации человеком!\n');
        console.log(`🌐 Откройте интерфейс валидации: http://localhost:3000/norm-library/${normId}/review\n`);

    } catch (error) {
        console.error('\n❌ ОШИБКА:', error.message);
        console.error(error.stack);
        throw error;
    }
}

// CLI
const fragmentsFile = process.argv[2];
const normId = process.argv[3];

if (!fragmentsFile || !normId) {
    console.error('\n❌ Использование: node save-fragments-to-raw.js <fragments-file.json> <norm-id>\n');
    console.error('Пример: node save-fragments-to-raw.js raw-fragments-123.json 452c6587-bd11-4058-b2e7-9476b037e1dd\n');
    process.exit(1);
}

saveFragmentsToRaw(fragmentsFile, normId);
