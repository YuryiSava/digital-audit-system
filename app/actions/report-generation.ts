'use server';

import { createClient } from '@/utils/supabase/server';

export async function generateAuditReportContent(checklistId: string) {
    try {
        console.log('Generating AI report for checklist:', checklistId);
        const supabase = createClient();

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
        const projectInfo = `${checklist.project?.name || 'Объект'} (${checklist.project?.address || 'Адрес не указан'})`;

        const defects = checklist.results?.filter((r: any) => r.status === 'DEFECT' || r.status === 'VIOLATION') || [];

        // Construct Prompt
        let defectsListText = '';
        if (defects.length > 0) {
            defectsListText = defects.slice(0, 50).map((d: any, idx: number) => {
                return `${idx + 1}. Пункт нормы ${d.requirement.clause || '—'}: ${d.requirement.content || '—'}\n   Выявленный дефект: ${d.comment || 'Описание не указано инженером'}`;
            }).join('\n\n');
        } else {
            defectsListText = 'Дефектов не выявлено. Система находится в исправном состоянии.';
        }

        const prompt = `Ты - ведущий эксперт по техническому аудиту систем безопасности в Казахстане. 
Проанализируй данные аудита «${systemName}» на объекте «${projectInfo}».

ВЫЯВЛЕННЫЕ ДЕФЕКТЫ:
${defectsListText}

ЗАДАЧА:
Напиши профессиональное заключение для руководства. Стиль строго деловой, экспертный, лаконичный.
Верни только JSON с полями:
1. "summary": Экспертное заключение (3-4 предложения). Оцени общее состояние системы.
2. "risks": Профессиональный список рисков (3-5 пунктов, без номеров), возникающих из-за этих дефектов (пожарная опасность, отказы, штрафы и т.д.).
3. "recommendations": Краткий план действий (3-5 пунктов, без номеров) для скорейшего исправления.

Формат JSON:
{
  "summary": "...",
  "risks": "Текст риска 1\\nТекст риска 2...",
  "recommendations": "Рекомендация 1\\nРекомендация 2..."
}`;

        // 3. Call OpenAI API
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) return { success: false, error: 'OPENAI_API_KEY not configured' };

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "You are an expert technical auditor. Output strictly JSON in Russian." },
                    { role: "user", content: prompt }
                ],
                response_format: { type: "json_object" },
                temperature: 0.3
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('OpenAI Error:', response.status, errText);
            return { success: false, error: `AI Service Error: ${response.status}` };
        }

        const result = await response.json();
        const contentStr = result.choices[0]?.message?.content;

        if (!contentStr) return { success: false, error: 'AI returned empty response' };

        return { success: true, data: JSON.parse(contentStr) };

    } catch (e: any) {
        console.error('Report AI Error:', e);
        return { success: false, error: e.message };
    }
}
export async function generateExecutiveSummary(projectId: string) {
    try {
        const supabase = createClient();

        // 1. Fetch Project and all Checklists
        const { data: project, error: pError } = await supabase
            .from('projects')
            .select(`
                *,
                checklists:audit_checklists(
                    id,
                    status,
                    requirementSet:requirement_sets(system:systems(name)),
                    results:audit_results(
                        status,
                        comment,
                        requirement:requirements(clause, content)
                    )
                )
            `)
            .eq('id', projectId)
            .single();

        if (pError || !project) {
            return { success: false, error: pError?.message || 'Project not found' };
        }

        // 2. Aggregate Data
        const systemSummaries = project.checklists.map((cl: any) => {
            const systemName = cl.requirementSet?.system?.name || 'Техническая система';
            const totalItems = cl.results?.length || 0;
            const defects = cl.results?.filter((r: any) => r.status === 'DEFECT' || r.status === 'VIOLATION') || [];

            return {
                name: systemName,
                status: cl.status,
                stats: `${defects.length} дефектов из ${totalItems} проверок`,
                keyDefects: defects.slice(0, 5).map((d: any) =>
                    `[${d.requirement?.clause || '—'}] ${d.comment || d.requirement?.content || '—'}`
                )
            };
        });

        // 3. Construct Managerial Prompt
        const prompt = `Ты - главный аудитор систем безопасности. Подготовь сводный отчет (Executive Summary) для руководства по объекту «${project.name}» (${project.address || 'адрес не указан'}).
        
СОСТОЯНИЕ СИСТЕМ:
${systemSummaries.map((s: any) => `- ${s.name}: ${s.status} (${s.stats})\n  Ключевые проблемы: ${s.keyDefects.join('; ') || 'нет'}`).join('\n')}

ЗАДАЧА:
Напиши краткое, но емкое резюме для собственника/директора объекта.
Верни только JSON с полями:
1. "overview": Общая картина по объекту в 2-3 предложениях. Укажи критичность ситуации.
2. "criticalIssues": Список из 3-4 самых серьезных проблем, объединяющих разные системы (например, системные ошибки обслуживания).
3. "strategicSteps": Список из 3-4 приоритетных шагов для исправления ситуации на уровне менеджмента.

Формат JSON:
{
  "overview": "...",
  "criticalIssues": ["...", "..."],
  "strategicSteps": ["...", "..."]
}`;

        // 4. Call AI
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) return { success: false, error: 'OPENAI_API_KEY not configured' };

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "You are an executive auditor giving a high-level summary to management. Output strictly JSON in Russian." },
                    { role: "user", content: prompt }
                ],
                response_format: { type: "json_object" },
                temperature: 0.3
            })
        });

        if (!response.ok) throw new Error(`AI API error: ${response.status}`);

        const result = await response.json();
        const content = JSON.parse(result.choices[0]?.message?.content || '{}');

        return { success: true, data: content, rawStats: systemSummaries };

    } catch (e: any) {
        console.error('Executive Report Error:', e);
        return { success: false, error: e.message };
    }
}
