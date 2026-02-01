#!/usr/bin/env node
/**
 * Нормализация RawNormFragments в Requirements
 * Преобразует сырые фрагменты в структуру для сохранения в БД
 */

require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Системы для пожарной автоматики
const FIRE_SYSTEMS = [
    'APS', 'SOUE', 'AUPT', 'SMOKE_CONTROL', 'FIRE_WATER_INT',
    'FIRE_WATER_EXT', 'FIRE_POWER', 'FIRE_CABLES', 'FIRE_BARRIERS',
    'FIRE_PRIMARY', 'FIRE_CONTROL', 'FIRE_MONITORING', 'FIRE_GENERAL'
];

const NORMALIZATION_PROMPT = `Ты — эксперт по нормализации требований пожарной безопасности.

Твоя задача: преобразовать RAW-фрагменты норм в ФИНАЛЬНЫЕ ТРЕБОВАНИЯ для цифрового аудита.

Для каждого фрагмента создай:

1. **requirementTextShort** (30-80 слов):
   - Лаконичная формулировка для отображения в чек-листе
   - Сохраняй ключевые параметры и условия
   - Используй императивную форму

2. **requirementTextFull** (исходный текст):
   - Полный текст из raw_text без изменений
   - Это база для AI-анализа

3. **systemId** (одна система):
   - Определи ОСНОВНУЮ систему из списка: ${FIRE_SYSTEMS.join(', ')}
   - Если общее требование → FIRE_GENERAL
   - Если АПС (пожарная сигнализация) → APS
   - Если СОУЭ (оповещение и управление эвакуацией) → SOUE
   - Если пожаротушение → AUPT

4. **tags** (массив строк):
   - Ключевые термины из текста
   - Названия других систем, если применимо
   - Параметры (например: "30мА", "5.5м")

5. **checkMethod**:
   - "visual" - визуальный осмотр
   - "instrumental" - инструментальные измерения
   - "documentary" - проверка документации
   - "functional" - функциональные тесты
   - "combined" - комбинированный

6. **mustCheck** (true/false):
   - true - если требование критично для безопасности
   - false - если рекомендательное

ФОРМАТ ОТВЕТА (JSON):
{
  "normalized_requirements": [
    {
      "fragment_id": "RAW-XXX-0001",
      "requirementTextShort": "краткая формулировка",
      "requirementTextFull": "полный текст из raw_text",
      "systemId": "APS",
      "tags": ["тег1", "тег2"],
      "checkMethod": "visual",
      "mustCheck": true
    }
  ]
}`;

async function normalizeFragments(fragmentsFile, normId) {
    console.log('\n🔄 НОРМАЛИЗАЦИЯ RAWNO RMFRAGMENTS → REQUIREMENTS\n');
    console.log('='.repeat(60) + '\n');

    try {
        // Step 1: Load fragments
        console.log('📂 Step 1: Loading fragments...');
        const filePath = path.join(process.cwd(), fragmentsFile);
        const rawData = await fs.readFile(filePath, 'utf-8');
        const fragments = JSON.parse(rawData);
        console.log(`   ✅ Loaded ${fragments.length} fragments\n`);

        // Step 2: Get norm info
        console.log('📋 Step 2: Fetching norm info...');
        const { data: norm, error: normError } = await supabase
            .from('norm_sources')
            .select('*')
            .eq('id', normId)
            .single();

        if (normError || !norm) {
            throw new Error('Norm not found');
        }
        console.log(`   ✅ Norm: ${norm.code} - ${norm.title}\n`);

        // Step 3: Get or create requirement set
        console.log('📦 Step 3: Getting requirement set...');
        let { data: reqSet } = await supabase
            .from('requirement_sets')
            .select('*')
            .eq('normSourceId', normId)
            .single();

        if (!reqSet) {
            console.log('   ⚠️  Requirement set not found, creating...');
            const { data: newSet, error: setError } = await supabase
                .from('requirement_sets')
                .insert({
                    id: uuidv4(),
                    normSourceId: normId,
                    name: `${norm.code} - Requirements Set`,
                    version: '1.0',
                    status: 'active'
                })
                .select()
                .single();

            if (setError) throw setError;
            reqSet = newSet;
        }
        console.log(`   ✅ Requirement Set ID: ${reqSet.id}\n`);

        // Step 4: Normalize in batches
        console.log('🤖 Step 4: Normalizing with GPT-4o-mini...\n');

        const batchSize = 10;
        const batches = [];
        for (let i = 0; i < fragments.length; i += batchSize) {
            batches.push(fragments.slice(i, i + batchSize));
        }

        let allRequirements = [];

        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            console.log(`   [${i + 1}/${batches.length}] Normalizing ${batch.length} fragments...`);

            try {
                const completion = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: NORMALIZATION_PROMPT
                        },
                        {
                            role: 'user',
                            content: `Нормализуй следующие фрагменты:\n\n${JSON.stringify(batch, null, 2)}`
                        }
                    ],
                    temperature: 0.2,
                    response_format: { type: 'json_object' }
                });

                const responseText = completion.choices[0].message.content;
                const parsed = JSON.parse(responseText);
                const normalized = parsed.normalized_requirements || [];

                allRequirements = allRequirements.concat(normalized);
                console.log(`   ✅ Normalized ${normalized.length} requirements\n`);

                // Delay to avoid rate limiting
                if (i < batches.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

            } catch (err) {
                console.error(`   ❌ Error normalizing batch ${i + 1}:`, err.message);
            }
        }

        console.log(`\n✅ Total normalized: ${allRequirements.length} requirements\n`);

        // Step 5: Prepare for DB insertion
        console.log('💾 Step 5: Preparing for database...\n');

        const dbRequirements = allRequirements.map(req => {
            // Validate systemId
            let systemId = req.systemId;
            if (!FIRE_SYSTEMS.includes(systemId)) {
                console.log(`   ⚠️  Invalid systemId "${systemId}", defaulting to FIRE_GENERAL`);
                systemId = 'FIRE_GENERAL';
            }

            return {
                id: uuidv4(),
                requirementSetId: reqSet.id,
                clause: fragments.find(f => f.fragment_id === req.fragment_id)?.source_clause || '',
                systemId: systemId,
                requirementTextShort: req.requirementTextShort,
                requirementTextFull: req.requirementTextFull,
                checkMethod: req.checkMethod || 'visual',
                mustCheck: req.mustCheck !== false, // default true
                tags: req.tags || [],
                source: 'ai-parser-v2',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
        });

        // Step 6: Save to file
        const outputFile = path.join(process.cwd(), `normalized-requirements-${normId}.json`);
        await fs.writeFile(outputFile, JSON.stringify(dbRequirements, null, 2), 'utf-8');
        console.log(`   💾 Saved to: ${outputFile}\n`);

        // Step 7: Statistics
        console.log('='.repeat(60));
        console.log('📊 СТАТИСТИКА\n');

        const systemStats = {};
        dbRequirements.forEach(req => {
            systemStats[req.systemId] = (systemStats[req.systemId] || 0) + 1;
        });

        console.log('По системам:');
        Object.entries(systemStats)
            .sort((a, b) => b[1] - a[1])
            .forEach(([sys, count]) => {
                console.log(`   ${sys.padEnd(20)} : ${count}`);
            });

        const mustCheckCount = dbRequirements.filter(r => r.mustCheck).length;
        console.log(`\nОбязательных к проверке: ${mustCheckCount}/${dbRequirements.length}`);

        console.log('\n' + '='.repeat(60));
        console.log('✅ НОРМАЛИЗАЦИЯ ЗАВЕРШЕНА!\n');
        console.log('📝 Следующий шаг: Сохранение в базу данных');
        console.log(`   Используйте: node scripts/save-requirements.js ${outputFile}\n`);

        return dbRequirements;

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
    console.error('\n❌ Использование: node normalize-fragments.js <fragments-file.json> <norm-id>\n');
    console.error('Пример: node normalize-fragments.js raw-fragments-123.json 452c6587-bd11-4058-b2e7-9476b037e1dd\n');
    process.exit(1);
}

normalizeFragments(fragmentsFile, normId);
