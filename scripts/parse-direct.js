#!/usr/bin/env node
/**
 * Простой и прямой парсер - вы даете текст, он извлекает дефекты
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });
const OpenAI = require('openai');
const fs = require('fs').promises;
const path = require('path');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const SIMPLE_PROMPT = `Ты — эксперт технического аудита.

Извлеки ВСЕ дефекты и несоответствия из предоставленного текста отчета.

Текст содержит:
1. ТАБЛИЦУ с дефектами (строки где "Не исправно")
2. ТЕКСТОВЫЕ РАЗДЕЛЫ с проблемами ("Установлено:", "Вывод:")

ИЗВЛЕКИ КАЖДЫЙ ДЕФЕКТ ОТДЕЛЬНО!

Формат дефекта:
{
  "defect_id": "номер",
  "location": "элемент/локация",
  "defect_fact": "описание проблемы",
  "noncomplianceStatement": "нарушенная норма или 'не указано'",
  "recommendation": "рекомендация",
  "severity": "CRITICAL | HIGH | MEDIUM | LOW",
  "impact": 1-4,
  "likelihood": 1-4
}

Критичность:
- CRITICAL: система не работает, угроза жизни
- HIGH: серьезный дефект, высокий риск
- MEDIUM: заметная проблема
- LOW: незначительная

ВЕРНИ JSON:
{
  "total_defects": число,
  "defects": [...]
}`;

async function parseDirectText(textContent, systemCode = 'APS') {
    console.log('\n📄 ПРЯМОЙ ПАРСЕР ДЕФЕКТОВ\n');
    console.log('='.repeat(70) + '\n');

    try {
        console.log(`📝 Обработка текста (${textContent.length} символов)...\n`);

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: SIMPLE_PROMPT },
                {
                    role: 'user',
                    content: `Извлеки все дефекты из этого текста технического отчета:\n\n${textContent}`
                }
            ],
            temperature: 0.1,
            response_format: { type: 'json_object' }
        });

        const result = JSON.parse(completion.choices[0].message.content);
        const defects = result.defects || [];

        // Add system code
        defects.forEach((d, idx) => {
            d.system = systemCode;
            d.defect_id = String(idx + 1);
        });

        // Save
        const outputFile = path.join(process.cwd(), `astana-opera-defects-${systemCode}-direct.json`);
        await fs.writeFile(outputFile, JSON.stringify(defects, null, 2), 'utf-8');

        console.log('='.repeat(70));
        console.log('📊 РЕЗУЛЬТАТЫ\n');
        console.log(`   Всего дефектов: ${defects.length}\n`);

        const bySeverity = {};
        defects.forEach(d => {
            bySeverity[d.severity] = (bySeverity[d.severity] || 0) + 1;
        });

        console.log('   По критичности:');
        Object.entries(bySeverity).forEach(([sev, count]) => {
            console.log(`      ${sev.padEnd(12)}: ${count}`);
        });

        console.log(`\n   💾 Сохранено: ${outputFile}`);
        console.log('\n' + '='.repeat(70));
        console.log('✅ ПАРСИНГ ЗАВЕРШЕН!\n');

        return defects;

    } catch (error) {
        console.error('\n❌ ОШИБКА:', error.message);
        throw error;
    }
}

// CLI - read from stdin or file
const args = process.argv.slice(2);

if (args.length === 0) {
    console.error('\nИспользование: node parse-direct.js <file.txt> [system-code]\n');
    process.exit(1);
}

(async () => {
    const filePath = args[0];
    const systemCode = args[1] || 'APS';

    const text = await fs.readFile(filePath, 'utf-8');
    await parseDirectText(text, systemCode);
})();
