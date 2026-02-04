/**
 * Проверка наличия PDF-файла для документа
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

async function checkFile() {
    console.log('🔍 Проверка файла для документа:', normSourceId);
    console.log('═'.repeat(60));

    // 1. Проверяем запись в norm_files
    const { data: files, error: filesError } = await supabase
        .from('norm_files')
        .select('*')
        .eq('normSourceId', normSourceId);

    if (filesError) {
        console.error('❌ Ошибка запроса к norm_files:', filesError.message);
        return;
    }

    if (!files || files.length === 0) {
        console.log('❌ Запись в таблице norm_files НЕ НАЙДЕНА!');
        console.log('\n🔧 РЕШЕНИЕ: Загрузите PDF-файл для этого документа через интерфейс.');
        return;
    }

    console.log(`✓ Найдено записей в norm_files: ${files.length}`);
    files.forEach((file, i) => {
        console.log(`\nФайл ${i + 1}:`);
        console.log(`  ID: ${file.id}`);
        console.log(`  Storage URL: ${file.storageUrl}`);
        console.log(`  File Name: ${file.fileName}`);
        console.log(`  Uploaded: ${file.uploadedAt}`);
    });

    // 2. Проверяем существование файла в Storage
    const storageUrl = files[0].storageUrl;
    const pathMatch = storageUrl.match(/norm-docs\/(.+)/);

    if (!pathMatch) {
        console.log('\n⚠️  Storage URL не содержит путь к файлу в bucket norm-docs');
        console.log('   Возможно, это публичный URL. Проверяю доступность...');
        return;
    }

    const filePath = pathMatch[1];
    console.log(`\n🔍 Проверка существования файла в Storage: ${filePath}`);

    const { data: fileExists, error: existsError } = await supabase.storage
        .from('norm-docs')
        .list(filePath.split('/').slice(0, -1).join('/'));

    if (existsError) {
        console.error('❌ Ошибка проверки Storage:', existsError.message);
        return;
    }

    const fileName = filePath.split('/').pop();
    const found = fileExists?.find(f => f.name === fileName);

    if (!found) {
        console.log('❌ ФАЙЛ НЕ НАЙДЕН В STORAGE!');
        console.log(`\n🔧 РЕШЕНИЕ:`);
        console.log(`   1. Удалите запись из norm_files для normSourceId: ${normSourceId}`);
        console.log(`   2. Загрузите PDF-файл заново через интерфейс`);
        return;
    }

    console.log('✅ Файл существует в Storage!');
    console.log(`   Размер: ${found.metadata?.size || 'unknown'} bytes`);
    console.log(`   Последнее изменение: ${found.updated_at}`);

    // 3. Проверяем возможность создать signed URL
    console.log('\n🔍 Проверка создания signed URL...');
    const { data: signedData, error: signedError } = await supabase.storage
        .from('norm-docs')
        .createSignedUrl(filePath, 60);

    if (signedError) {
        console.error('❌ Ошибка создания signed URL:', signedError.message);
        return;
    }

    console.log('✅ Signed URL создан успешно!');
    console.log(`   URL: ${signedData.signedUrl.substring(0, 100)}...`);

    console.log('\n✅ ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ! Файл доступен для парсинга.');
}

checkFile();
