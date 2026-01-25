require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkLanguage() {
    const normId = 'c3cf3466-0081-4ca1-a3b1-cc75ea70769b';

    console.log('\n🔍 Проверка языка требований:\n');

    const { data: requirements } = await supabase
        .from('requirements')
        .select('clause, requirementTextShort, requirementTextFull')
        .eq('normSourceId', normId)
        .limit(5);

    if (!requirements || requirements.length === 0) {
        console.log('❌ Требования не найдены!');
        return;
    }

    requirements.forEach((req, idx) => {
        console.log(`\n${idx + 1}. Пункт: ${req.clause}`);
        console.log(`   Краткий: ${req.requirementTextShort?.substring(0, 100)}...`);
        if (req.requirementTextFull) {
            console.log(`   Полный:  ${req.requirementTextFull.substring(0, 150)}...`);

            // Проверка языка - ищем казахские буквы (Ұ, Ө, Ә, І, Ң, Ғ, Қ, Һ)
            const kazakhLetters = /[ұөәіңғқһӘӨҰІҢҒҚҺ]/g;
            const kazakhCount = (req.requirementTextFull.match(kazakhLetters) || []).length;

            if (kazakhCount > 0) {
                console.log(`   ⚠️  КАЗАХСКИЙ ТЕКСТ! Найдено ${kazakhCount} казахских букв`);
            } else {
                console.log(`   ✅ Русский текст`);
            }
        }
    });
}

checkLanguage();
