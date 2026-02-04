'use server';

import { createClient } from '@/utils/supabase/server';
import crypto from 'crypto';

/**
 * STEP 0: Save Client-Extracted Text to Storage
 */
export async function saveExtractedText(normSourceId: string, fullText: string) {
    const supabase = createClient();
    try {
        if (!fullText || fullText.length < 100) throw new Error('Текст документа слишком короткий или пустой');

        // Update status
        await supabase.from('norm_sources').update({
            status: 'PARSING',
            parsing_details: 'Сохранение извлеченного текста...',
            updatedAt: new Date().toISOString()
        }).eq('id', normSourceId);

        // Save to Storage (Temp)
        const { data: buckets } = await supabase.storage.listBuckets();
        if (!buckets?.find((b: any) => b.name === 'norm-docs')) {
            await supabase.storage.createBucket('norm-docs', { public: true });
        }

        const tempPath = `temp-text/${normSourceId}.txt`;
        const { error: uploadError } = await supabase.storage
            .from('norm-docs')
            .upload(tempPath, fullText, { contentType: 'text/plain', upsert: true });

        if (uploadError) throw new Error(`Ошибка сохранения текста: ${uploadError.message}`);

        // Calculate chunks
        const CHUNK_SIZE = 12000;
        const chunkCount = Math.ceil(fullText.length / CHUNK_SIZE);

        await supabase.from('norm_sources').update({
            parsing_details: `Текст готов. Всего блоков: ${chunkCount}`,
            updatedAt: new Date().toISOString()
        }).eq('id', normSourceId);

        return {
            success: true,
            chunkCount,
            charCount: fullText.length
        };
    } catch (err: any) {
        console.error('[SAVE] Error:', err);
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

        // 1. Get File Info
        const { data: files } = await supabase.from('norm_files').select('*').eq('normSourceId', normSourceId).limit(1);
        if (!files || files.length === 0) throw new Error('PDF-файл не найден');

        const storageUrl = files[0].storageUrl;

        // 2. Download PDF
        const response = await fetch(storageUrl);
        if (!response.ok) throw new Error('Не удалось скачать файл из хранилища');
        const pdfBuffer = Buffer.from(await response.arrayBuffer());

        // 3. Extract Text
        const pdf = (await import('pdf-parse')).default;
        const pdfData = await pdf(pdfBuffer);
        const fullText = pdfData.text;

        if (!fullText || fullText.length < 100) throw new Error('В PDF не найден текстовый слой');

        // 4. Save to Storage (Temp)
        const { data: buckets } = await supabase.storage.listBuckets();
        if (!buckets?.find((b: any) => b.name === 'norm-docs')) {
            await supabase.storage.createBucket('norm-docs', { public: true });
        }

        const tempPath = `temp-text/${normSourceId}.txt`;
        const { error: uploadError } = await supabase.storage
            .from('norm-docs')
            .upload(tempPath, fullText, { contentType: 'text/plain', upsert: true });

        if (uploadError) throw new Error(`Ошибка сохранения текста: ${uploadError.message}`);

        // Calculate chunks
        const CHUNK_SIZE = 12000;
        const chunkCount = Math.ceil(fullText.length / CHUNK_SIZE);

        await supabase.from('norm_sources').update({
            parsing_details: `Текст извлечен. Всего блоков: ${chunkCount}`,
            updatedAt: new Date().toISOString()
        }).eq('id', normSourceId);

        return {
            success: true,
            chunkCount,
            charCount: fullText.length
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
export async function processNormBatch(normSourceId: string, batchIndex: number, totalChunks: number) {
    const supabase = createClient();
    try {
        const tempPath = `temp-text/${normSourceId}.txt`;

        // 1. Download Text
        const { data: fileData, error: downloadError } = await supabase.storage
            .from('norm-docs')
            .download(tempPath);

        if (downloadError) throw new Error('Не удалось загрузить временный текст');
        const fullText = await fileData.text();

        // 2. Extract specific chunk
        const CHUNK_SIZE = 12000;
        const start = batchIndex * CHUNK_SIZE;
        const chunk = fullText.substring(start, start + CHUNK_SIZE);

        if (!chunk) return { success: true, fragments: [] }; // Done

        // Update progress
        await supabase.from('norm_sources').update({
            parsing_details: `Обработка блока ${batchIndex + 1} из ${totalChunks}...`,
            updatedAt: new Date().toISOString()
        }).eq('id', normSourceId);

        // 3. AI Extraction Logic (Minimal version of the script logic)
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

        // Reuse prompts from parse-pdf-universal.js logic
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "You are an expert technical parser. Extract ONLY Russian normative fragments. Output strictly JSON: {\"fragments\": []}" },
                    { role: "user", content: `Extract fragments from block ${batchIndex + 1}:\n\n${chunk}` }
                ],
                response_format: { type: "json_object" },
                temperature: 0.1
            })
        });

        if (!response.ok) throw new Error(`AI API error: ${response.status}`);
        const result = await response.json();
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

            // Cleanup temp file
            await supabase.storage.from('norm-docs').remove([tempPath]);
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
