'use server';

import { supabase } from '@/lib/supabaseClient';

export async function generateAuditReportContent(checklistId: string) {
    try {
        console.log('Generating AI report via OpenAI for checklist:', checklistId);

        // 1. Fetch Audit Data
        const { data: checklist, error: fetchError } = await supabase
            .from('audit_checklists')
            .select(`
                *,
                project:projects(*),
                requirementSet:requirement_sets(system:systems(name)),
                results:audit_results(
                    status,
                    comment,
                    requirement:requirements(*)
                )
            `)
            .eq('id', checklistId)
            .single();

        if (fetchError || !checklist) {
            console.error('DB Fetch Error:', fetchError);
            return { success: false, error: fetchError ? fetchError.message : 'Checklist not found' };
        }

        // 2. Prepare Data
        const systemName = checklist.requirementSet?.system?.name || 'Система безопасности';
        const projectInfo = `${checklist.project?.name || 'Объект'} (${checklist.project?.objectType || 'Тип не указан'})`;

        const defects = checklist.results?.filter((r: any) =>
            r.status === 'VIOLATION' || r.status === 'FAIL' || r.status === 'WARNING'
        ) || [];

        const violationsCount = defects.filter((r: any) => r.status === 'VIOLATION' || r.status === 'FAIL').length;
        const warningsCount = defects.filter((r: any) => r.status === 'WARNING').length;

        // Construct Prompt
        let defectsListText = '';
        if (defects.length > 0) {
            defectsListText = defects.slice(0, 50).map((d: any, idx: number) => {
                const severity = d.status === 'VIOLATION' || d.status === 'FAIL' ? 'КРИТИЧНО' : 'Замечание';
                return `${idx + 1}. [${severity}] ${d.requirement.clause || 'Пункт нормы'}: ${d.requirement.requirementTextShort || 'Требование'}\n   Суть нарушения: ${d.comment || 'Не указана'}`;
            }).join('\n\n');
        } else {
            defectsListText = 'Дефектов не выявлено. Система полностью соответствует нормам.';
        }

        const prompt = `Ты - опытный технический аудитор. Проанализируй данные аудита и напиши профессиональное заключение.

СИСТЕМА: ${systemName}
ОБЪЕКТ: ${projectInfo}
СТАТИСТИКА: Критических нарушений: ${violationsCount}, Замечаний: ${warningsCount}

СПИСОК ДЕФЕКТОВ (Топ-50):
${defectsListText}

ЗАДАЧА:
Верни JSON объект с тремя полями (все на русском языке, деловой стиль):
1. "summary": Общее заключение о состоянии (2-3 предложения). Если дефектов много - укажи на критичность. Если нет - похвали.
2. "risks": Список из 3-5 главных рисков, к которым ведут эти нарушения (каждый пункт с новой строки, без маркеров в начале строки, просто текст).
3. "recommendations": Список из 3-5 первоочередных мер для устранения (каждый пункт с новой строки, без маркеров).

Формат ответа строго JSON:
{
  "summary": "...",
  "risks": "Риск 1\nРиск 2...",
  "recommendations": "Мера 1\nМера 2..."
}`;

        // 3. Call OpenAI API
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) return { success: false, error: 'OPENAI_API_KEY not configured in .env.local' };

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "You are a helpful assistant that outputs JSON in Russian." },
                    { role: "user", content: prompt }
                ],
                response_format: { type: "json_object" },
                temperature: 0.3
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('OpenAI API Error:', response.status, errText);
            return { success: false, error: `OpenAI Error: ${response.status}` };
        }

        const result = await response.json();
        const contentStr = result.choices[0]?.message?.content;

        if (!contentStr) return { success: false, error: 'No content from OpenAI' };

        try {
            const content = JSON.parse(contentStr);
            return { success: true, data: content };
        } catch (e) {
            console.error('JSON parse error:', e);
            return { success: false, error: 'Failed to parse OpenAI response' };
        }

    } catch (e: any) {
        console.error('Report generation error:', e);
        return { success: false, error: e.message };
    }
}
