'use server';

import { supabase } from '@/lib/supabaseClient';
import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';
import { extractPdfText } from '@/lib/pdf-helper-combo';

export async function parseNormFile(normId: string, targetSystemId?: string) {
    try {
        console.log('Starting AI parsing for Norm ID:', normId, 'System:', targetSystemId);

        // 1. Fetch Norm
        const { data: norm, error: normError } = await supabase
            .from('norm_sources')
            .select('*')
            .eq('id', normId)
            .single();

        if (normError || !norm) {
            return { success: false, error: 'Norm not found' };
        }

        // 2. Fetch associated files with sorting
        const { data: files, error: filesError } = await supabase
            .from('norm_files')
            .select('*')
            .eq('normSourceId', normId)
            .order('uploadedAt', { ascending: false }); // Prioritize newest files

        if (filesError || !files || files.length === 0) {
            return { success: false, error: 'No PDF file attached to this norm.' };
        }

        // 3. Find first valid file
        let text = '';
        let fileUsed = null;

        for (const fileRecord of files) {
            const relativePath = fileRecord.storageUrl;

            // Skip ghost files from old test data
            if (relativePath.includes('test/data')) {
                console.log(`[Parsing] Skipping ghost test file: ${relativePath}`);
                continue;
            }

            // Strategy 1: Trust the DB path (cleaned)
            const cleanPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
            let absolutePath = path.join(process.cwd(), 'public', cleanPath);
            let exists = false;

            try {
                await fs.access(absolutePath);
                exists = true;
            } catch {
                // Strategy 2: Fallback to searching by filename in uploads folder
                const fileName = path.basename(relativePath);
                const fallbackPath = path.join(process.cwd(), 'public', 'uploads', 'norms', fileName);
                try {
                    await fs.access(fallbackPath);
                    console.log(`[Parsing] Found file via fallback path: ${fallbackPath}`);
                    absolutePath = fallbackPath;
                    exists = true;
                } catch {
                    console.warn(`[Parsing] File not found at ${absolutePath} or ${fallbackPath}`);
                }
            }

            if (!exists) continue;

            try {
                const stats = await fs.stat(absolutePath);
                console.log(`[Parsing] Processing file: ${absolutePath} (${stats.size} bytes)`);

                const dataBuffer = await fs.readFile(absolutePath);

                // Use imported helper
                try {
                    text = await extractPdfText(dataBuffer);
                } catch (helperErr: any) {
                    console.error(`[Parsing] Helper failed for ${absolutePath}:`, helperErr);
                }

                console.log(`[Parsing] Extracted text length: ${text?.length}`);

                if (text && text.length >= 50) {
                    fileUsed = fileRecord;
                    console.log('[Parsing] Valid text extracted. Breaking loop.');
                    break; // Found a good file
                } else {
                    console.warn('[Parsing] Text too short for this file.');
                }
            } catch (err: any) {
                console.warn(`[Parsing] Error processing file ${relativePath}: ${err.message}`);
                // Continue to next file
            }
        }

        if (!text || text.length < 50) {
            console.error('[Parsing] Final check failed: Text empty or too short.');
            return { success: false, error: 'Could not extract text from any attached PDF files. Please upload a valid PDF.' };
        }

        if (!text || text.length < 50) {
            return { success: false, error: 'Could not extract text from any attached PDF files. Please upload a valid PDF.' };
        }

        if (!text || text.length < 50) {
            return { success: false, error: 'PDF text is empty or too short.' };
        }

        // 4. OpenAI Processing
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return { success: false, error: 'OPENAI_API_KEY not configured.' };
        }

        console.log(`Sending text to OpenAI (${text.length} chars)...`);

        // Truncate text if too long (approx 100k chars to be safe with 128k context)
        const truncatedText = text.length > 100000 ? text.substring(0, 100000) + '... (truncated)' : text;

        const prompt = `
Ты - аналитик нормативных документов. Твоя задача - извлечь требования из текста ГОСТа/СНиПа.
Текст может быть на двух языках (казахский и русский). ПРИОРИТЕТНО используй РУССКУЮ версию текста для извлечения требований (обычно идет второй колонкой или после казахского текста).
Найди все пункты требований (статьи, пункты), имеющие нумерацию (например, 4.1, 5.2.3, 6.1).
Игнорируй оглавления, введения, библиографию.

Верни JSON объект с массивом "requirements":
{
  "requirements": [
    { 
       "clause": "4.1", 
       "text": "Полный текст требования...", 
       "severity": "CRITICAL" | "WARNING" | "INFO" (оцени критичность сам)
    }
  ]
}

ТЕКСТ ДОКУМЕНТА:
${truncatedText}
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
                    { role: "system", content: "You are a helpful assistant that outputs JSON." },
                    { role: "user", content: prompt }
                ],
                response_format: { type: "json_object" },
                temperature: 0.2
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('OpenAI Error:', errText);
            return { success: false, error: `OpenAI API Error: ${response.status}` };
        }

        const result = await response.json();
        const contentStr = result.choices[0]?.message?.content;

        let extracted: any[] = [];
        try {
            const json = JSON.parse(contentStr);
            extracted = json.requirements || [];
        } catch (e) {
            console.error('JSON Parse Error', e);
            return { success: false, error: 'Failed to parse AI response' };
        }

        console.log(`AI Extracted ${extracted.length} requirements`);

        if (extracted.length === 0) {
            return { success: false, error: 'AI found no requirements in the text.' };
        }

        // 5. Save to Database
        // Create Requirement Set
        const reqSetId = `RS-${norm.code.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now().toString().slice(-4)}`;
        const systemId = targetSystemId || 'APS';

        const { data: reqSet, error: rsError } = await supabase
            .from('requirement_sets')
            .insert({
                id: crypto.randomUUID(),
                requirementSetId: reqSetId,
                systemId: systemId,
                jurisdiction: norm.jurisdiction,
                version: '1.0 (AI-Parsed)',
                status: 'DRAFT',
                notes: `Parsed by GPT-4o-mini from ${norm.code} (Sys: ${systemId})`,
                updatedAt: new Date().toISOString()
            })
            .select()
            .single();

        if (rsError) throw new Error(rsError.message);

        // Insert Requirements
        const requirementsToInsert = extracted.map((item, idx) => ({
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
            mustCheck: item.severity === 'CRITICAL', // Logic: mandatory check if critical
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }));

        const { error: batchError } = await supabase
            .from('requirements')
            .insert(requirementsToInsert);

        if (batchError) throw new Error(batchError.message);

        revalidatePath(`/norm-library/${normId}`);
        revalidatePath(`/norm-library`);

        return { success: true, count: extracted.length };

    } catch (e: any) {
        console.error('Parsing process error:', e);
        return { success: false, error: e.message };
    }
}
