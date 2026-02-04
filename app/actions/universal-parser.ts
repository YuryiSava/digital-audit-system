'use server';

import { createClient } from '@/utils/supabase/server';
import crypto from 'crypto';

/**
 * STEP -1: Generate Signed URL for Client-Side Extraction
 */
export async function getSignedReadUrl(normSourceId: string) {
    const supabase = createClient();
    try {
        console.log('[SERVER] getSignedReadUrl called for:', normSourceId);

        // 1. Check strict permissions via standard client (RLS)
        const { data: files, error: filesError } = await supabase
            .from('norm_files')
            .select('storageUrl')
            .eq('normSourceId', normSourceId)
            .limit(1);

        if (filesError) {
            console.error('[SERVER] Database error:', filesError);
            throw new Error(`Database error: ${filesError.message}`);
        }

        if (!files || files.length === 0) {
            console.error('[SERVER] No files found for normSourceId:', normSourceId);
            throw new Error('PDF-файл не найден');
        }

        const storageUrl = files[0].storageUrl;
        console.log('[SERVER] Storage URL:', storageUrl);

        // 2. Check if it's already a PUBLIC URL
        if (storageUrl.includes('/public/')) {
            console.log('[SERVER] Public URL detected, returning as-is');
            return { success: true, url: storageUrl };
        }

        // 3. Extract path
        const pathMatch = storageUrl.match(/norm-docs\/(.+)/);
        if (!pathMatch) {
            console.log('[SERVER] Could not extract path from URL, returning as-is');
            return { success: true, url: storageUrl };
        }

        const filePath = pathMatch[1];
        console.log('[SERVER] Creating signed URL for path:', filePath);

        // 4. Use Service Role client for signing (Bypass Storage RLS)
        // This is safe because we verified access to the record in step 1
        const adminClient = createClientWithServiceRole();

        const { data, error } = await adminClient.storage
            .from('norm-docs')
            .createSignedUrl(filePath, 600); // 10 mins

        if (error) {
            console.error('[SERVER] Signed URL error:', error);
            // Fallback: return authorized URL if signing fails (might be public but not detected)
            if (error.message.includes('Object not found')) {
                console.log('[SERVER] Object not found via API, trying direct public URL check...');
                // If we can't sign it, maybe we can just read it? 
                // But for now let's throw detailed error
            }
            throw error;
        }

        console.log('[SERVER] Signed URL created successfully');
        return { success: true, url: data.signedUrl };
    } catch (err: any) {
        console.error('[SERVER] Exception in getSignedReadUrl:', err);
        return { success: false, error: err.message || 'Unknown error' };
    }
}

// Helper for admin client
function createClientWithServiceRole() {
    const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );
}

/**
 * STEP 2.5: Generate Signed URL for Uploading Text (Bypass RLS)
 */
export async function getSignedUploadUrl(normSourceId: string) {
    try {
        console.log('[SERVER] getSignedUploadUrl called for:', normSourceId);
        const adminClient = createClientWithServiceRole();
        const path = `temp-text/${normSourceId}.txt`;

        // Always try to remove the file first to avoid "Resource already exists" error on retries
        await adminClient.storage.from('norm-docs').remove([path]);

        const { data, error } = await adminClient.storage
            .from('norm-docs')
            .createSignedUploadUrl(path);

        if (error) {
            console.error('[SERVER] Failed to create signed upload URL:', error);
            throw error;
        }

        console.log('[SERVER] Signed upload URL created');
        return { success: true, data: data };
    } catch (err: any) {
        console.error('[SERVER] Exception in getSignedUploadUrl:', err);
        return { success: false, error: err.message };
    }
}

/**
 * STEP 0: notify server that text is ready in storage
 */
export async function notifyTextReady(normSourceId: string, charCount: number) {
    const supabase = createClient();
    try {
        const CHUNK_SIZE = 12000;
        const chunkCount = Math.ceil(charCount / CHUNK_SIZE);

        await supabase.from('norm_sources').update({
            parsing_details: `Текст готов (в облаке). Всего блоков: ${chunkCount}`,
            updatedAt: new Date().toISOString()
        }).eq('id', normSourceId);

        return { success: true, chunkCount };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

/**
 * STEP 1: Extract Text and Save to Storage
 */
export async function extractNormText(normSourceId: string) {
    const supabase = createClient();
    try {
        console.log(`[EXTRACT] Starting extraction for ${normSourceId}`);

        // Update status
        await supabase.from('norm_sources').update({
            status: 'PARSING',
            parsing_details: 'Извлечение текста из PDF...',
            updatedAt: new Date().toISOString()
        }).eq('id', normSourceId);

        return {
            success: false,
            error: 'Server-side extraction is deprecated. Use client-side extraction instead.'
        };

    } catch (err: any) {
        console.error('[EXTRACT] Error:', err);
        await supabase.from('norm_sources').update({
            status: 'DRAFT',
            parsing_details: `Ошибка экстракции: ${err.message}`,
            updatedAt: new Date().toISOString()
        }).eq('id', normSourceId);
        return { success: false, error: err.message };
    }
}

/**
 * STEP 2: Process a specific batch via AI
 */
export async function processNormBatch(normSourceId: string, batchIndex: number, totalChunks: number, chunkText: string) {
    const supabase = createClient();
    try {
        if (!chunkText) {
            console.log(`[BATCH ${batchIndex}] Empty chunk text`);
            return { success: true, fragments: [] };
        }

        console.log(`[BATCH ${batchIndex}] Processing chunk length: ${chunkText.length}`);

        // Update progress
        await supabase.from('norm_sources').update({
            parsing_details: `Обработка блока ${batchIndex + 1} из ${totalChunks}...`,
            updatedAt: new Date().toISOString()
        }).eq('id', normSourceId);

        // AI Extraction Logic
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

        // ============================================================================
        // UNIVERSAL META-PROMPT (SYSTEM) - RESTORED FROM parse-pdf-universal.js
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

        // Reuse prompts from parse-pdf-universal.js logic
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT + '\n' + EXTRACTION_CRITERIA + '\n' + OUTPUT_FORMAT },
                    { role: "user", content: `## ТЕКСТ (БЛОК ${batchIndex + 1})\n${chunkText}\n\n🚨 ПРАВИЛО: Извлекай ТОЛЬКО русский текст. Если всё на казахском — верни пустой массив.\nВерни ТОЛЬКО валидный JSON: {"raw_norm_fragments": [...]}` }
                ],
                response_format: { type: "json_object" },
                temperature: 0.1
            })
        });

        if (!response.ok) throw new Error(`AI API error: ${response.status}`);
        const result = await response.json();
        console.log(`[BATCH ${batchIndex}] AI Raw Response:`, result.choices[0]?.message?.content?.substring(0, 200));

        const data = JSON.parse(result.choices[0]?.message?.content || '{"fragments": []}');
        const fragments = data.fragments || data.raw_norm_fragments || [];

        // 4. Save to DB
        if (fragments.length > 0) {
            const records = fragments.map((f: any) => ({
                id: crypto.randomUUID(),
                normSourceId,
                sourceSection: f.source_section || null,
                sourceClause: f.source_clause || null,
                rawText: f.raw_text,
                detectedModality: f.detected_modality || null,
                detectedConditions: f.detected_conditions || [],
                detectedParameters: f.detected_parameters || null,
                predictedRequirementType: f.predicted_requirement_type || null,
                confidenceScore: f.confidence_score || 0.8,
                status: 'PENDING'
            }));

            await supabase.from('raw_norm_fragments').insert(records);
        }

        // Final check
        if (batchIndex + 1 === totalChunks) {
            await supabase.from('norm_sources').update({
                status: 'DRAFT',
                parsing_details: null,
                updatedAt: new Date().toISOString()
            }).eq('id', normSourceId);

            // Cleanup is handled by background job or ignored (it's temp)
        }

        return { success: true, count: fragments.length };

    } catch (err: any) {
        console.error(`[BATCH ${batchIndex}] Error:`, err);
        return { success: false, error: err.message };
    }
}

export async function parseNormUniversal(normSourceId: string) {
    // Keep legacy for compatibility but suggest using staged
    return { success: false, message: 'Use staged parsing instead' };
}
