'use server';

import { supabase } from '@/lib/supabaseClient';
import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';
import { extractPdfText } from '@/lib/pdf-helper-combo';

/**
 * Эволюционный парсинг НД (v0.5.1)
 * Обрабатывает документ частями (чанками), что позволяет разбирать файлы любого размера
 * без перегрузки памяти и лимитов OpenAI.
 */
export async function parseNormFile(normId: string, targetSystemId?: string) {
    try {
        console.log(`[AI-Parser] Starting evolved parsing for Norm ID: ${normId}`);

        // 1. Получаем данные норматива
        const { data: norm, error: normError } = await supabase
            .from('norm_sources')
            .select('*')
            .eq('id', normId)
            .single();

        if (normError || !norm) return { success: false, error: 'Норматив не найден в базе' };

        // 2. Ищем прикрепленный файл
        const { data: files } = await supabase
            .from('norm_files')
            .select('*')
            .eq('normSourceId', normId)
            .order('uploadedAt', { ascending: false });

        if (!files || files.length === 0) return { success: false, error: 'К нормативу не прикреплен PDF файл' };

        // 3. Извлекаем текст (используем комбинированный метод)
        let fullText = '';
        const fileRecord = files[0];
        const cleanPath = fileRecord.storageUrl.startsWith('/') ? fileRecord.storageUrl.substring(1) : fileRecord.storageUrl;
        const absolutePath = path.join(process.cwd(), 'public', cleanPath);

        try {
            const dataBuffer = await fs.readFile(absolutePath);
            fullText = await extractPdfText(dataBuffer);
        } catch (err: any) {
            console.error(`[AI-Parser] Text extraction failed: ${err.message}`);
            return { success: false, error: 'Не удалось прочитать текст из PDF' };
        }

        if (!fullText || fullText.length < 100) return { success: false, error: 'Текст в PDF слишком короткий или не распознан' };

        console.log(`[AI-Parser] Total text length: ${fullText.length} chars. Splitting into chunks...`);

        // 4. Разбиваем текст на более крупные чанки (~30000 символов), чтобы уменьшить кол-во запросов к ИИ
        const CHUNK_SIZE = 30000;
        const chunks: string[] = [];
        for (let i = 0; i < fullText.length; i += CHUNK_SIZE) {
            chunks.push(fullText.substring(i, i + CHUNK_SIZE));
        }

        console.log(`[AI-Parser] Total chunks to process: ${chunks.length}`);

        const apiKey = process.env.OPENAI_API_KEY;
        const allExtractedRequirements: any[] = [];
        const seenClauses = new Set<string>();

        // 5. Обрабатываем чанки ПАРАЛЛЕЛЬНО (батчами по 2), чтобы ускорить процесс и не превысить лимиты
        const BATCH_SIZE = 2;
        for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
            const currentBatch = chunks.slice(i, i + BATCH_SIZE);
            console.log(`   - Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(chunks.length / BATCH_SIZE)}...`);

            const batchPromises = currentBatch.map(async (chunk) => {
                const prompt = `
Ты - профессиональный эксперт. Твоя задача: найти требования в тексте ГОСТа/СНиПа.
ФРАГМЕНТ: ${chunk}
ВЕРНИ ТОЛЬКО JSON: {"requirements": [{"clause": "5.1", "text": "...", "severity": "CRITICAL"}]}
`;
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: "gpt-4o-mini",
                        messages: [
                            { role: "system", content: "You are a specialized technical analyst. Output strictly JSON." },
                            { role: "user", content: prompt }
                        ],
                        response_format: { type: "json_object" },
                        temperature: 0.1
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    const content = JSON.parse(result.choices[0]?.message?.content);
                    return content.requirements || [];
                }
                return [];
            });

            const results = await Promise.all(batchPromises);
            results.flat().forEach((req: any) => {
                if (req.clause && !seenClauses.has(req.clause)) {
                    allExtractedRequirements.push(req);
                    seenClauses.add(req.clause);
                }
            });
        }

        if (allExtractedRequirements.length === 0) {
            return { success: false, error: 'AI не нашел подходящих требований в документе' };
        }

        // 6. Сохранение результатов
        const systemId = targetSystemId || 'APS';
        const reqSetId = `RS-${norm.code.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now().toString().slice(-4)}`;

        const { data: reqSet, error: rsError } = await supabase
            .from('requirement_sets')
            .insert({
                id: crypto.randomUUID(),
                requirementSetId: reqSetId,
                systemId: systemId,
                jurisdiction: norm.jurisdiction,
                version: `1.1 (Chunked AI-Parsed)`,
                status: 'DRAFT',
                notes: `Deep parsed by GPT-4o-mini. Total chunks: ${chunks.length}`,
                updatedAt: new Date().toISOString()
            })
            .select()
            .single();

        if (rsError) throw new Error(rsError.message);

        const requirementsToInsert = allExtractedRequirements.map((item, idx) => ({
            id: crypto.randomUUID(),
            requirementId: `REQ-${reqSetId}-${idx + 1}`,
            requirementSetId: reqSet.id,
            systemId: systemId,
            normSourceId: norm.id,
            clause: item.clause,
            requirementTextShort: item.text.length > 250 ? item.text.substring(0, 250) + '...' : item.text,
            requirementTextFull: item.text,
            severityHint: item.severity || 'WARNING',
            checkMethod: 'visual',
            mustCheck: item.severity === 'CRITICAL',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }));

        const { error: batchError } = await supabase
            .from('requirements')
            .insert(requirementsToInsert);

        if (batchError) throw new Error(batchError.message);

        revalidatePath(`/norm-library/${normId}`);
        console.log(`✅ Success! Extracted ${allExtractedRequirements.length} requirements in ${chunks.length} chunks.`);

        return { success: true, count: allExtractedRequirements.length };

    } catch (e: any) {
        console.error('[AI-Parser] Fatal error:', e);
        return { success: false, error: e.message };
    }
}

