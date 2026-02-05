'use server';

import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// ============================================================================
// UNIVERSAL META-PROMPT (SYSTEM) - PURE COPY FROM parse-pdf-universal.js
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

🚨🚨🚨 КРИТИЧЕСКИ ВАЖНОЕ ПРАВИЛО — ЯЗЫК 🚨🚨🚨

Документ ДВУЯЗЫЧНЫЙ (казахский + русский).
ТЫ ОБЯЗАН ПОЛНОСТЬЮ ИГНОРИРОВАТЬ КАЗАХСКИЙ ЯЗЫК.

❌ ПРИЗНАКИ КАЗАХСКОГО ТЕКСТА (ПРОПУСКАЙ ВСЁ ЭТО):
• Окончания: -ның, -нің, -дың, -дің, -тың, -тің
• Слова: болуы тиіс, қабылданады, рұқсат етіледі, талап етіледі
• Суффиксы: -лар/-лер, -дар/-дер, -тар/-тер
• Специфичные буквы: ә, ғ, қ, ң, ө, ұ, ү, һ, і

✅ ИЗВЛЕКАЙ ТОЛЬКО РУССКИЙ ТЕКСТ:
• "должен", "не допускается", "следует", "требуется"
• Стандартная кириллица без казахских букв

⚠️ ПРИОРИТЕТ: русский текст. Но если сомневаешься — ВКЛЮЧИ фрагмент (лучше включить казахский, чем пропустить важное).
⚠️ Если в колонке таблицы казахский текст — попробуй найти русский эквивалент в соседней колонке.
`;

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

const OUTPUT_FORMAT = `
## ФОРМАТ ВЫХОДНЫХ ДАННЫХ

Верни ТОЛЬКО ВАЛИДНЫЙ JSON массив объектов. Каждый объект - отдельный фрагмент:

[
  {
    "source_section": "раздел / глава",
    "source_clause": "пункт / подпункт",
    "raw_text": "ТОЧНАЯ цитата без изменений",
    "detected_modality": "должен | не допускается | следует | рекомендуется | null",
    "detected_conditions": ["условие 1", "условие 2"],
    "detected_parameters": [
      {
        "value": "число",
        "unit": "единица",
        "context": "контекст параметра"
      }
    ],
    "predicted_requirement_type": "constructive | functional | parameterized | operational | prohibitive | conditional | base | undefined",
    "check_method": "visual | document | test | measurement | log",
    "tags": ["тег1", "тег2"],
    "confidence_score": 0.95
  }
]

## ПРАВИЛА ЗАПОЛНЕНИЯ ПОЛЕЙ:

### check_method (метод проверки):
- "visual" — визуальный осмотр (установка, монтаж, маркировка)
- "document" — проверка документации (проект, сертификат, акт)
- "test" — функциональное испытание (включение, срабатывание)
- "measurement" — измерения (расстояние, сопротивление, напряжение)
- "log" — проверка журналов (обслуживание, события)

### tags (теги) — определи применимые системы и категории:
- Системы: АПС, СОУЭ, ВН, СКД, ОС, ПТ, ДУ
- Категории: кабели, извещатели, оповещатели, питание, заземление, монтаж

СТРОГИЕ ПРАВИЛА:
❌ НЕ создавай нормативные требования
❌ НЕ переписывай текст
❌ НЕ объединяй разные нормы
❌ НЕ делай логических выводов
❌ НЕ убирай условия и исключения

Если фрагмент сомнительный — извлекай с низким confidence_score (< 0.7).
`;

// ============================================================================
// MONOLITHIC PARSING FUNCTION (SERVER ACTION)
// ============================================================================

export async function runFullParsing(normSourceId: string) {
    console.log(`\n🔍 UNIVERSAL PARSER: Starting full process for ${normSourceId}`);
    const supabase = createClientWithServiceRole();
    const apiKey = process.env.OPENAI_API_KEY;

    try {
        if (!apiKey) throw new Error('OPENAI_API_KEY is missing');

        // 1. Get Norm & File URL
        const { data: norm, error: normError } = await supabase
            .from('norm_sources')
            .select('*')
            .eq('id', normSourceId)
            .single();

        if (normError || !norm) throw new Error('Norm not found');

        await supabase.from('norm_sources').update({
            status: 'PARSING',
            parsing_details: 'Поиск файла...',
            updatedAt: new Date().toISOString()
        }).eq('id', normSourceId);

        const { data: files } = await supabase
            .from('norm_files')
            .select('storageUrl')
            .eq('normSourceId', normSourceId)
            .order('uploadedAt', { ascending: false })
            .limit(1);

        if (!files || !files.length) throw new Error('File record not found');
        const storageUrl = files[0].storageUrl;

        // 2. Download File (HTTP or Local or Storage)
        let pdfBuffer: Buffer;
        await supabase.from('norm_sources').update({ parsing_details: 'Скачивание файла...' }).eq('id', normSourceId);

        if (storageUrl.startsWith('http')) {
            // Public/External URL
            const res = await fetch(storageUrl);
            const arrayBuffer = await res.arrayBuffer();
            pdfBuffer = Buffer.from(arrayBuffer);
        } else if (storageUrl.includes('norm-docs/')) {
            // Internal Storage Path
            const path = storageUrl.split('norm-docs/')[1];
            const { data, error } = await supabase.storage.from('norm-docs').download(path);
            if (error) throw error;
            pdfBuffer = Buffer.from(await data.arrayBuffer());
        } else {
            // Local File Path (Dev Mode)
            const fs = require('fs');
            // Try explicit path first, then relative to cwd
            if (fs.existsSync(storageUrl)) {
                pdfBuffer = fs.readFileSync(storageUrl);
            } else {
                throw new Error(`Local file not found: ${storageUrl}`);
            }
        }

        // 3. Extract Text via PDF-Parse
        await supabase.from('norm_sources').update({ parsing_details: 'Извлечение текста (PDF)...' }).eq('id', normSourceId);

        // Revert to require for robustness
        const pdf = require('pdf-parse');
        const pdfData = await pdf(pdfBuffer);
        const fullText = pdfData.text;

        if (!fullText || fullText.length < 50) throw new Error('Текст PDF пуст или не извлечен');
        console.log(`   ✅ Extracted ${fullText.length} chars`);

        // 4. Chunking
        const CHUNK_SIZE = 12000;
        const chunks = [];
        for (let i = 0; i < fullText.length; i += CHUNK_SIZE) {
            chunks.push(fullText.substring(i, i + CHUNK_SIZE));
        }
        console.log(`   📦 Split into ${chunks.length} chunks`);

        // 5. AI Loop (Parallel Batches of 3)
        const BATCH_SIZE = 3;
        let allFragments: any[] = [];
        let fragmentCounter = 1;

        for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
            const currentBatch = chunks.slice(i, i + BATCH_SIZE);
            const batchIndex = Math.floor(i / BATCH_SIZE) + 1;
            const totalBatches = Math.ceil(chunks.length / BATCH_SIZE);

            const msg = `Обработка AI: батч ${batchIndex}/${totalBatches}`;
            console.log(`   [Batch ${batchIndex}] Processing...`);
            await supabase.from('norm_sources').update({ parsing_details: msg }).eq('id', normSourceId);

            const batchPromises = currentBatch.map(async (chunk, idx) => {
                const chunkNum = i + idx + 1;
                const MAX_RETRIES = 3;

                for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
                    try {
                        console.log(`   [Chunk ${chunkNum}] Отправка запроса к OpenAI (попытка ${attempt})...`);

                        const response = await fetch('https://api.openai.com/v1/chat/completions', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                            body: JSON.stringify({
                                model: "gpt-4o-mini",
                                messages: [
                                    { role: "system", content: SYSTEM_PROMPT + '\n' + EXTRACTION_CRITERIA + '\n' + OUTPUT_FORMAT },
                                    { role: "user", content: `## ТЕКСТ (БЛОК ${chunkNum})\n${chunk}\n\n🚨 ПРАВИЛО: Извлекай ТОЛЬКО русский текст.\nВерни JSON массив.` }
                                ],
                                response_format: { type: "json_object" },
                                temperature: 0.1
                            })
                        });

                        if (!response.ok) {
                            const errorText = await response.text();
                            console.error(`   ❌ [Chunk ${chunkNum}] HTTP ошибка ${response.status}: ${errorText.substring(0, 200)}`);
                            if (attempt < MAX_RETRIES) {
                                await new Promise(r => setTimeout(r, 2000 * attempt));
                                continue;
                            }
                            return [];
                        }

                        const result = await response.json();
                        const content = result.choices[0]?.message?.content;

                        if (!content) {
                            console.warn(`   ⚠️ [Chunk ${chunkNum}] Пустой ответ от AI`);
                            return [];
                        }

                        console.log(`   📥 [Chunk ${chunkNum}] Получен ответ (${content.length} символов)`);

                        let data;
                        try {
                            data = JSON.parse(content);
                        } catch (parseErr) {
                            console.error(`   ❌ [Chunk ${chunkNum}] Ошибка парсинга JSON:`, parseErr);
                            console.error(`   📄 Начало ответа: ${content.substring(0, 300)}...`);
                            return [];
                        }

                        // Robust extraction logic with logging
                        let extractedFragments: any[] = [];
                        if (Array.isArray(data)) {
                            extractedFragments = data;
                            console.log(`   ✅ [Chunk ${chunkNum}] Извлечено ${data.length} фрагментов (массив напрямую)`);
                        } else if (data.fragments && Array.isArray(data.fragments)) {
                            extractedFragments = data.fragments;
                            console.log(`   ✅ [Chunk ${chunkNum}] Извлечено ${data.fragments.length} фрагментов (из .fragments)`);
                        } else if (data.raw_norm_fragments && Array.isArray(data.raw_norm_fragments)) {
                            extractedFragments = data.raw_norm_fragments;
                            console.log(`   ✅ [Chunk ${chunkNum}] Извлечено ${data.raw_norm_fragments.length} фрагментов (из .raw_norm_fragments)`);
                        } else {
                            // Try to find any array in the response
                            const keys = Object.keys(data);
                            console.warn(`   ⚠️ [Chunk ${chunkNum}] Неизвестная структура ответа. Ключи: ${keys.join(', ')}`);
                            for (const key of keys) {
                                if (Array.isArray(data[key])) {
                                    extractedFragments = data[key];
                                    console.log(`   🔍 [Chunk ${chunkNum}] Найден массив в .${key}: ${data[key].length} элементов`);
                                    break;
                                }
                            }
                        }

                        return extractedFragments;

                    } catch (e: any) {
                        console.error(`   ❌ [Chunk ${chunkNum}] Ошибка (попытка ${attempt}):`, e.message);
                        if (attempt < MAX_RETRIES) {
                            await new Promise(r => setTimeout(r, 2000 * attempt));
                            continue;
                        }
                        return [];
                    }
                }
                return [];
            });

            const results = await Promise.all(batchPromises);
            console.log(`   📊 Batch results count: ${results.length}, fragments per result: ${results.map(r => r.length).join(', ')}`);

            // Фильтруем с логированием отброшенных элементов
            const flatResults = results.flat();
            let skippedCount = 0;
            flatResults.forEach((item, idx) => {
                if (typeof item !== 'object' || item === null) {
                    console.warn(`   ⚠️ ОТБРОШЕНО [${idx}]: не объект, тип=${typeof item}, значение="${String(item).substring(0, 50)}..."`);
                    skippedCount++;
                    return;
                }
                if (!item.raw_text) {
                    console.warn(`   ⚠️ ОТБРОШЕНО [${idx}]: нет raw_text, ключи: ${Object.keys(item).join(', ')}`);
                    skippedCount++;
                    return;
                }
                // Валидный фрагмент
                item.fragment_id = `${normSourceId.substring(0, 8)}-${String(fragmentCounter).padStart(5, '0')}`;
                allFragments.push(item);
                fragmentCounter++;
            });

            if (skippedCount > 0) {
                console.warn(`   ⚠️ Всего отброшено невалидных элементов: ${skippedCount}`);
            }
            console.log(`   📈 Total fragments so far: ${allFragments.length}`);
        }

        // 5.5. Сортировка фрагментов по разделу и пункту
        allFragments.sort((a, b) => {
            // Сначала по разделу
            const sectionA = a.source_section || '';
            const sectionB = b.source_section || '';
            if (sectionA !== sectionB) {
                return sectionA.localeCompare(sectionB, 'ru', { numeric: true });
            }
            // Затем по пункту
            const clauseA = a.source_clause || '';
            const clauseB = b.source_clause || '';
            return clauseA.localeCompare(clauseB, 'ru', { numeric: true });
        });

        // Перенумеровка fragment_id после сортировки
        allFragments.forEach((frag, idx) => {
            frag.fragment_id = `${normSourceId.substring(0, 8)}-${String(idx + 1).padStart(5, '0')}`;
        });
        console.log(`   🔢 Фрагменты отсортированы по разделу и пункту`);

        // 6. Save to DB
        console.log(`\n${'='.repeat(60)}`);
        console.log(`   💾 НАЧАЛО СОХРАНЕНИЯ В БД`);
        console.log(`   📊 Всего фрагментов для сохранения: ${allFragments.length}`);
        console.log(`${'='.repeat(60)}`);

        if (allFragments.length === 0) {
            console.warn(`   ⚠️ НЕТ ФРАГМЕНТОВ ДЛЯ СОХРАНЕНИЯ! Проверьте ответы AI.`);
        }

        if (allFragments.length > 0) {
            // Validate fragments before mapping
            const validFragments = allFragments.filter((f: any) => {
                if (!f.raw_text || f.raw_text.trim().length === 0) {
                    console.warn(`   ⚠️ Пропущен фрагмент без raw_text: ${f.fragment_id}`);
                    return false;
                }
                return true;
            });
            console.log(`   ✅ Валидных фрагментов: ${validFragments.length} из ${allFragments.length}`);

            const records = validFragments.map((f: any) => ({
                id: crypto.randomUUID(),
                normSourceId,
                fragmentId: f.fragment_id,
                sourceSection: f.source_section || null,
                sourceClause: f.source_clause || null,
                rawText: f.raw_text,
                detectedModality: f.detected_modality || null,
                detectedConditions: f.detected_conditions || [],
                detectedParameters: f.detected_parameters || null,
                predictedRequirementType: f.predicted_requirement_type || null,
                // checkMethod removed - column doesn't exist in DB
                // tags removed - column doesn't exist in DB
                confidenceScore: f.confidence_score || 0.8,
                status: 'PENDING',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }));

            console.log(`   📝 Первая запись (образец):`, JSON.stringify(records[0], null, 2));

            // Batch insert with detailed logging
            const DB_BATCH = 50;
            let totalSaved = 0;
            let totalErrors = 0;

            for (let i = 0; i < records.length; i += DB_BATCH) {
                const batchNum = Math.floor(i / DB_BATCH) + 1;
                const totalBatches = Math.ceil(records.length / DB_BATCH);
                const batch = records.slice(i, i + DB_BATCH);

                console.log(`   [DB Batch ${batchNum}/${totalBatches}] Сохранение ${batch.length} записей...`);

                const { data: insertData, error: insertError } = await supabase
                    .from('raw_norm_fragments')
                    .insert(batch)
                    .select('id');

                if (insertError) {
                    totalErrors += batch.length;
                    console.error(`   ❌ [DB Batch ${batchNum}] ОШИБКА:`, insertError.message);
                    console.error(`   ❌ Код ошибки:`, insertError.code);
                    console.error(`   ❌ Детали:`, insertError.details);
                    console.error(`   ❌ Hint:`, insertError.hint);
                    console.error(`   📋 Проблемная запись:`, JSON.stringify(batch[0], null, 2));
                } else {
                    const savedCount = insertData?.length || batch.length;
                    totalSaved += savedCount;
                    console.log(`   ✅ [DB Batch ${batchNum}] Сохранено: ${savedCount} записей`);
                }
            }

            console.log(`\n${'='.repeat(60)}`);
            console.log(`   📊 ИТОГ СОХРАНЕНИЯ В БД:`);
            console.log(`   ✅ Успешно сохранено: ${totalSaved}`);
            console.log(`   ❌ Ошибок: ${totalErrors}`);
            console.log(`${'='.repeat(60)}\n`);

            // Update parsing_details with save stats
            await supabase.from('norm_sources').update({
                parsing_details: `Сохранено ${totalSaved} фрагментов, ошибок: ${totalErrors}`
            }).eq('id', normSourceId);
        }

        // 7. Finish
        await supabase.from('norm_sources').update({
            status: 'DRAFT',
            parsing_details: null,
            updatedAt: new Date().toISOString()
        }).eq('id', normSourceId);

        return { success: true, count: allFragments.length };

    } catch (err: any) {
        console.error('CRITICAL PARSING ERROR:', err);
        await supabase.from('norm_sources').update({
            status: 'DRAFT',
            parsing_details: `Ошибка: ${err.message}`,
            updatedAt: new Date().toISOString()
        }).eq('id', normSourceId);
        return { success: false, error: err.message };
    }
}

// Helper with imported createSupabaseClient
function createClientWithServiceRole() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
}

// Stubs for exported functions to keep imports working if needed (deprecated calls)
export async function getSignedReadUrl() { return { success: false, error: 'Deprecated' } }
export async function getSignedUploadUrl() { return { success: false, error: 'Deprecated' } }
export async function notifyTextReady() { return { success: false, error: 'Deprecated' } }
export async function extractNormText() { return { success: false, error: 'Deprecated' } }
export async function processNormBatch() { return { success: false, error: 'Deprecated' } }
