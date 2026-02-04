#!/usr/bin/env node
/**
 * ✅ АКТИВНЫЙ ПАРСЕР - ИСПОЛЬЗУЕТСЯ OpenAI API ✅
 * 
 * УНИВЕРСАЛЬНЫЙ ПАРСЕР НОРМАТИВНЫХ ДОКУМЕНТОВ
 * ============================================
 * 
 * Архитектура: PDF → RawNormFragments → Review → Requirements
 * 
 * Основан на UNIVERSAL META-PROMPT
 * Использует OpenAI GPT-4o-mini для парсинга
 * 
 * Работает с ЛЮБЫМИ нормативными документами:
 * - ПУЭ РК, СН РК, СП РК
 * - ГОСТ, ТР ТС
 * - ISO, EN, международные стандарты
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const OpenAI = require('openai');
const pdf = require('pdf-parse');
const fs = require('fs').promises;
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Use service role key for admin access (bypasses RLS)
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey
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
— находишь нормативно значимые фрагменты на РУССКОМ ЯЗЫКЕ,
— сохраняешь точную цитату (только на русском),
— фиксируешь условия, ограничения и параметры,
— сохраняешь привязку к источнику.

🚨 ВАЖНОЕ ПРАВИЛО ЯЗЫКА:
Документ может содержать текст на двух языках (KZ/RU).
ТЫ ДОЛЖЕН ИГНОРИРОВАТЬ ВЕСЬ ТЕКСТ НА КАЗАХСКОМ ЯЗЫКЕ.
ИЗВЛЕКАЙ ТОЛЬКО ТЕКСТ НА РУССКОМ ЯЗЫКЕ.
Если фрагмент (или колонка таблицы) на казахском — ПРОПУСКАЙ ЕГО.
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

    // Set status to PARSING and update progress
    if (metaParams.normSourceId) {
        await supabase
            .from('norm_sources')
            .update({
                status: 'PARSING',
                parsing_details: 'Извлечение текста из PDF...',
                updatedAt: new Date().toISOString()
            })
            .eq('id', metaParams.normSourceId);
    }

    const dataBuffer = await fs.readFile(pdfPath);

    // Use a more robust extraction (similar to our combo helper)
    let fullText = '';
    try {
        const pdfData = await pdf(dataBuffer);
        fullText = pdfData.text;
    } catch (e) {
        console.error('   ❌ pdf-parse failed, text might be empty');
        fullText = '';
    }

    if (!fullText || fullText.length < 100) {
        throw new Error('Не удалось извлечь текст из PDF. Возможно, файл поврежден или защищен.');
    }

    console.log(`   ✅ Extracted ${fullText.length} characters\n`);

    // Step 2: Split into smaller chunks to prevent truncation and allow parallel processing
    const CHUNK_SIZE = 12000; // Balanced for speed and reliability
    const chunks = [];
    for (let i = 0; i < fullText.length; i += CHUNK_SIZE) {
        chunks.push(fullText.substring(i, i + CHUNK_SIZE));
    }
    console.log(`📦 Step 2: Split into ${chunks.length} chunks\n`);

    // Step 3: Process chunks in PARALLEL batches
    console.log('🤖 Step 3: Processing chunks with GPT-4o-mini (Parallel Batches)...\n');

    const allFragments = [];
    let fragmentCounter = 1;

    const BATCH_SIZE = 3; // Process 3 chunks at a time for faster execution
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const currentBatch = chunks.slice(i, i + BATCH_SIZE);
        const batchIndex = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(chunks.length / BATCH_SIZE);

        const progressMessage = `Батч ${batchIndex}/${totalBatches} (блоки ${i + 1}-${Math.min(i + BATCH_SIZE, chunks.length)})`;
        console.log(`   [Batch ${batchIndex}/${totalBatches}] ${progressMessage}...`);

        if (metaParams.normSourceId) {
            await supabase.from('norm_sources').update({ parsing_details: progressMessage }).eq('id', metaParams.normSourceId);
        }

        const batchPromises = currentBatch.map(async (chunk, idx) => {
            const chunkNum = i + idx + 1;
            const userPrompt = `
## META-PARAMETERS
Тип: ${metaParams.documentType} | Юрисдикция: ${metaParams.jurisdiction}

## ТЕКСТ (БЛОК ${chunkNum}/${chunks.length})
${chunk}

🚨 ПРАВИЛО: Извлекай ТОЛЬКО русский текст. Если всё на казахском — верни пустой массив.
Верни ТОЛЬКО валидный JSON: {"raw_norm_fragments": [...]}
`;

            try {
                const completion = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: SYSTEM_PROMPT + '\n' + EXTRACTION_CRITERIA + '\n' + OUTPUT_FORMAT },
                        { role: 'user', content: userPrompt }
                    ],
                    response_format: { type: 'json_object' },
                    temperature: 0.1,
                    max_tokens: 12000 // Increased to handle dense normative text
                });

                const responseText = completion.choices[0].message.content;
                let parsedData = JSON.parse(responseText);
                return parsedData.raw_norm_fragments || parsedData.fragments || (Array.isArray(parsedData) ? parsedData : []);
            } catch (e) {
                console.error(`   ⚠️ Ошибка в блоке ${chunkNum}:`, e.message);
                return [];
            }
        });

        const results = await Promise.all(batchPromises);
        results.flat().forEach(frag => {
            const normPrefix = metaParams.normSourceId ? metaParams.normSourceId.substring(0, 8) : 'UNKNOWN';
            frag.fragment_id = `${normPrefix}-${String(fragmentCounter).padStart(5, '0')}`;
            frag.document_title = metaParams.documentTitle;
            allFragments.push(frag);
            fragmentCounter++;
        });
    }

    console.log(`\n✅ Total fragments extracted: ${allFragments.length}\n`);

    return allFragments;
}

// ============================================================================
// СОХРАНЕНИЕ В БД
// ============================================================================

async function saveFragmentsToDatabase(fragments, normSourceId) {
    console.log('💾 Step 4: Saving fragments to database...\n');
    console.log(`   normSourceId: ${normSourceId}\n`);

    const records = fragments.map(frag => ({
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
    }));

    // Batch insert (Supabase handles this well)
    const BATCH_SIZE = 50;
    let savedCount = 0;

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from('raw_norm_fragments').insert(batch);

        if (error) {
            console.error(`   ❌ Error saving batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error.message);
        } else {
            savedCount += batch.length;
            console.log(`   ✅ Saved ${savedCount}/${records.length} fragments...`);
        }
    }

    console.log(`\n📊 Final stats:`);
    console.log(`   Saved: ${savedCount}`);
    console.log(`   Total: ${fragments.length}\n`);

    // Reset status to DRAFT after completion
    if (normSourceId) {
        await supabase
            .from('norm_sources')
            .update({
                status: 'DRAFT',
                parsing_details: null,
                updatedAt: new Date().toISOString()
            })
            .eq('id', normSourceId);
    }
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

            // Update status in DB with error
            await supabase
                .from('norm_sources')
                .update({
                    status: 'DRAFT',
                    parsing_details: 'Ошибка: PDF-файл не найден. Загрузите файл перед парсингом.',
                    updatedAt: new Date().toISOString()
                })
                .eq('id', normSourceId);

            process.exit(1);
        }

        // Get PDF file path
        const storageUrl = files[0].storageUrl;
        console.log(`   📄 Storage URL: ${storageUrl}`);

        const path = require('path');

        // Check if it's a full URL (Supabase Storage) or local path
        if (storageUrl.startsWith('http://') || storageUrl.startsWith('https://')) {
            // Download from Supabase Storage
            console.log(`   📥 Downloading PDF from Supabase Storage...`);

            try {
                const https = require('https');
                const http = require('http');

                if (normSourceId) {
                    await supabase.from('norm_sources').update({ parsing_details: 'Скачивание PDF из облака...' }).eq('id', normSourceId);
                }
                const protocol = storageUrl.startsWith('https') ? https : http;
                const pdfBuffer = await new Promise((resolve, reject) => {
                    const request = protocol.get(storageUrl, (response) => {
                        console.log(`   📡 Response status: ${response.statusCode}`);

                        if (response.statusCode !== 200) {
                            reject(new Error(`Failed to download PDF: HTTP ${response.statusCode}`));
                            return;
                        }

                        const chunks = [];
                        let downloadedBytes = 0;

                        response.on('data', (chunk) => {
                            chunks.push(chunk);
                            downloadedBytes += chunk.length;
                        });

                        response.on('end', () => {
                            console.log(`   ✅ Download complete: ${(downloadedBytes / 1024 / 1024).toFixed(2)} MB`);
                            resolve(Buffer.concat(chunks));
                        });

                        response.on('error', reject);
                    });

                    request.on('error', reject);
                    request.setTimeout(60000, () => {
                        request.destroy();
                        reject(new Error('Download timeout after 60 seconds'));
                    });
                });

                // Save temporarily - use /tmp for Vercel support
                const os = require('os');
                const tmpPath = os.tmpdir();
                pdfPath = path.join(tmpPath, `${normSourceId}.pdf`);
                await fs.writeFile(pdfPath, pdfBuffer);

                console.log(`   ✅ Saved to: ${pdfPath}`);

            } catch (downloadError) {
                console.error(`   ❌ Download failed:`, downloadError.message);
                process.exit(1);
            }
        } else {
            // Local file path (starts with / or ./)
            console.log(`   📁 Using local file...`);

            // Convert relative path to absolute
            if (storageUrl.startsWith('/')) {
                // Remove leading slash and join with public folder
                pdfPath = path.join(process.cwd(), 'public', storageUrl);
            } else {
                pdfPath = path.join(process.cwd(), storageUrl);
            }

            console.log(`   ✅ Local path: ${pdfPath}`);

            // Check if file exists
            try {
                await fs.access(pdfPath);
                console.log(`   ✅ File exists`);
            } catch (error) {
                console.error(`   ❌ File not found: ${pdfPath}`);
                process.exit(1);
            }
        }

        // Set meta params from norm
        metaParams = {
            normSourceId: normSourceId,
            documentTitle: norm.title,
            documentType: norm.docType || 'Норма',
            regulationArea: norm.keywords?.join(', ') || 'Общие требования',
            jurisdiction: norm.jurisdiction || 'KZ',
            bindingLevel: 'обязательный'
        };

        console.log(`   ✅ Found: ${norm.code} - ${norm.title}\n`);

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

        // Update DB with error if possible
        if (normSourceId) {
            try {
                await supabase
                    .from('norm_sources')
                    .update({
                        status: 'DRAFT',
                        parsing_details: `Ошибка: ${error.message || 'Критический сбой процесса'}`,
                        updatedAt: new Date().toISOString()
                    })
                    .eq('id', normSourceId);
            } catch (dbErr) {
                console.error('   ❌ Could not save error to DB:', dbErr.message);
            }
        }
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { parseUniversalNorm, saveFragmentsToDatabase };
