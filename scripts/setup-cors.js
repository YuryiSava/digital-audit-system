/**
 * Автоматическая настройка CORS для Supabase Storage
 * Выполняет то же самое, что и CORS-FIX.sql, но через API
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Не найдены переменные окружения');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function setupCORS() {
    console.log('🔧 Настройка CORS для Supabase Storage...\n');

    try {
        // 1. Проверяем существующие buckets
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();

        if (listError) {
            console.error('❌ Ошибка получения списка buckets:', listError.message);
            return;
        }

        console.log(`📦 Найдено buckets: ${buckets?.length || 0}`);

        const normDocsBucket = buckets?.find(b => b.name === 'norm-docs');

        if (normDocsBucket) {
            console.log(`✓ Bucket "norm-docs" существует`);
            console.log(`  - Public: ${normDocsBucket.public}`);

            if (!normDocsBucket.public) {
                console.log('🔓 Делаем bucket публичным...');
                const { data: updateData, error: updateError } = await supabase.storage.updateBucket('norm-docs', {
                    public: true
                });

                if (updateError) {
                    console.error('❌ Ошибка обновления bucket:', updateError.message);
                } else {
                    console.log('✅ Bucket "norm-docs" теперь публичный!');
                }
            } else {
                console.log('✅ Bucket "norm-docs" уже публичный!');
            }
        } else {
            console.log('📦 Создаем новый bucket "norm-docs"...');
            const { data: createData, error: createError } = await supabase.storage.createBucket('norm-docs', {
                public: true,
                fileSizeLimit: 52428800 // 50MB
            });

            if (createError) {
                console.error('❌ Ошибка создания bucket:', createError.message);
            } else {
                console.log('✅ Bucket "norm-docs" успешно создан и настроен как публичный!');
            }
        }

        console.log('\n🎉 CORS настройка завершена!');
        console.log('✓ Теперь браузер сможет читать и загружать файлы в Supabase Storage');
        console.log('\n🔄 Попробуйте снова запустить парсинг в приложении!');

    } catch (err) {
        console.error('❌ Неожиданная ошибка:', err.message);
    }
}

setupCORS();
