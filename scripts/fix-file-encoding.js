require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function fixFileNames() {
    console.log('\n🔧 Исправление имен файлов в базе данных...\n');

    // Получаем все файлы
    const { data: files, error } = await supabase
        .from('norm_files')
        .select('id, fileName, normSourceId');

    if (error) {
        console.error('❌ Ошибка:', error);
        return;
    }

    console.log(`📊 Найдено файлов: ${files.length}\n`);

    let fixed = 0;

    for (const file of files) {
        // Проверяем есть ли кракозябры (символы вроде Ð, Ñ, â и т.д.)
        const hasBadEncoding = /[ÐÑâ€™Ð¸Ð²]/g.test(file.fileName);

        if (hasBadEncoding) {
            console.log(`❌ Плохая кодировка: ${file.fileName}`);

            // Пытаемся декодировать (UTF-8 → Windows-1251 → UTF-8)
            try {
                const buffer = Buffer.from(file.fileName, 'latin1');
                const fixed = buffer.toString('utf-8');

                console.log(`   ✅ Исправлено на: ${fixed}`);

                // Обновляем в базе
                const { error: updateError } = await supabase
                    .from('norm_files')
                    .update({ fileName: fixed })
                    .eq('id', file.id);

                if (updateError) {
                    console.log(`   ⚠️  Ошибка обновления: ${updateError.message}`);
                } else {
                    fixed++;
                }
            } catch (err) {
                console.log(`   ⚠️  Не удалось исправить`);
            }

            console.log('');
        }
    }

    console.log(`\n📊 Итого исправлено: ${fixed} файлов`);
    console.log('\n💡 Совет: Если некоторые файлы не исправились - удалите и загрузите заново');
}

fixFileNames();
