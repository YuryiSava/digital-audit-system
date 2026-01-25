require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function listNorms() {
    console.log('\n📚 Нормативные документы в базе:\n');

    const { data: norms } = await supabase
        .from('norm_sources')
        .select(`
      id,
      code,
      title,
      jurisdiction,
      status,
      files:norm_files(id, fileName),
      requirements:requirements(id)
    `)
        .order('code');

    if (!norms || norms.length === 0) {
        console.log('❌ Нет нормативов в базе');
        return;
    }

    console.log(`Всего нормативов: ${norms.length}\n`);

    norms.forEach((norm, idx) => {
        const filesCount = norm.files?.length || 0;
        const reqCount = norm.requirements?.length || 0;

        console.log(`${idx + 1}. ${norm.code} | ${norm.jurisdiction}`);
        console.log(`   ${norm.title.substring(0, 60)}...`);
        console.log(`   📄 PDF: ${filesCount} | ✅ Требований: ${reqCount}`);
        console.log(`   ID: ${norm.id}`);
        console.log('');
    });

    // Summary
    const withFiles = norms.filter(n => n.files && n.files.length > 0).length;
    const withReqs = norms.filter(n => n.requirements && n.requirements.length > 0).length;

    console.log('─────────────────────────────────');
    console.log(`📊 Статистика:`);
    console.log(`   С PDF файлами: ${withFiles}/${norms.length}`);
    console.log(`   С требованиями: ${withReqs}/${norms.length}`);
    console.log(`   Готовы к парсингу: ${withFiles - withReqs}`);
}

listNorms();
