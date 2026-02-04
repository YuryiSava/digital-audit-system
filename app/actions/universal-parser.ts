'use server';

import { createClient } from '@/utils/supabase/server';
import crypto from 'crypto';
import type { Database } from '@/types/supabase';

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

🚨 ВАЖНОЕ ПРАВИЛО ЯЗЫКА:
Документ может содержать текст на двух языках (KZ/RU).
ТЫ ДОЛЖЕН ИГНОРИРОВАТЬ ВЕСЬ ТЕКСТ НА КАЗАХСКОМ ЯЗЫКЕ.
ИЗВЛЕКАЙ ТОЛЬКО ТЕКСТ НА РУССКОМ ЯЗЫКЕ.
Если фрагмент (или колонка таблицы) на казахском — ПРОПУСКАЙ ЕГО.
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
                try {
                    const response = await fetch('https://api.openai.com/v1/chat/completions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                        body: JSON.stringify({
                            model: "gpt-4o-mini",
                            messages: [
                                { role: "system", content: SYSTEM_PROMPT + '\n' + EXTRACTION_CRITERIA + '\n' + OUTPUT_FORMAT },
                                { role: "user", content: `## ТЕКСТ (БЛОК ${chunkNum})\n${chunk}\n\n🚨 ПРАВИЛО: Извлекай ТОЛЬКО русский текст.\nВерни JSON массив.` }
                            ], // Using slightly simplified user prompt but FULL system prompt
                            response_format: { type: "json_object" },
                            temperature: 0.1
                        })
                    });

                    if (!response.ok) return [];
                    const result = await response.json();
                    const content = result.choices[0]?.message?.content;
                    if (!content) return [];

                    const data = JSON.parse(content);
                    // Robust extraction logic from my last fix
                    if (Array.isArray(data)) return data;
                    if (data.fragments && Array.isArray(data.fragments)) return data.fragments;
                    if (data.raw_norm_fragments && Array.isArray(data.raw_norm_fragments)) return data.raw_norm_fragments;
                    return [];

                } catch (e) {
                    console.error(`Error in chunk ${chunkNum}`, e);
                    return [];
                }
            });

            const results = await Promise.all(batchPromises);
            results.flat().forEach(frag => {
                frag.fragment_id = `${normSourceId.substring(0, 8)}-${String(fragmentCounter).padStart(5, '0')}`;
                allFragments.push(frag);
                fragmentCounter++;
            });
        }

        // 6. Save to DB
        console.log(`   💾 Saving ${allFragments.length} fragments...`);
        if (allFragments.length > 0) {
            const records = allFragments.map((f: any) => ({
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
                confidenceScore: f.confidence_score || 0.8,
                status: 'PENDING',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }));

            // Batch insert
            const DB_BATCH = 50;
            for (let i = 0; i < records.length; i += DB_BATCH) {
                const batch = records.slice(i, i + DB_BATCH);
                await supabase.from('raw_norm_fragments').insert(batch);
            }
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

// Helpers retained
function createClientWithServiceRole() {
    const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
}

// Stub for exported functions to keep imports working temporarily if needed (deprecated)
export async function getSignedReadUrl() { return { success: false } }
export async function getSignedUploadUrl() { return { success: false } }
export async function notifyTextReady() { return { success: false } }
export async function extractNormText() { return { success: false } }
export async function processNormBatch() { return { success: false } }
