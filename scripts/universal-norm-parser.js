#!/usr/bin/env node
/**
 * ⚠️ DEPRECATED - НЕ ИСПОЛЬЗУЕТСЯ! ⚠️
 * 
 * Этот файл использует Gemini API и больше НЕ ИСПОЛЬЗУЕТСЯ в системе.
 * Текущая версия использует OpenAI API.
 * 
 * Актуальный парсер: scripts/parse-pdf-universal.js (OpenAI)
 * 
 * ============================================
 * УНИВЕРСАЛЬНЫЙ ПАРСЕР НОРМАТИВНЫХ ДОКУМЕНТОВ (УСТАРЕВШИЙ)
 * ============================================
 * 
 * Архитектура: PDF → RawNormFragments → Review → Requirements
 * 
 * Основан на UNIVERSAL META-PROMPT
 * Работает с ЛЮБЫМИ нормативными документами:
 * - ПУЭ РК, СН РК, СП РК
 * - ГОСТ, ТР ТС
 * - ISO, EN, международные стандарты
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { GoogleGenerativeAI } = require('@google/generative-ai');
const pdf = require('pdf-parse');
const fs = require('fs').promises;
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ============================================================================
// UNIVERSAL META-PROMPT (SYSTEM)
// ============================================================================

const SYSTEM_PROMPT = `
Ты — специализированный AI-парсер нормативных и технических документов.

Твоя задача — извлекать RAW-ФРАГМЕНТЫ НОРМ (RawNormFragments),
а не формировать готовые требования.

Ты НЕ:
— интерпретируешь нормы,
— не объединяешь разные пункты,
— не упрощаешь текст,
— не делаешь выводов.

Ты ТОЛЬКО:
— находишь нормативно значимые фрагменты,
— сохраняешь точную цитату,
— фиксируешь условия, ограничения и параметры,
— сохраняешь привязку к источнику.
`;

// ============================================================================
// КРИТЕРИИ ИЗВЛЕЧЕНИЯ (УНИВЕРСАЛЬНЫЕ)
// ============================================================================

const EXTRACTION_CRITERIA = `
## КРИТЕРИИ ИЗВЛЕЧЕНИЯ ФРАГМЕНТОВ

### 1️⃣ МОДАЛЬНОСТЬ (явная или скрытая)
Извлекай фрагмент, если обнаружено:
* должен / должна / должны / должно
* не допускается / запрещается
* следует / рекомендуется  
* допускается только
* необходимо / требуется
* подлежит / обязан

### 2️⃣ УСЛОВИЯ ПРИМЕНЕНИЯ
Извлекай фрагмент, если присутствует:
* при / в случае / если
* в помещениях / на объектах
* при наличии / при отсутствии
* для / в зависимости от

### 3️⃣ ПАРАМЕТРЫ И НОРМАТИВЫ
Извлекай фрагмент, если присутствует:
* числовые значения
* единицы измерения
* нормативные пределы
* таблицы нормативов
* ссылки на расчёт

### 4️⃣ СТРУКТУРНЫЕ ФРАГМЕНТЫ
Извлекай:
* примечания
* таблицы
* сноски
* подпункты
`;

// ============================================================================
// ФОРМАТ ВЫХОДНЫХ ДАННЫХ
// ============================================================================

const OUTPUT_FORMAT = `
## ФОРМАТ ВЫХОДНЫХ ДАННЫХ

Верни ТОЛЬКО ВАЛИДНЫЙ JSON массив объектов. Каждый объект - отдельный фрагмент:

[
  {
    "source_section": "раздел / глава",
    "source_clause": "пункт / подпункт",
    "raw_text": "ТОЧНАЯ цитата без изменений",
    "detected_modality": "должен | не допускается | следует | null",
    "detected_conditions": ["условие 1", "условие 2"],
    "detected_parameters": [
      {
        "value": "число",
        "unit": "единица",
        "context": "контекст параметра"
      }
    ],
    "predicted_requirement_type": "constructive | functional | parameterized | operational | prohibitive | conditional | base | undefined",
    "confidence_score": 0.95
  }
]

СТРОГИЕ ПРАВИЛА:
❌ НЕ создавай нормативные требования
❌ НЕ переписывай текст
❌ НЕ объединяй разные нормы
❌ НЕ делай логических выводов
❌ НЕ убирай условия и исключения

Если фрагмент сомнительный — извлекай с низким confidence_score (< 0.7).
`;

// ==========================================================================
// ФУНКЦИИ ПАРСИНГА
// ============================================================================

async function parseUniversalNorm(pdfPath, metaParams) {
    console.log('\n🔍 УНИВЕРСАЛЬНЫЙ ПАРСЕР НОРМАТИВНЫХ ДОКУМЕНТОВ\n');
    console.log('='.repeat(70));
    console.log(`\n📄 Документ: ${metaParams.documentTitle}`);
    console.log(`📋 Тип: ${metaParams.documentType}`);
    console.log(`🌍 Юрисдикция: ${metaParams.jurisdiction}`);
    console.log(`⚖️  Обязательность: ${metaParams.bindingLevel}\n`);
    console.log('='.repeat(70) + '\n');

    // Step 1: Extract text from PDF
    console.log('📖 Step 1: Extracting text from PDF...');
    const dataBuffer = await fs.readFile(pdfPath);
    const pdfData = await pdf(dataBuffer);
    const fullText = pdfData.text;
    console.log(`   ✅ Extracted ${fullText.length} characters\n`);

    // Step 2: Split into chunks
    const CHUNK_SIZE = 80000;
    const chunks = [];
    for (let i = 0; i < fullText.length; i += CHUNK_SIZE) {
        chunks.push(fullText.substring(i, i + CHUNK_SIZE));
    }
    console.log(`📦 Step 2: Split into ${chunks.length} chunks\n`);

    // Step 3: Process each chunk with Gemini
    console.log('🤖 Step 3: Processing chunks with AI...\n');

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const allFragments = [];
    let fragmentCounter = 1;

    for (let i = 0; i < chunks.length; i++) {
        console.log(`   [${i + 1}/${chunks.length}] Processing chunk (${chunks[i].length} chars)...`);

        const userPrompt = `
${SYSTEM_PROMPT}

## META-PARAMETERS

Тип нормативного документа: ${metaParams.documentType}
Область регулирования: ${metaParams.regulationArea}
Юрисдикция: ${metaParams.jurisdiction}
Уровень обязательности: ${metaParams.bindingLevel}

${EXTRACTION_CRITERIA}

${OUTPUT_FORMAT}

## ТЕКСТ ДОКУМЕНТА (ФРАГМЕНТ ${i + 1}/${chunks.length})

${chunks[i]}

Извлеки ВСЕ нормативно значимые фрагменты из этого текста.
Верни ТОЛЬКО валидный JSON массив.
`;

        try {
            const result = await model.generateContent(userPrompt);
            const responseText = result.response.text();

            // Extract JSON
            const jsonMatch = responseText.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const fragments = JSON.parse(jsonMatch[0]);
                console.log(`   ✅ Extracted ${fragments.length} fragments from chunk ${i + 1}`);

                fragments.forEach(frag => {
                    frag.fragment_id = `RAW-NORM-${String(fragmentCounter).padStart(5, '0')}`;
                    frag.document_title = metaParams.documentTitle;
                    fragmentCounter++;
                });

                allFragments.push(...fragments);
            } else {
                console.log(`   ⚠️  No JSON found in chunk ${i + 1}`);
            }
        } catch (error) {
            console.error(`   ❌ Error processing chunk ${i + 1}:`, error.message);
        }
    }

    console.log(`\n✅ Total fragments extracted: ${allFragments.length}\n`);

    return allFragments;
}

// ============================================================================
// СОХРАНЕНИЕ В БД
// ============================================================================

async function saveFragmentsToDatabase(fragments, normSourceId) {
    console.log('💾 Step 4: Saving fragments to database...\n');

    let saved = 0;
    let skipped = 0;

    for (const frag of fragments) {
        try {
            await supabase.from('raw_norm_fragments').insert({
                id: uuidv4(),
                fragmentId: frag.fragment_id,
                normSourceId: normSourceId,
                sourceSection: frag.source_section || null,
                sourceClause: frag.source_clause || null,
                rawText: frag.raw_text,
                detectedModality: frag.detected_modality || null,
                detectedConditions: frag.detected_conditions || [],
                detectedParameters: frag.detected_parameters || null,
                predictedRequirementType: frag.predicted_requirement_type || null,
                confidenceScore: frag.confidence_score || null,
                status: 'PENDING',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            saved++;
            if (saved % 10 === 0) {
                console.log(`   ✅ Saved ${saved} fragments...`);
            }
        } catch (error) {
            console.error(`   ❌ Error saving ${frag.fragment_id}:`, error.message);
            skipped++;
        }
    }

    console.log(`\n📊 Final stats:`);
    console.log(`   Saved: ${saved}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${fragments.length}\n`);
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

async function main() {
    const args = process.argv.slice(2);

    if (args.length < 1) {
        console.log(`
Usage: 
  1. Direct mode (from DB):
     node universal-norm-parser.js DIRECT <norm-source-id>
  
  2. File mode:
     node universal-norm-parser.js <pdf-path> <norm-source-id> [meta-params.json]

Example:
  node universal-norm-parser.js DIRECT abc-123-def456
  node universal-norm-parser.js ./pue-rk.pdf abc-123-def456 ./meta-pue.json
        `);
        process.exit(1);
    }

    let pdfPath, normSourceId, metaParams;

    // Mode 1: DIRECT (get PDF from DB)
    if (args[0] === 'DIRECT' || args[0] === 'direct') {
        normSourceId = args[1];

        if (!normSourceId) {
            console.error('❌ Error: normSourceId required in DIRECT mode');
            process.exit(1);
        }

        console.log(`\n🔍 DIRECT MODE: Fetching norm from DB...`);

        // Get norm from DB
        const { data: norm, error: normError } = await supabase
            .from('norm_sources')
            .select('*')
            .eq('id', normSourceId)
            .single();

        if (normError || !norm) {
            console.error('❌ Error: Norm not found in database');
            process.exit(1);
        }

        // Get PDF file
        const { data: files } = await supabase
            .from('norm_files')
            .select('*')
            .eq('normSourceId', normSourceId)
            .limit(1);

        if (!files || files.length === 0) {
            console.error('❌ Error: No PDF file found for this norm');
            process.exit(1);
        }

        const path = require('path');
        pdfPath = path.join(process.cwd(), files[0].storageUrl);

        // Set meta params from norm
        metaParams = {
            documentTitle: norm.title,
            documentType: norm.docType || 'Норма',
            regulationArea: norm.keywords?.join(', ') || 'Общие требования',
            jurisdiction: norm.jurisdiction || 'KZ',
            bindingLevel: 'обязательный'
        };

        console.log(`   ✅ Found: ${norm.code} - ${norm.title}`);
        console.log(`   📄 PDF: ${pdfPath}\n`);

    } else {
        // Mode 2: FILE (original)
        if (args.length < 2) {
            console.error('❌ Error: pdf-path and norm-source-id required');
            process.exit(1);
        }

        [pdfPath, normSourceId] = args;
        const metaParamsPath = args[2];

        // Load meta parameters
        metaParams = {
            documentTitle: 'Нормативный документ',
            documentType: 'Норма',
            regulationArea: 'Общие требования',
            jurisdiction: 'KZ',
            bindingLevel: 'обязательный'
        };

        if (metaParamsPath) {
            const meta = JSON.parse(await fs.readFile(metaParamsPath, 'utf-8'));
            metaParams = { ...metaParams, ...meta };
        }
    }

    try {
        // Parse
        const fragments = await parseUniversalNorm(pdfPath, metaParams);

        // Save results to JSON
        const outputFile = `raw-fragments-${normSourceId}.json`;
        await fs.writeFile(
            outputFile,
            JSON.stringify(fragments, null, 2)
        );
        console.log(`📁 Saved to: ${outputFile}\n`);

        // Save to database
        await saveFragmentsToDatabase(fragments, normSourceId);

        console.log('='.repeat(70));
        console.log('✅ PARSING COMPLETED SUCCESSFULLY!');
        console.log(`📊 Total fragments: ${fragments.length}\n`);

    } catch (error) {
        console.error('\n❌ CRITICAL ERROR:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { parseUniversalNorm, saveFragmentsToDatabase };
