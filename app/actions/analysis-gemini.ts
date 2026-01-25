'use server';

import { supabase } from '@/lib/supabaseClient';
import { revalidatePath } from 'next/cache';

export async function analyzeNormRequirementsWithGemini(normId: string) {
    try {
        console.log('Starting Gemini AI enrichment for Norm ID:', normId);

        // 1. Fetch all requirements for this norm
        const { data: requirements, error: reqError } = await supabase
            .from('requirements')
            .select('*')
            .eq('normSourceId', normId);

        if (reqError || !requirements || requirements.length === 0) {
            return {
                success: false,
                error: 'No requirements found for this norm. Please parse the PDF first.'
            };
        }

        console.log(`Found ${requirements.length} requirements to analyze`);

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return { success: false, error: 'GEMINI_API_KEY not configured' };
        }

        // 2. Prepare batch analysis prompt
        const requirementsText = requirements.map((req, idx) =>
            `${idx + 1}. [${req.clause}] ${req.requirementTextFull}`
        ).join('\n\n');

        const prompt = `Проанализируй следующие нормативные требования и для КАЖДОГО определи:

1. **checkMethod** (метод проверки):
   - "visual" - визуальный осмотр
   - "measurement" - измерения (расстояния, размеры, параметры)
   - "testing" - функциональное тестирование
   - "documentation" - проверка документов

2. **severityHint** (критичность):
   - "critical" - критично (пожарная безопасность, жизнь людей, основные функции)
   - "major" - важно (работоспособность системы, нормативные требования)
   - "minor" - незначительно (рекомендации, эстетика)

3. **tags** (теги, массив строк):
   - Ключевые слова для категоризации
   - Примеры: "пожарная-безопасность", "электробезопасность", "монтаж", "оборудование", "документация"

Требования:
${requirementsText}

Верни результат СТРОГО в формате JSON массива (без markdown, без комментариев):
[
  {
    "index": 1,
    "checkMethod": "visual",
    "severityHint": "critical",
    "tags": ["пожарная-безопасность", "оборудование"]
  },
  ...
]`;

        // 3. Call Gemini API
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
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 8192,
                    }
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API error:', errorText);
            return {
                success: false,
                error: `Gemini API error: ${response.status}`
            };
        }

        const result = await response.json();
        const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!generatedText) {
            return {
                success: false,
                error: 'No analysis received from Gemini'
            };
        }

        console.log('Gemini analysis received');

        // 4. Parse JSON response
        let analyses: Array<{
            index: number;
            checkMethod: string;
            severityHint: string;
            tags: string[];
        }> = [];

        try {
            // Extract JSON from markdown code blocks if present
            const jsonMatch = generatedText.match(/```json\n([\s\S]*?)\n```/) ||
                generatedText.match(/\[[\s\S]*\]/);
            const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : generatedText;
            analyses = JSON.parse(jsonText);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            console.error('Received text:', generatedText);
            return {
                success: false,
                error: 'Failed to parse Gemini analysis. Please try again.'
            };
        }

        if (analyses.length === 0) {
            return {
                success: false,
                error: 'No analysis results received'
            };
        }

        console.log(`Parsed ${analyses.length} analyses`);

        // 5. Update requirements in database
        let updatedCount = 0;

        for (const analysis of analyses) {
            const reqIndex = analysis.index - 1;
            if (reqIndex < 0 || reqIndex >= requirements.length) {
                console.warn(`Invalid index ${analysis.index}, skipping`);
                continue;
            }

            const requirement = requirements[reqIndex];

            const { error: updateError } = await supabase
                .from('requirements')
                .update({
                    checkMethod: analysis.checkMethod,
                    severityHint: analysis.severityHint,
                    tags: analysis.tags,
                    updatedAt: new Date().toISOString()
                })
                .eq('id', requirement.id);

            if (updateError) {
                console.error(`Failed to update requirement ${requirement.id}:`, updateError);
            } else {
                updatedCount++;
            }
        }

        console.log(`Updated ${updatedCount} requirements`);

        revalidatePath(`/norm-library/${normId}`);
        return { success: true, count: updatedCount };

    } catch (e: any) {
        console.error('Unexpected enrichment error:', e);
        return {
            success: false,
            error: `Unexpected error: ${e.message || e.toString()}`
        };
    }
}
