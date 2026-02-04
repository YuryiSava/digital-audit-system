/**
 * Тестирование функций парсинга по отдельности
 * Использование: node scripts/test-parsing-functions.js <norm_source_id>
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const normSourceId = process.argv[2] || 'a339a46c-33f5-4945-abc0-bee817ec15c7';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Не найдены переменные окружения');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testGetSignedUrl() {
    console.log('\n🔍 ТЕСТ 1: Получение signed URL...');

    try {
        // Получаем файл
        const { data: files, error: filesError } = await supabase
            .from('norm_files')
            .select('storageUrl')
            .eq('normSourceId', normSourceId)
            .limit(1);

        if (filesError) {
            console.error('❌ Ошибка получения файла:', filesError.message);
            return false;
        }

        if (!files || files.length === 0) {
            console.error('❌ PDF-файл не найден в базе данных');
            return false;
        }

        const storageUrl = files[0].storageUrl;
        console.log('✓ Storage URL:', storageUrl);

        // Пробуем создать signed URL
        const pathMatch = storageUrl.match(/norm-docs\/(.+)/);
        if (!pathMatch) {
            console.log('✓ Файл уже публичный:', storageUrl);
            return true;
        }

        const { data, error } = await supabase.storage
            .from('norm-docs')
            .createSignedUrl(pathMatch[1], 600);

        if (error) {
            console.error('❌ Ошибка создания signed URL:', error.message);
            return false;
        }

        console.log('✓ Signed URL создан:', data.signedUrl.substring(0, 100) + '...');
        return true;

    } catch (err) {
        console.error('❌ Неожиданная ошибка:', err.message);
        return false;
    }
}

async function testStorageUpload() {
    console.log('\n🔍 ТЕСТ 2: Загрузка текста в Storage...');

    try {
        const testText = 'Тестовый текст для проверки загрузки в Storage ' + new Date().toISOString();
        const tempPath = `temp-text/test-${Date.now()}.txt`;

        const { error: uploadError } = await supabase.storage
            .from('norm-docs')
            .upload(tempPath, testText, { contentType: 'text/plain', upsert: true });

        if (uploadError) {
            console.error('❌ Ошибка загрузки:', uploadError.message);
            return false;
        }

        console.log('✓ Текст успешно загружен в', tempPath);

        // Проверяем, что можем скачать
        const { data: downloadData, error: downloadError } = await supabase.storage
            .from('norm-docs')
            .download(tempPath);

        if (downloadError) {
            console.error('❌ Ошибка скачивания:', downloadError.message);
            return false;
        }

        const downloadedText = await downloadData.text();
        console.log('✓ Текст успешно скачан:', downloadedText);

        // Удаляем тестовый файл
        await supabase.storage.from('norm-docs').remove([tempPath]);
        console.log('✓ Тестовый файл удален');

        return true;

    } catch (err) {
        console.error('❌ Неожиданная ошибка:', err.message);
        return false;
    }
}

async function testNotifyTextReady() {
    console.log('\n🔍 ТЕСТ 3: Обновление статуса в базе данных...');

    try {
        const testCharCount = 50000;
        const CHUNK_SIZE = 12000;
        const chunkCount = Math.ceil(testCharCount / CHUNK_SIZE);

        const { error } = await supabase.from('norm_sources').update({
            parsing_details: `[ТЕСТ] Текст готов. Всего блоков: ${chunkCount}`,
            updatedAt: new Date().toISOString()
        }).eq('id', normSourceId);

        if (error) {
            console.error('❌ Ошибка обновления:', error.message);
            return false;
        }

        console.log(`✓ Статус обновлен. Блоков: ${chunkCount}`);
        return true;

    } catch (err) {
        console.error('❌ Неожиданная ошибка:', err.message);
        return false;
    }
}

async function runAllTests() {
    console.log('🧪 Тестирование функций парсинга для документа:', normSourceId);
    console.log('═'.repeat(60));

    const test1 = await testGetSignedUrl();
    const test2 = await testStorageUpload();
    const test3 = await testNotifyTextReady();

    console.log('\n' + '═'.repeat(60));
    console.log('📊 РЕЗУЛЬТАТЫ:');
    console.log('  Signed URL:', test1 ? '✅ OK' : '❌ FAIL');
    console.log('  Storage Upload:', test2 ? '✅ OK' : '❌ FAIL');
    console.log('  DB Update:', test3 ? '✅ OK' : '❌ FAIL');

    if (test1 && test2 && test3) {
        console.log('\n✅ ВСЕ ТЕСТЫ ПРОШЛИ! Функции работают корректно.');
        console.log('   Проблема может быть в клиентской части (браузере).');
    } else {
        console.log('\n❌ ЕСТЬ ПРОБЛЕМЫ! Смотрите ошибки выше.');
    }
}

runAllTests();
