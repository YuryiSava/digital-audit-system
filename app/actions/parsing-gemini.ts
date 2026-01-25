'use server';

import { supabase } from '@/lib/supabaseClient';
import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';

export async function parseNormFileWithGemini(normId: string) {
    try {
        console.log('Starting Gemini parsing for Norm ID:', normId);

        // 1. Fetch Norm
        const { data: norm, error: normError } = await supabase
            .from('norm_sources')
            .select('*')
            .eq('id', normId)
            .single();

        if (normError || !norm) {
            return { success: false, error: 'Norm not found in database' };
        }

        // 2. Fetch associated files
        const { data: files, error: filesError } = await supabase
            .from('norm_files')
            .select('*')
            .eq('normSourceId', normId);

        if (filesError || !files || files.length === 0) {
            return { success: false, error: 'No files attached to this norm. Please upload a PDF first.' };
        }

        const fileRecord = files[0];
        const relativePath = fileRecord.storageUrl;
        const absolutePath = path.join(process.cwd(), 'public', relativePath);

        console.log('Reading file from:', absolutePath);

        // Check if file exists
        try {
            await fs.access(absolutePath);
        } catch (accessError) {
            return {
                success: false,
                error: `File not found at path: ${absolutePath}. Please re-upload the document.`
            };
        }

        const dataBuffer = await fs.readFile(absolutePath);
        console.log('File read successfully, size:', dataBuffer.length, 'bytes');

        // 3. Call Gemini API to extract text and requirements
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return { success: false, error: 'GEMINI_API_KEY not configured in environment variables' };
        }

        // Convert PDF to base64
        const base64PDF = dataBuffer.toString('base64');

        // Prepare Gemini API request
        const prompt = `Извлеки из этого PDF-документа все нормативные требования.
        
Для каждого требования верни:
- Номер пункта (clause) - например "5.1.2", "6.3", "7.2.1"
- Полный текст требования (text)

Верни результат в формате JSON массива:
[
  {
    "clause": "5.1.2",
    "text": "Полный текст требования..."
  },
  ...
]

Важно:
- Извлекай ТОЛЬКО пункты с числовой нумерацией (например 5.1, 6.2.3)
- Не включай заголовки разделов
- Сохраняй оригинальный текст без изменений`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: prompt
                                },
                                {
                                    inline_data: {
                                        mime_type: 'application/pdf',
                                        data: base64PDF
                                    }
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 8192,
                        response_mime_type: "application/json"
                    }
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API error:', errorText);
            return {
                success: false,
                error: `Gemini API error: ${response.status} - ${errorText}`
            };
        }

        const result = await response.json();
        console.log('Gemini response received');

        // Extract text from response
        const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!generatedText) {
            return {
                success: false,
                error: 'No text extracted from PDF by Gemini'
            };
        }

        console.log('Generated text length:', generatedText.length);

        // Parse JSON from response
        let requirements: Array<{ clause: string; text: string }> = [];
        try {
            // Clean up potentially wrapped JSON (although response_mime_type helps)
            const jsonText = generatedText.replace(/```json\n?|\n?```/g, '').trim();
            requirements = JSON.parse(jsonText);

            // Handle if result is wrapped in an object like { "requirements": [...] }
            if (!Array.isArray(requirements) && typeof requirements === 'object' && requirements !== null) {
                // @ts-ignore
                const possibleArray = Object.values(requirements).find(val => Array.isArray(val));
                if (possibleArray) {
                    requirements = possibleArray;
                }
            }
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            console.log('Raw Gemini text:', generatedText); // Log raw text for debugging
            return {
                success: false,
                error: 'Failed to parse requirements from Gemini response. Check server console for raw output.'
            };
        }

        if (requirements.length === 0) {
            return {
                success: false,
                error: 'No requirements found in the document.'
            };
        }

        console.log(`Extracted ${requirements.length} requirements`);

        // 4. Create Requirement Set
        const reqSetId = `RS-${norm.code.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now().toString().slice(-4)}`;
        const systemId = 'APS';

        const { data: reqSet, error: rsError } = await supabase
            .from('requirement_sets')
            .insert({
                id: crypto.randomUUID(),
                requirementSetId: reqSetId,
                systemId: systemId,
                jurisdiction: norm.jurisdiction,
                version: '1.0 (Gemini-Parsed)',
                status: 'DRAFT',
                notes: `Automatically parsed from ${norm.code} using Gemini AI`,
                updatedAt: new Date().toISOString()
            })
            .select()
            .single();

        if (rsError) {
            console.error('ReqSet Error:', rsError);
            return {
                success: false,
                error: `Failed to create requirement set: ${rsError.message}`
            };
        }

        // 5. Insert Requirements
        const requirementsToInsert = requirements.map((req, idx) => ({
            id: crypto.randomUUID(),
            requirementId: `REQ-${reqSetId}-${idx + 1}`,
            requirementSetId: reqSet.id,
            systemId: systemId,
            normSourceId: norm.id,
            clause: req.clause,
            requirementTextShort: req.text.length > 200 ? req.text.substring(0, 200) + '...' : req.text,
            requirementTextFull: req.text,
            checkMethod: 'visual',
            mustCheck: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }));

        const { error: batchError } = await supabase
            .from('requirements')
            .insert(requirementsToInsert);

        if (batchError) {
            console.error('Batch Insert Error:', batchError);
            return {
                success: false,
                error: `Failed to save requirements: ${batchError.message}`
            };
        }

        revalidatePath(`/norm-library/${normId}`);
        return { success: true, count: requirements.length };

    } catch (e: any) {
        console.error('Unexpected parsing error:', e);
        return {
            success: false,
            error: `Unexpected error: ${e.message || e.toString()}. Check server logs for details.`
        };
    }
}
