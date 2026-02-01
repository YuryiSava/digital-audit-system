require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkLastParse() {
    console.log('\n🔍 ПРОВЕРКА ПОСЛЕДНЕГО ПАРСИНГА\n');
    console.log('='.repeat(70) + '\n');

    // 1. Найти последний файл с фрагментами
    console.log('📁 Поиск файлов с фрагментами...');
    const fragmentFiles = fs.readdirSync(process.cwd())
        .filter(f => f.startsWith('raw-fragments-') && f.endsWith('.json'))
        .map(f => {
            const stats = fs.statSync(path.join(process.cwd(), f));
            return { name: f, mtime: stats.mtime };
        })
        .sort((a, b) => b.mtime - a.mtime);

    if (fragmentFiles.length === 0) {
        console.log('❌ Файлы с фрагментами не найдены!');
        return;
    }

    const latestFile = fragmentFiles[0];
    console.log(`   ✅ Последний файл: ${latestFile.name}`);
    console.log(`   📅 Дата: ${latestFile.mtime.toLocaleString('ru-RU')}\n`);

    // 2. Извлечь normId из имени файла
    const normId = latestFile.name.replace('raw-fragments-', '').replace('.json', '');
    console.log(`📋 Norm ID: ${normId}\n`);

    // 3. Прочитать содержимое файла
    const fragmentsContent = fs.readFileSync(path.join(process.cwd(), latestFile.name), 'utf-8');
    const fragments = JSON.parse(fragmentsContent);
    console.log(`📦 Фрагментов в файле: ${fragments.length}\n`);

    // Показать несколько примеров
    if (fragments.length > 0) {
        console.log('📄 Примеры фрагментов из файла:');
        fragments.slice(0, 3).forEach((f, idx) => {
            console.log(`   ${idx + 1}. [${f.source_clause || 'N/A'}] ${(f.raw_text || '').substring(0, 80)}...`);
        });
        console.log('');
    }

    // 4. Проверить норму в БД
    console.log('🗄️  Проверка в базе данных...\n');

    const { data: norm, error: normError } = await supabase
        .from('norm_sources')
        .select('*')
        .eq('id', normId)
        .single();

    if (normError || !norm) {
        console.log(`   ❌ Норма не найдена в БД! (${normError?.message || 'Not found'})`);
        return;
    }

    console.log(`   ✅ Норма: ${norm.code} - ${norm.title}`);
    console.log(`   📍 Статус: ${norm.status}\n`);

    // 5. Проверить Requirements в БД
    const { data: requirements, error: reqError } = await supabase
        .from('requirements')
        .select('*')
        .eq('normSourceId', normId);

    if (reqError) {
        console.log(`   ❌ Ошибка запроса: ${reqError.message}`);
        return;
    }

    console.log(`💾 Требований в БД для этой нормы: ${requirements?.length || 0}\n`);

    if (requirements && requirements.length > 0) {
        console.log('📄 Примеры требований из БД:');
        requirements.slice(0, 3).forEach((req, idx) => {
            console.log(`   ${idx + 1}. [${req.clause}] ${req.requirementTextShort}`);
            console.log(`      System: ${req.systemId} | Created: ${req.createdAt}`);
        });
        console.log('');
    }

    // 6. Проверить Requirement Sets
    const { data: reqSets, error: setError } = await supabase
        .from('requirement_sets')
        .select('*')
        .ilike('requirementSetId', `%${norm.code.replace(/\s+/g, '-')}%`);

    console.log(`📦 Requirement Sets для ${norm.code}: ${reqSets?.length || 0}\n`);

    if (reqSets && reqSets.length > 0) {
        reqSets.forEach((set, idx) => {
            console.log(`   ${idx + 1}. ${set.requirementSetId}`);
            console.log(`      Status: ${set.status} | Version: ${set.version}`);
            console.log(`      Notes: ${set.notes}\n`);
        });
    }

    // 7. Анализ расхождений
    console.log('='.repeat(70));
    console.log('📊 АНАЛИЗ\n');

    const fragmentsCount = fragments.length;
    const requirementsCount = requirements?.length || 0;
    const diff = fragmentsCount - requirementsCount;

    console.log(`   Фрагментов подготовлено: ${fragmentsCount}`);
    console.log(`   Требований в БД:         ${requirementsCount}`);
    console.log(`   Разница:                 ${diff > 0 ? '+' : ''}${diff}\n`);

    if (diff > 0) {
        console.log('⚠️  ПРОБЛЕМА: Фрагменты не сохранились в БД!');
        console.log('   Возможные причины:');
        console.log('   - Парсинг прервался на этапе сохранения');
        console.log('   - Ошибка при вставке в БД (проверьте логи)');
        console.log('   - Требования были удалены после создания\n');
        console.log('💡 Решение: Запустите скрипт сохранения:');
        console.log(`   node scripts/save-raw-to-db.js ${normId}\n`);
    } else if (diff === 0 && requirementsCount > 0) {
        console.log('✅ ВСЕ В ПОРЯДКЕ: Фрагменты успешно сохранены!');
    } else if (requirementsCount === 0) {
        console.log('❌ ПРОБЛЕМА: Требования отсутствуют в БД!');
        console.log('💡 Решение: Запустите полный пайплайн:');
        console.log(`   node scripts/full-pipeline-v2.js ${normId}\n`);
    }

    console.log('='.repeat(70) + '\n');
}

checkLastParse().catch(console.error);
