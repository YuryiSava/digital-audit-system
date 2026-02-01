require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runEnrichment(normId) {
    console.log(`\n🤖 Запуск OpenAI Enrichment для документа: ${normId}`);
    console.log('--------------------------------------------------');

    // 1. Fetch requirements
    const { data: requirements, error: fetchError } = await supabase
        .from('requirements')
        .select('*')
        .eq('normSourceId', normId);

    if (fetchError || !requirements || requirements.length === 0) {
        console.error('❌ Требования не найдены');
        return;
    }

    console.log(`📦 Найдено требований: ${requirements.length}`);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error('❌ OPENAI_API_KEY не найден');
        return;
    }

    // 2. Prepare batch
    const batch = requirements.map((req, idx) =>
        `${idx + 1}. [${req.clause}] ${req.requirementTextShort}`
    ).join('\n\n');

    const prompt = `Проанализируй нормативные требования безопасности и для КАЖДОГО определи параметры.
Верни строго JSON объект с полем "results", которое является массивом.

ПАРАМЕТРЫ:
1. "index": порядковый номер из списка.
2. "checkMethod": "visual" (осмотр), "measurement" (измерения), "testing" (тесты), "documentation" (документы).
3. "severityHint": "critical" (жизнь/пожар), "major" (работа системы), "minor" (рекомендации).
4. "isMultipleHint": true (если это датчики, оросители, кабели - много штук), false (если система целиком или 1 агрегат).
5. "tags": массив строк (напр. ["монтаж", "пожарная-безопасность"]).

ТРЕБОВАНИЯ:
${batch}`;

    console.log('📡 Отправка запроса в OpenAI (gpt-4o-mini)...');

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
        console.error('❌ Ошибка OpenAI API:', response.status);
        return;
    }

    const result = await response.json();
    const content = JSON.parse(result.choices[0].message.content);
    const analyses = content.results || [];

    console.log('✅ Ответ от ИИ получен. Обновляю базу...\n');

    // 3. Update DB
    for (const analysis of analyses) {
        const idx = analysis.index - 1;
        const req = requirements[idx];
        if (!req) continue;

        console.log(`Обновление пункта [${req.clause}]:`);
        console.log(`   - Метод: ${analysis.checkMethod}`);
        console.log(`   - Критичность: ${analysis.severityHint}`);
        console.log(`   - Множественный объект: ${analysis.isMultipleHint ? 'ДА' : 'НЕТ'}`);
        console.log(`   - Теги: ${analysis.tags.join(', ')}`);

        await supabase
            .from('requirements')
            .update({
                checkMethod: analysis.checkMethod,
                severityHint: analysis.severityHint,
                isMultipleHint: analysis.isMultipleHint,
                tags: analysis.tags,
                updatedAt: new Date().toISOString()
            })
            .eq('id', req.id);
    }

    console.log('\n✨ Обогащение завершено успешно!');
}

const targetId = process.argv[2] || '1d40e08d-7530-4784-bb1b-6adf3d12278f';
runEnrichment(targetId);
