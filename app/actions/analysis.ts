'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function analyzeNormRequirements(normId: string) {
    try {
        console.log('[OpenAI] Starting enrichment for Norm:', normId);

        const supabase = createClient();

        // 1. Fetch Requirements
        const { data: requirements, error: fetchError } = await supabase
            .from('requirements')
            .select('*')
            .eq('normSourceId', normId);

        if (fetchError || !requirements || requirements.length === 0) {
            return { success: false, error: 'No requirements found to analyze.' };
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) return { success: false, error: 'OPENAI_API_KEY not configured' };

        // 2. Prepare Batch Prompt
        const batch = requirements.map((req, idx) =>
            `${idx + 1}. [${req.clause}] ${req.requirementTextFull || req.requirementTextShort}`
        ).join('\n\n');

        const prompt = `Проанализируй нормативные требования безопасности и для КАЖДОГО определи параметры.
Верни строго JSON объект с полем "results", которое является массивом.

ПАРАМЕТРЫ:
1. "index": порядковый номер из списка выше.
2. "checkMethod": "visual" (осмотр), "measurement" (измерения), "testing" (тесты), "documentation" (документы).
3. "severityHint": "critical" (жизнь/пожар), "major" (работа системы), "minor" (рекомендации).
4. "isMultipleHint": true (если это датчики, клапаны, кабели - много штук), false (если система целиком или 1 агрегат).
5. "tags": массив строк (напр. ["монтаж", "пожарная-безопасность"]).

ТРЕБОВАНИЯ:
${batch}`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "You are an expert technical auditor. Return strictly valid JSON object with 'results' array." },
                    { role: "user", content: prompt }
                ],
                response_format: { type: "json_object" },
                temperature: 0.1
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const completion = await response.json();
        const content = JSON.parse(completion.choices[0].message.content);
        const analyses = content.results || [];

        // 3. Batch Update Table
        // For Supabase, we can use upsert if we include the ID
        const updates = analyses.map((analysis: any) => {
            const req = requirements[analysis.index - 1];
            if (!req) return null;
            return {
                id: req.id,
                checkMethod: analysis.checkMethod,
                severityHint: analysis.severityHint,
                isMultipleHint: analysis.isMultipleHint,
                tags: analysis.tags,
                updatedAt: new Date().toISOString()
            };
        }).filter(Boolean);

        const { error: updateError } = await supabase
            .from('requirements')
            .upsert(updates);

        if (updateError) throw updateError;

        revalidatePath(`/norm-library/${normId}`);
        return { success: true, count: updates.length };

    } catch (e: any) {
        console.error('OpenAI Analysis error:', e);
        return { success: false, error: e.message };
    }
}
