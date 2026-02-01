#!/usr/bin/env node
/**
 * ТЕСТОВЫЙ парсер RawNormFragments
 * НЕ МЕНЯЕТ существующие данные
 * Только извлекает и показывает фрагменты
 */

require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const fs = require('fs').promises;
const path = require('path');

// Import PDF helper
const { extractPdfText } = require('../lib/pdf-helper-combo');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/**
 * Extract only Russian text from bilingual documents
 */
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

/**
 * Split text into chunks for processing large documents
 */
function splitTextIntoChunks(text, chunkSize = 80000, overlap = 2000) {
    const chunks = [];
    let start = 0;

    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        const chunk = text.substring(start, end);
        chunks.push(chunk);

        // Move forward, accounting for overlap
        start = end - overlap;

        // Break if we're at the end
        if (end === text.length) break;
    }

    return chunks;
}

async function testRawFragmentsParser(normId) {
    console.log('\n🧪 ТЕСТОВЫЙ ЗАПУСК: RawNormFragments Parser v2 (с чанкированием)\n');
    console.log('='.repeat(60) + '\n');

    try {
        // Step 1: Get norm info
        console.log('📋 Step 1: Fetching norm info...');
        const { data: norm, error: normError } = await supabase
            .from('norm_sources')
            .select('*')
            .eq('id', normId)
            .single();

        if (normError || !norm) {
            throw new Error('Norm not found');
        }

        console.log(`   ✅ Norm: ${norm.code} - ${norm.title}\n`);

        // Step 2: Get PDF files
        console.log('📁 Step 2: Fetching PDF files...');
        const { data: files } = await supabase
            .from('norm_files')
            .select('*')
            .eq('normSourceId', normId)
            .eq('fileType', 'pdf');

        if (!files || files.length === 0) {
            throw new Error('No PDF files found');
        }

        console.log(`   ✅ Found ${files.length} PDF file(s)\n`);

        // Step 3: Extract text
        console.log('📄 Step 3: Extracting text from PDF...');
        let text = null;

        for (const fileRecord of files) {
            try {
                const storagePath = fileRecord.storageUrl.replace('/uploads/norms/', '');
                const absolutePath = path.join(process.cwd(), 'public', 'uploads', 'norms', storagePath);

                console.log(`   📖 Reading: ${fileRecord.fileName}`);

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

        // Step 3.5: Extract Russian only
        console.log('🇷🇺 Step 3.5: Extracting Russian text...');
        const originalLength = text.length;
        text = extractRussianText(text);
        console.log(`   ✂️  ${originalLength} → ${text.length} chars\n`);

        // Step 4: Split into chunks
        console.log('✂️  Step 4: Splitting into chunks...');
        const chunks = splitTextIntoChunks(text, 80000, 2000);
        console.log(`   📦 Created ${chunks.length} chunks\n`);

        // Step 5: Process each chunk
        console.log('🤖 Step 5: Processing chunks with GPT-4o-mini...\n');

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
                let fragments = parsed.fragments || parsed.raw_fragments || parsed;

                if (!Array.isArray(fragments)) {
                    fragments = [fragments];
                }

                // Renumber fragment IDs to be sequential
                fragments.forEach(f => {
                    f.fragment_id = `RAW-${norm.code}-${String(fragmentIdCounter).padStart(4, '0')}`;
                    fragmentIdCounter++;
                });

                allFragments = allFragments.concat(fragments);
                console.log(`   ✅ Extracted ${fragments.length} fragments from chunk ${i + 1}\n`);

                // Small delay to avoid rate limiting
                if (i < chunks.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

            } catch (chunkError) {
                console.error(`   ❌ Error processing chunk ${i + 1}:`, chunkError.message);
            }
        }

        console.log(`\n✅ Total fragments extracted from all chunks: ${allFragments.length}\n`);

        // Step 6: Display results
        console.log('='.repeat(60));
        console.log('📊 РЕЗУЛЬТАТЫ ТЕСТА\n');
        console.log(`✅ Извлечено фрагментов: ${allFragments.length}\n`);

        // Statistics
        const stats = {
            constructive: 0,
            functional: 0,
            parameterized: 0,
            operational: 0,
            prohibitive: 0,
            conditional: 0,
            base: 0,
            other: 0
        };

        allFragments.forEach(f => {
            const type = f.predicted_requirement_type || 'other';
            stats[type] = (stats[type] || 0) + 1;
        });

        console.log('📈 По типам:');
        Object.entries(stats).forEach(([type, count]) => {
            if (count > 0) {
                console.log(`   ${type.padEnd(20)} : ${count}`);
            }
        });

        console.log('\n📝 Примеры фрагментов:\n');

        allFragments.slice(0, 5).forEach((fragment, idx) => {
            console.log(`${idx + 1}. [${fragment.source_clause || 'N/A'}] ${fragment.predicted_requirement_type || 'unknown'}`);
            console.log(`   ${fragment.raw_text?.substring(0, 100)}...`);
            console.log(`   Модальность: ${fragment.detected_modality || 'none'}`);
            console.log(`   Условия: ${fragment.detected_conditions?.length || 0}`);
            console.log(`   Параметры: ${fragment.detected_parameters?.length || 0}`);
            console.log(`   Confidence: ${fragment.confidence_score || 'N/A'}`);
            console.log('');
        });

        // Save to file
        const outputFile = path.join(process.cwd(), `raw-fragments-${normId}.json`);
        await fs.writeFile(outputFile, JSON.stringify(allFragments, null, 2), 'utf-8');

        console.log(`\n💾 Полный результат сохранен: ${outputFile}`);
        console.log('\n✅ ТЕСТ ЗАВЕРШЕН!\n');

        return allFragments;

    } catch (error) {
        console.error('\n❌ ОШИБКА:', error.message);
        throw error;
    }
}

// CLI
const normId = process.argv[2];

if (!normId) {
    console.error('\n❌ Использование: node test-raw-fragments.js <norm-id>\n');
    process.exit(1);
}

testRawFragmentsParser(normId);
