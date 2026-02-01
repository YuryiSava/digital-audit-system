#!/usr/bin/env node
/**
 * ПОЛНЫЙ ПАЙПЛАЙН v2: PDF → RawNormFragments → Requirements → DB
 * Запускает все этапы последовательно
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Import PDF helper
const { extractPdfText } = require('../lib/pdf-helper-combo');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Reuse prompts and functions from test-raw-fragments.js
function extractRussianText(fullText) {
    const russianMarkers = [
        'ПРАВИЛА УСТРОЙСТВА ЭЛЕКТРОУСТАНОВОК',
        'ПОЖАРНАЯ БЕЗОПАСНОСТЬ',
        'ОБЩИЕ ПОЛОЖЕНИЯ',
        'ОБЛАСТЬ ПРИМЕНЕНИЯ',
        'НОРМАТИВНЫЕ ССЫЛКИ',
        '1 Область применения',
        'ВВЕДЕНИЕ'
    ];

    let bestSplitIndex = -1;
    let bestMarker = null;

    for (const marker of russianMarkers) {
        const index = fullText.indexOf(marker);
        if (index > 0 && (bestSplitIndex === -1 || index < bestSplitIndex)) {
            bestSplitIndex = index;
            bestMarker = marker;
        }
    }

    if (bestSplitIndex > 0) {
        console.log(`   ✅ Found Russian marker: "${bestMarker}" at position ${bestSplitIndex}`);
        return fullText.substring(bestSplitIndex);
    }

    console.log(`   ⚠️  No marker found, keeping full text`);
    return fullText;
}

function splitTextIntoChunks(text, chunkSize = 80000, overlap = 2000) {
    const chunks = [];
    let start = 0;

    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        const chunk = text.substring(start, end);
        chunks.push(chunk);
        start = end - overlap;
        if (end === text.length) break;
    }

    return chunks;
}

const SYSTEM_PROMPT = `Ты — специализированный AI-парсер нормативных документов.
Твоя задача — извлекать НЕ ГОТОВЫЕ ТРЕБОВАНИЯ,
а RAW-ФРАГМЕНТЫ НОРМ (RawNormFragments) из текста нормативных документов.

Ты НЕ интерпретируешь требования,
НЕ объединяешь пункты,
НЕ делаешь выводов.

Ты ТОЛЬКО:
— находишь нормативно значимые фрагменты,
— фиксируешь условия и параметры,
— сохраняешь привязку к пункту документа.`;

const USER_PROMPT_TEMPLATE = `Проанализируй предоставленный текст нормативного документа.

Твоя задача:
Извлечь все фрагменты текста, содержащие нормативные требования,
ограничения, условия, запреты или параметры.

НЕ формулируй требования самостоятельно.
НЕ упрощай текст.
НЕ объединяй разные пункты.

Для каждого найденного фрагмента создай объект RawNormFragment.

ИЗВЛЕКАЙ фрагмент, ЕСЛИ в тексте есть хотя бы одно из:

### 1️⃣ МОДАЛЬНЫЕ КОНСТРУКЦИИ
* «должен», «должна», «должны»
* «не допускается», «запрещается»
* «следует», «допускается только»
* «требуется», «необходимо»

### 2️⃣ УСЛОВНЫЕ КОНСТРУКЦИИ
* «при», «в случае», «если»
* «в помещениях», «при наличии»
* «в электроустановках», «для зданий»

### 3️⃣ ПАРАМЕТРЫ
* числа (Ом, мА, мм, м, кВ, сек и т.п.)
* таблицы с нормативными значениями
* ссылки на расчётные условия

ФОРМАТ RawNormFragment (СТРОГО):
{
  "fragment_id": "RAW-XXX-0001",
  "source_document": "Название документа",
  "source_section": "Раздел / Глава",
  "source_clause": "номер пункта (например: 1.7.79)",
  "raw_text": "ТОЧНАЯ цитата из документа без изменений",
  "detected_modality": "должен / не допускается / следует / null",
  "detected_conditions": ["условие 1", "условие 2"],
  "detected_parameters": [
    {
      "value": "30",
      "unit": "мА",
      "context": "ток срабатывания УЗО"
    }
  ],
  "predicted_requirement_type": "constructive | functional | parameterized | operational | prohibitive | conditional | base",
  "confidence_score": число от 0.0 до 1.0
}

ТИПЫ ТРЕБОВАНИЙ (predicted_requirement_type):
- constructive: конструктивное (наличие элементов, физическое исполнение)
- functional: функциональное (поведение системы, срабатывание)
- parameterized: параметрическое (конкретные числовые значения)
- operational: эксплуатационное (процессы обслуживания, проверки)
- prohibitive: запретительное (явные запреты)
- conditional: условное (зависит от среды/использования)
- base: базовое/общее требование

ДОПОЛНИТЕЛЬНЫЕ ПРАВИЛА:
* Если пункт содержит несколько предложений — извлекай КАЖДОЕ как отдельный фрагмент
* Если пункт содержит список — извлекай КАЖДЫЙ элемент отдельно
* Сохраняй ВСЕ условия и оговорки
* НЕ интерпретируй и НЕ обобщай

СТРОГИЕ ОГРАНИЧЕНИЯ:
❌ НЕ пиши "требование"
❌ НЕ переписывай текст своими словами
❌ НЕ делай выводов
❌ НЕ объединяй несколько пунктов в один фрагмент
❌ НЕ убирай условия и оговорки

Правило сомнительных фрагментов:
Если фрагмент сомнительный, но содержит модальность — извлекай его с низким confidence_score (0.4-0.6).

ФОРМАТ ОТВЕТА:
Верни JSON объект с ключом "fragments", содержащий МАССИВ объектов RawNormFragment.
Пример: {"fragments": [ {...}, {...}, ... ]}`;

async function fullPipelineV2(normId, skipIfExists = false) {
    console.log('\n🚀 ПОЛНЫЙ ПАЙПЛАЙН v2: PDF → RawFragments → Requirements → DB\n');
    console.log('='.repeat(70) + '\n');

    try {
        // ===== STAGE 1: Extract PDF and create RawNormFragments =====
        console.log('📄 STAGE 1: ИЗВЛЕЧЕНИЕ RAW NORM FRAGMENTS\n');
        console.log('-'.repeat(70) + '\n');

        // Get norm info
        console.log('📋 Fetching norm info...');
        const { data: norm, error: normError } = await supabase
            .from('norm_sources')
            .select('*')
            .eq('id', normId)
            .single();

        if (normError || !norm) {
            throw new Error('Norm not found');
        }
        console.log(`   ✅ Norm: ${norm.code} - ${norm.title}\n`);

        // Check if fragments file already exists
        const fragmentsFile = `raw-fragments-${normId}.json`;
        const fragmentsPath = path.join(process.cwd(), fragmentsFile);

        let fragments;

        if (skipIfExists) {
            try {
                const existing = await fs.readFile(fragmentsPath, 'utf-8');
                fragments = JSON.parse(existing);
                console.log(`   ✅ Using existing fragments file (${fragments.length} fragments)\n`);
            } catch {
                // File doesn't exist, continue with extraction
            }
        }

        if (!fragments) {
            // Get PDF files
            console.log('📁 Fetching PDF files...');
            const { data: files } = await supabase
                .from('norm_files')
                .select('*')
                .eq('normSourceId', normId)
                .eq('fileType', 'pdf');

            if (!files || files.length === 0) {
                throw new Error('No PDF files found');
            }
            console.log(`   ✅ Found ${files.length} PDF file(s)\n`);

            // Extract text from PDF
            console.log('📖 Extracting text from PDF...');
            let text = null;

            for (const fileRecord of files) {
                try {
                    const storagePath = fileRecord.storageUrl.replace('/uploads/norms/', '');
                    const absolutePath = path.join(process.cwd(), 'public', 'uploads', 'norms', storagePath);

                    console.log(`   Reading: ${fileRecord.fileName}`);
                    const dataBuffer = await fs.readFile(absolutePath);
                    text = await extractPdfText(dataBuffer);
                    console.log(`   ✅ Extracted ${text.length} characters\n`);
                    break;
                } catch (err) {
                    console.error(`   ❌ Error: ${err.message}`);
                }
            }

            if (!text || text.length < 50) {
                throw new Error('Could not extract meaningful text from PDF');
            }

            // Extract Russian only
            console.log('🇷🇺 Extracting Russian text...');
            const originalLength = text.length;
            text = extractRussianText(text);
            console.log(`   ✂️  ${originalLength} → ${text.length} chars\n`);

            // Split into chunks
            console.log('✂️  Splitting into chunks...');
            const chunks = splitTextIntoChunks(text, 80000, 2000);
            console.log(`   📦 Created ${chunks.length} chunks\n`);

            // Process each chunk with GPT
            console.log('🤖 Processing chunks with GPT-4o-mini...\n');

            let allFragments = [];
            let fragmentIdCounter = 1;

            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                console.log(`   [${i + 1}/${chunks.length}] Processing chunk (${chunk.length} chars)...`);

                try {
                    const completion = await openai.chat.completions.create({
                        model: 'gpt-4o-mini',
                        messages: [
                            { role: 'system', content: SYSTEM_PROMPT },
                            { role: 'user', content: USER_PROMPT_TEMPLATE + '\n\nТЕКСТ ДОКУМЕНТА:\n\n' + chunk }
                        ],
                        temperature: 0.1,
                        response_format: { type: 'json_object' }
                    });

                    const responseText = completion.choices[0].message.content;
                    const parsed = JSON.parse(responseText);
                    let chunkFragments = parsed.fragments || parsed.raw_fragments || parsed;

                    if (!Array.isArray(chunkFragments)) {
                        chunkFragments = [chunkFragments];
                    }

                    // Renumber fragment IDs
                    chunkFragments.forEach(f => {
                        f.fragment_id = `RAW-${norm.code}-${String(fragmentIdCounter).padStart(4, '0')}`;
                        fragmentIdCounter++;
                    });

                    allFragments = allFragments.concat(chunkFragments);
                    console.log(`   ✅ Extracted ${chunkFragments.length} fragments from chunk ${i + 1}\n`);

                    // Delay to avoid rate limiting
                    if (i < chunks.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }

                } catch (chunkError) {
                    console.error(`   ❌ Error processing chunk ${i + 1}:`, chunkError.message);
                }
            }

            fragments = allFragments;

            // Save fragments to file
            await fs.writeFile(fragmentsPath, JSON.stringify(fragments, null, 2), 'utf-8');
            console.log(`\n💾 Saved ${fragments.length} fragments to: ${fragmentsFile}\n`);
        }

        // ===== STAGE 2: Save to Database =====
        console.log('\n' + '='.repeat(70));
        console.log('💾 STAGE 2: СОХРАНЕНИЕ В БАЗУ ДАННЫХ\n');
        console.log('-'.repeat(70) + '\n');

        // Create or get RequirementSet
        console.log('📦 Creating Requirement Set...');
        const reqSetId = `RS-${norm.code.replace(/\s+/g, '-')}-v2`;

        let { data: existingSet } = await supabase
            .from('requirement_sets')
            .select('*')
            .eq('requirementSetId', reqSetId)
            .single();

        let requirementSet;

        if (existingSet) {
            console.log(`   ✅ Using existing requirement set: ${reqSetId}\n`);
            requirementSet = existingSet;
        } else {
            const { data: newSet, error: setError } = await supabase
                .from('requirement_sets')
                .insert({
                    id: uuidv4(),
                    requirementSetId: reqSetId,
                    systemId: null,
                    jurisdiction: norm.jurisdiction || 'KZ',
                    version: '2.0',
                    status: 'DRAFT',
                    notes: `AI-парсер v2 - ${new Date().toISOString()}`,
                    tags: ['ai-parser-v2'],
                    createdAt: new Date().toISOString(),
                    createdBy: 'ai-parser-v2',
                    updatedAt: new Date().toISOString()
                })
                .select()
                .single();

            if (setError) {
                throw new Error(`Failed to create requirement set: ${setError.message}`);
            }

            requirementSet = newSet;
            console.log(`   ✅ Created requirement set: ${reqSetId}\n`);
        }

        // Map fragments to Requirements
        console.log('🔄 Converting fragments to requirements...');

        const requirements = fragments.map((fragment, index) => {
            let systemId = 'FIRE_GENERAL';

            const text = (fragment.raw_text || '').toLowerCase();
            if (text.includes('сигнализ') || text.includes('извещател')) {
                systemId = 'APS';
            } else if (text.includes('оповещ') || text.includes('эвакуац')) {
                systemId = 'SOUE';
            } else if (text.includes('пожаротушен') || text.includes('огнетушащ')) {
                systemId = 'AUPT';
            } else if (text.includes('электроустановк') || text.includes('заземлен')) {
                systemId = 'FIRE_POWER';
            }

            const requirementId = `REQ-${norm.code.replace(/\s+/g, '-')}-${String(index + 1).padStart(4, '0')}`;

            return {
                id: uuidv4(),
                requirementId: requirementId,
                requirementSetId: requirementSet.id,
                systemId: systemId,
                normSourceId: norm.id,
                clause: fragment.source_clause || '',
                requirementTextShort: fragment.raw_text.substring(0, 200),
                requirementTextFull: fragment.raw_text,
                checkMethod: 'visual',
                evidenceTypeExpected: [],
                mustCheck: fragment.predicted_requirement_type !== 'base',
                tags: [
                    fragment.predicted_requirement_type,
                    fragment.detected_modality || 'unknown',
                    ...(fragment.detected_conditions || [])
                ].filter(Boolean),
                applicabilityRules: null,
                severityHint: null,
                createdAt: new Date().toISOString(),
                createdBy: 'ai-parser-v2',
                updatedAt: new Date().toISOString()
            };
        });

        console.log(`   ✅ Converted ${requirements.length} fragments\n`);

        // Delete old AI-generated requirements
        console.log('🧹 Cleaning up old AI requirements...');
        const { error: deleteError } = await supabase
            .from('requirements')
            .delete()
            .eq('normSourceId', norm.id)
            .eq('createdBy', 'ai-parser-v2');

        if (!deleteError) {
            console.log('   ✅ Cleaned up old requirements\n');
        }

        // Insert new requirements
        console.log('💾 Saving to database...\n');
        const batchSize = 50;
        let inserted = 0;

        for (let i = 0; i < requirements.length; i += batchSize) {
            const batch = requirements.slice(i, i + batchSize);

            const { error } = await supabase
                .from('requirements')
                .insert(batch);

            if (error) {
                console.error(`   ❌ Error batch ${Math.floor(i / batchSize) + 1}:`, error.message);
            } else {
                inserted += batch.length;
                console.log(`   ✅ Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} requirements`);
            }
        }

        console.log(`\n✅ Total inserted: ${inserted}/${requirements.length}\n`);

        // Final statistics
        console.log('='.repeat(70));
        console.log('📊 ФИНАЛЬНАЯ СТАТИСТИКА\n');

        const systemStats = {};
        requirements.forEach(req => {
            systemStats[req.systemId] = (systemStats[req.systemId] || 0) + 1;
        });

        console.log('По системам:');
        Object.entries(systemStats)
            .sort((a, b) => b[1] - a[1])
            .forEach(([sys, count]) => {
                console.log(`   ${sys.padEnd(20)} : ${count}`);
            });

        console.log('\n' + '='.repeat(70));
        console.log('✅ ПАЙПЛАЙН v2 ЗАВЕРШЕН!\n');
        console.log(`🌐 Проверьте: http://localhost:3000/norm-library/${norm.id}\n`);

    } catch (error) {
        console.error('\n❌ КРИТИЧЕСКАЯ ОШИБКА:', error.message);
        console.error(error.stack);
        throw error;
    }
}

// CLI
const normId = process.argv[2];
const skipIfExists = process.argv[3] === '--skip-if-exists';

if (!normId) {
    console.error('\n❌ Использование: node full-pipeline-v2.js <norm-id> [--skip-if-exists]\n');
    console.error('Пример: node full-pipeline-v2.js 47d549ea-d075-4e79-8c70-b06e1df737bf\n');
    process.exit(1);
}

fullPipelineV2(normId, skipIfExists);
