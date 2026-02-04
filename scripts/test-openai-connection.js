require('dotenv').config({ path: '.env.local' });
const OpenAI = require('openai');

async function testAI() {
    console.log('🔍 Testing OpenAI Connection...');

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error('❌ ERROR: OPENAI_API_KEY is missing in .env.local');
        return;
    }
    console.log('✅ API Key found (starts with):', apiKey.substring(0, 7) + '...');

    const openai = new OpenAI({ apiKey });

    const SYSTEM_PROMPT = `
Ты — специализированный AI-парсер нормативных и технических документов.
Твоя задача — извлекать RAW-ФРАГМЕНТЫ НОРМ (RawNormFragments).
ТЫ ДОЛЖЕН ИГНОРИРОВАТЬ ВЕСЬ ТЕКСТ НА КАЗАХСКОМ ЯЗЫКЕ.
ИЗВЛЕКАЙ ТОЛЬКО ТЕКСТ НА РУССКОМ ЯЗЫКЕ.
`;

    const SAMPLE_TEXT = `
4.1. Здания и сооружения должны быть оборудованы автоматической пожарной сигнализацией.
4.2. Ғимараттар мен құрылыстар автоматты өрт дабылымен жабдықталуы керек.
`;

    console.log('🤖 Sending request to GPT-4o-mini...');

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: `## ТЕКСТ\n${SAMPLE_TEXT}\n\nВерни JSON: {"fragments": [...]}` }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1
        });

        const content = completion.choices[0].message.content;
        console.log('\n✅ AI Response Received:');
        console.log(content);

        const data = JSON.parse(content);
        const fragments = data.fragments || data.raw_norm_fragments || (Array.isArray(data) ? data : []);

        console.log(`\n📊 Extracted Fragments: ${fragments.length}`);
        if (fragments.length > 0) {
            console.log('✅ Success! AI is working.');
        } else {
            console.error('❌ AI returned empty result. Prompt might be too restrictive or model failed.');
        }

    } catch (error) {
        console.error('\n❌ OpenAI API Error:', error.message);
        if (error.code) console.error('Error Code:', error.code);
    }
}

testAI();
