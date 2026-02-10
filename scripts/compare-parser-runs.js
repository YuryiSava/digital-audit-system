/**
 * Сравнение охвата пунктов правил между двумя версиями
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const OLD_ID = 'a339a46c-33f5-4945-abc0-bee817ec15c7';  // 283 фрагмента
const NEW_ID = 'd1655ea8-2712-4ab5-bf0e-ecd6140a0c59';  // 598 фрагментов

async function getClauses(normId) {
    let allFragments = [];
    let offset = 0;
    const pageSize = 500;

    while (true) {
        const { data, error } = await supabase
            .from('raw_norm_fragments')
            .select('sourceSection, sourceClause')
            .eq('normSourceId', normId)
            .range(offset, offset + pageSize - 1);

        if (error || !data || data.length === 0) break;
        allFragments = allFragments.concat(data);
        offset += pageSize;
        if (data.length < pageSize) break;
    }

    // Уникальные пункты
    const clauses = new Set();
    allFragments.forEach(f => {
        const key = `${f.sourceSection || 'без раздела'}|${f.sourceClause || 'без пункта'}`;
        clauses.add(key);
    });

    return clauses;
}

async function main() {
    console.log('📊 АНАЛИЗ ОХВАТА ПУНКТОВ ПРАВИЛ\n');

    const oldClauses = await getClauses(OLD_ID);
    const newClauses = await getClauses(NEW_ID);

    console.log(`Старая версия: ${oldClauses.size} уникальных пунктов`);
    console.log(`Новая версия: ${newClauses.size} уникальных пунктов`);

    // Различия
    const onlyInOld = [...oldClauses].filter(c => !newClauses.has(c)).sort();
    const onlyInNew = [...newClauses].filter(c => !oldClauses.has(c)).sort();
    const inBoth = [...oldClauses].filter(c => newClauses.has(c)).sort();

    console.log(`\nСовпадают: ${inBoth.length}`);
    console.log(`Только в старой: ${onlyInOld.length}`);
    console.log(`Только в новой: ${onlyInNew.length}`);

    // Формируем отчёт
    let report = `# Сравнение охвата пунктов правил\n\n`;
    report += `**Старая версия:** ${oldClauses.size} уникальных пунктов\n`;
    report += `**Новая версия:** ${newClauses.size} уникальных пунктов\n\n`;
    report += `---\n\n`;

    report += `## ✅ Пункты в ОБЕИХ версиях (${inBoth.length})\n\n`;
    report += `| Раздел | Пункт |\n|--------|-------|\n`;
    inBoth.slice(0, 50).forEach(c => {
        const [section, clause] = c.split('|');
        report += `| ${section} | ${clause} |\n`;
    });
    if (inBoth.length > 50) report += `| ... | ещё ${inBoth.length - 50} |\n`;

    report += `\n## 🔴 Только в СТАРОЙ версии (${onlyInOld.length})\n\n`;
    report += `| Раздел | Пункт |\n|--------|-------|\n`;
    onlyInOld.forEach(c => {
        const [section, clause] = c.split('|');
        report += `| ${section} | ${clause} |\n`;
    });

    report += `\n## 🟢 Только в НОВОЙ версии (${onlyInNew.length})\n\n`;
    report += `| Раздел | Пункт |\n|--------|-------|\n`;
    onlyInNew.forEach(c => {
        const [section, clause] = c.split('|');
        report += `| ${section} | ${clause} |\n`;
    });

    fs.writeFileSync('clause-coverage-comparison.md', report, 'utf8');
    console.log('\n✅ Отчёт сохранён: clause-coverage-comparison.md');
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
