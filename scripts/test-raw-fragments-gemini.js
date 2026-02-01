#!/usr/bin/env node
/**
 * ТЕСТОВЫЙ парсер RawNormFragments v2.0 (Gemini Edition)
 * Использует Google Gemini вместо OpenAI для больших документов
 * НЕ МЕНЯЕТ существующие данные - только извлекает и показывает фрагменты
 */

require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;
const path = require('path');

// Import PDF helper
const { extractPdfText } = require('../lib/pdf-helper-combo');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

async function testRawFragmentsParser(normId) {
    console.log('\n🧪 ТЕСТОВЫЙ ЗАПУСК: RawNormFragments Parser v2 (Gemini Edition)\n');
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

        // Step 4: Send to Gemini
        console.log('🤖 Step 4: Sending to Gemini 2.0 Flash...');
        console.log(`   📝 Sending ${text.length} characters\n`);

        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-exp",
            generationConfig: {
                response_mime_type: "application/json"
            }
        });

        const prompt = `${SYSTEM_PROMPT}\n\n${USER_PROMPT_TEMPLATE}\n\nТЕКСТ ДОКУМЕНТА:\n\n${text}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const responseText = response.text();

        console.log('✅ Gemini response received\n');

        // Step 5: Parse response
        let fragments;

        try {
            const parsed = JSON.parse(responseText);
            fragments = parsed.fragments || parsed.raw_fragments || parsed;

            if (!Array.isArray(fragments)) {
                fragments = [fragments];
            }
        } catch (parseErr) {
            console.error('❌ Failed to parse Gemini response as JSON');
            console.log('Response preview:', responseText.substring(0, 500));
            throw parseErr;
        }

        // Step 6: Display results
        console.log('='.repeat(60));
        console.log('📊 РЕЗУЛЬТАТЫ ТЕСТА\n');
        console.log(`✅ Извлечено фрагментов: ${fragments.length}\n`);

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

        fragments.forEach(f => {
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

        fragments.slice(0, 5).forEach((fragment, idx) => {
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
        await fs.writeFile(outputFile, JSON.stringify(fragments, null, 2), 'utf-8');

        console.log(`\n💾 Полный результат сохранен: ${outputFile}`);
        console.log('\n✅ ТЕСТ ЗАВЕРШЕН!\n');

        return fragments;

    } catch (error) {
        console.error('\n❌ ОШИБКА:', error.message);
        console.error(error.stack);
        throw error;
    }
}

// CLI
const normId = process.argv[2];

if (!normId) {
    console.error('\n❌ Использование: node test-raw-fragments-gemini.js <norm-id>\n');
    process.exit(1);
}

testRawFragmentsParser(normId);
