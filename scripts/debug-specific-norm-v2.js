require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { extractPdfText } = require('../lib/pdf-helper-combo');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugNorm(normId) {
    console.log(`\n🔍 ДИАГНОСТИКА НОРМЫ: ${normId}\n`);

    // 1. Get Norm Info
    const { data: norm, error } = await supabase
        .from('norm_sources')
        .select('*')
        .eq('id', normId)
        .single();

    if (error || !norm) {
        console.error('❌ Норма не найдена:', error?.message);
        return;
    }

    console.log(`📋 Document: ${norm.code}`);
    console.log(`   Title: ${norm.title}`);
    console.log(`   Status: ${norm.status}\n`);

    // 2. Get Files
    const { data: files } = await supabase
        .from('norm_files')
        .select('*')
        .eq('normSourceId', normId);

    if (!files || files.length === 0) {
        console.error('❌ Файлы не найдены!');
        return;
    }

    console.log(`📂 Файлов: ${files.length}`);
    files.forEach(f => {
        console.log(`   - ${f.fileName} (${(f.fileSize / 1024).toFixed(2)} KB)`);
        console.log(`     URL: ${f.storageUrl}`);
    });
    console.log('');

    // 3. Try to read the file
    try {
        const fileRecord = files[0];
        const relativePath = fileRecord.storageUrl.replace('/uploads/norms/', '');
        // Пробуем разные пути, так как storageUrl может быть разным
        let absolutePath = path.join(process.cwd(), 'public', fileRecord.storageUrl);

        if (!fs.existsSync(absolutePath)) {
            absolutePath = path.join(process.cwd(), 'public', 'uploads', 'norms', path.basename(fileRecord.storageUrl));
        }

        console.log(`📖 Чтение файла: ${absolutePath}`);

        if (!fs.existsSync(absolutePath)) {
            console.error('❌ Файл физически не найден на диске!');
            return;
        }

        const dataBuffer = fs.readFileSync(absolutePath);
        console.log(`   ✅ Файл прочитан, размер: ${dataBuffer.length} байт`);

        console.log('⏳ Тест извлечения текста (PDF Parse)...');
        const text = await extractPdfText(dataBuffer);

        console.log(`   ✅ Текст извлечен! Длина: ${text.length} символов`);
        console.log(`   Первые 100 символов: ${text.substring(0, 100).replace(/\n/g, ' ')}...`);

    } catch (e) {
        console.error('❌ Ошибка при чтении/парсинге PDF:', e);
    }
}

debugNorm('c3cf3466-0081-4ca1-a3b1-cc75ea70769b');
