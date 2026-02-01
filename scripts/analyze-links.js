const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ID чек-листа из вашего URL
const CHECKLIST_ID = '735cbee1-ffd0-4aed-b405-433c1684e178';

async function analyzeLinks() {
    console.log('🔍 ANALYZING DEFECT LINKS...\n');

    // 1. Получаем нарушения из чек-листа
    const { data: defects, error: defectsError } = await supabase
        .from('audit_results')
        .select('*')
        .eq('checklistId', CHECKLIST_ID);
    // Не фильтруем по статусу, берем все, чтобы проверить

    if (defectsError) {
        console.error('❌ Error fetching defects:', defectsError);
        return;
    }

    console.log(`📋 Found ${defects.length} audit items in checklist.`);

    // 2. Получаем новые требования (берем последние созданные)
    const { data: requirements, error: reqError } = await supabase
        .from('requirements')
        .select('id, clause, requirementTextShort, systemId')
        .order('createdAt', { ascending: false })
        .limit(20); // Берем последние 20 (наши новые 9 там точно будут)

    if (reqError) {
        console.error('❌ Error fetching requirements:', reqError);
        return;
    }

    console.log(`📜 Found ${requirements.length} recent requirements to match against.\n`);

    // 3. Готовим промпт для GPT
    const defectsList = defects.map((d, i) =>
        `${i + 1}. [ID: ${d.id}] Comment: "${d.comment || 'No comment'}" Status: ${d.status}`
    ).join('\n');

    const reqList = requirements.map(r =>
        `- [ID: ${r.id}] Clause ${r.clause}: ${r.requirementTextShort}`
    ).join('\n');

    const prompt = `
    У меня есть список нарушений (Defects) и список нормативных требований (Requirements).
    Твоя задача - найти соответствия: какое требование нарушено в каждом дефекте.

    DEFECTS:
    ${defectsList}

    REQUIREMENTS:
    ${reqList}

    Верни JSON в формате:
    {
        "matches": [
            {
                "defectId": "ID дефекта",
                "requirementId": "ID требования",
                "confidence": "HIGH/MEDIUM/LOW",
                "reason": "Почему подходит"
            }
        ]
    }
    
    Если для дефекта нет подходящего требования в списке - НЕ включай его в ответ.
    Ищи только смысловые совпадения.
    `;

    console.log('🤖 Asking GPT to match...\n');

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'user', content: prompt }
            ],
            response_format: { type: 'json_object' }
        });

        const result = JSON.parse(completion.choices[0].message.content);
        console.log('RAW GPT RESPONSE:', JSON.stringify(result, null, 2));
        const matches = result.matches;

        console.log('='.repeat(60));
        console.log(`🔗 FOUND ${matches.length} POTENTIAL LINKS:`);
        console.log('='.repeat(60));

        matches.forEach(m => {
            const defect = defects.find(d => d.id === m.defectId);
            const req = requirements.find(r => r.id === m.requirementId);

            console.log(`\n🔴 Defect: "${defect?.comment?.substring(0, 50)}..."`);
            console.log(`🟢 Matches Requirement ${req?.clause}: "${req?.requirementTextShort?.substring(0, 50)}..."`);
            console.log(`   Confidence: ${m.confidence} (${m.reason})`);
        });

    } catch (e) {
        console.error('GPT Error:', e);
    }
}

analyzeLinks();
