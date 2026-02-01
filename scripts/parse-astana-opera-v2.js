#!/usr/bin/env node
/**
 * Улучшенный AI-парсер отчета Астана опера v2
 * Специально настроен под формат: Таблица + Текстовые выводы
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });
const OpenAI = require('openai');
const fs = require('fs').promises;
const path = require('path');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const EXTRACTION_PROMPT_V2 = `Ты — эксперт по техническому аудиту систем безопасности.

Твоя задача: извлечь ВСЕ дефекты и несоответствия по указанной системе из технического отчета.

ВАЖНО: Отчет содержит два типа информации:
1. ТАБЛИЦЫ с дефектами (столбцы: Элемент, Что проверяется, Результат, Исправно/Не исправно, Комментарий)
2. ТЕКСТОВЫЕ РАЗДЕЛЫ с выводами ("Установлено:", "Вывод:", "Риски:")

ТЫ ДОЛЖЕН ИЗВЛЕЧЬ ДЕФЕКТЫ ИЗ ОБОИХ ИСТОЧНИКОВ!

ФОРМАТ Defect (JSON):
{
  "defect_id": "последовательный номер",
  "system": "код системы",
  "location": "точная локация/элемент системы",
  "defect_fact": "что обнаружено (факт)",
  "noncomplianceStatement": "нарушенная норма (если указана)",
  "recommendation": "рекомендация по устранению",
  "severity": "CRITICAL | HIGH | MEDIUM | LOW",
  "impact": 1-4,
  "likelihood": 1-4,
  "source": "table | text_section"
}

ПРАВИЛА ИЗВЛЕЧЕНИЯ:

ИЗ ТАБЛИЦ:
- Извлекай КАЖДУЮ СТРОКУ, где "Исправно/Не исправно" = "Не исправно"
- location = значение столбца "Элемент"
- defect_fact = "Результат" + "Что проверяется"
- recommendation = "Комментарий"
- source = "table"

ИЗ ТЕКСТОВЫХ РАЗДЕЛОВ:
- Ищи блоки с заголовками: "Установлено:", "Вывод:", "Конфигурация", "Риски:"
- Каждый пункт списка (с •) = отдельный дефект
- Если пункт описывает проблему → это дефект
- source = "text_section"

КРИТИЧНОСТЬ:
- CRITICAL: система не работает, прямая угроза жизни, нарушение основных функций
- HIGH: серьезное несоответствие, высокий риск отказа
- MEDIUM: заметное несоответствие, требует исправления
- LOW: незначительное отклонение

СТРОГИЕ ПРАВИЛА:
✅ Извлекай ВСЕ дефекты (и из таблиц, и из текста)
✅ НЕ объединяй разные дефекты в один
✅ Сохраняй точные формулировки
✅ Если сомневаешься - извлеки дефект

ФОРМАТ ОТВЕТА:
{
  "system_analyzed": "код системы",
  "total_defects": число,
  "defects_from_table": число,
  "defects_from_text": число,
  "defects": [ {...}, {...}, ... ]
}`;

async function parseAstanaOperaReportV2(filePath, systemFilter = null) {
    console.log('\n📄 AI-ПАРСЕР ОТЧЕТА v2 (УЛУЧШЕННЫЙ)\n');
    console.log('='.repeat(70) + '\n');

    try {
        // Step 1: Read file
        console.log('📂 Step 1: Reading report...');
        const text = await fs.readFile(filePath, 'utf-8');
        console.log(`   ✅ Loaded ${text.length} characters\n`);

        // Step 2: Extract system sections
        const systems = [
            { code: 'STAGE_TECH', name: 'Театральная машинерия', keywords: ['машинери', 'сцен', '4.1'] },
            { code: 'APS', name: 'АПС', keywords: ['пожарная сигнализация', 'апс', '4.2'] },
            { code: 'AUPT', name: 'АУПТ', keywords: ['пожаротушение', 'аупт', '4.3'] },
            { code: 'LIFTS', name: 'Лифты', keywords: ['лифт', '4.4'] },
            { code: 'CCTV', name: 'Видеонаблюдение', keywords: ['видеонаблюдени', '4.5'] },
            { code: 'SECURITY', name: 'Охрана', keywords: ['охран', 'сигнализац', '4.6'] },
            { code: 'SOUE', name: 'СОУЭ', keywords: ['соуэ', 'оповещени', 'эвакуац', '4.7'] },
            { code: 'POWER', name: 'Электрохозяйство', keywords: ['электрохозяйство', 'дгу', '4.8'] },
            { code: 'ACS', name: 'СКУД', keywords: ['скуд', 'контроль доступ', '4.9'] },
            { code: 'GATES', name: 'Ворота', keywords: ['ворота', 'шлагбаум', '4.10'] },
            { code: 'BMS', name: 'Автоматизация здания', keywords: ['автоматизац', 'bms', '4.11'] },
            { code: 'CHILLERS', name: 'Чиллеры', keywords: ['чиллер', '4.12'] },
            { code: 'HVAC', name: 'ОВ и ВК', keywords: ['вентиляци', 'отоплени', '4.13'] }
        ];

        const systemsToProcess = systemFilter
            ? systems.filter(s => s.code === systemFilter)
            : systems;

        console.log('🎯 Step 2: Processing systems (v2 parser)...\n');
        if (systemFilter) {
            console.log(`   Filtering for: ${systemFilter}\n`);
        }

        const allDefects = [];

        for (const system of systemsToProcess) {
            console.log(`   [${system.code}] Analyzing ${system.name} with improved parser...`);

            // Find relevant section
            const sectionPattern = new RegExp(`${system.keywords[system.keywords.length - 1]}[^]*?(?=4\\.\\d+|$)`, 'i');
            const match = text.match(sectionPattern);

            if (!match || match[0].length < 100) {
                console.log(`      ⚠️  Section not found or too small, skipping\n`);
                continue;
            }

            const sectionText = match[0];

            try {
                const completion = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: EXTRACTION_PROMPT_V2 },
                        {
                            role: 'user',
                            content: `Извлеки ВСЕ дефекты по системе "${system.name}" (код: ${system.code}).

ОБЯЗАТЕЛЬНО извлеки дефекты из:
1. Таблиц (где "Не исправно")
2. Текстовых разделов с "Установлено:", "Вывод:", "Риски:"

ТЕКСТ ОТЧЕТА:

${sectionText.substring(0, 50000)}`
                        }
                    ],
                    temperature: 0.1,
                    response_format: { type: 'json_object' }
                });

                const responseText = completion.choices[0].message.content;
                const result = JSON.parse(responseText);

                const defects = result.defects || [];

                if (defects.length > 0) {
                    console.log(`      ✅ Extracted ${defects.length} defects`);
                    console.log(`         - From tables: ${result.defects_from_table || 'N/A'}`);
                    console.log(`         - From text: ${result.defects_from_text || 'N/A'}\n`);
                    allDefects.push(...defects.map(d => ({ ...d, system: system.code })));
                } else {
                    console.log(`      ℹ️  No defects found\n`);
                }

                // Rate limiting delay
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (err) {
                console.error(`      ❌ Error: ${err.message}\n`);
            }
        }

        // Step 3: Save results
        const outputFile = path.join(
            process.cwd(),
            `astana-opera-defects${systemFilter ? '-' + systemFilter : ''}-v2.json`
        );

        await fs.writeFile(outputFile, JSON.stringify(allDefects, null, 2), 'utf-8');

        console.log('='.repeat(70));
        console.log('📊 РЕЗУЛЬТАТЫ ПАРСИНГА v2\n');
        console.log(`   Всего дефектов извлечено: ${allDefects.length}`);

        // Count by source
        const bySource = {
            table: allDefects.filter(d => d.source === 'table').length,
            text: allDefects.filter(d => d.source === 'text_section').length
        };

        console.log('\n   По источникам:');
        console.log(`      Из таблиц:    ${bySource.table}`);
        console.log(`      Из текста:    ${bySource.text}`);

        const bySeverity = {};
        allDefects.forEach(d => {
            bySeverity[d.severity] = (bySeverity[d.severity] || 0) + 1;
        });

        console.log('\n   По критичности:');
        Object.entries(bySeverity).forEach(([sev, count]) => {
            console.log(`      ${sev.padEnd(15)}: ${count}`);
        });

        console.log(`\n   💾 Saved to: ${outputFile}`);
        console.log('\n' + '='.repeat(70));
        console.log('✅ ПАРСИНГ v2 ЗАВЕРШЕН!\n');

        return allDefects;

    } catch (error) {
        console.error('\n❌ ОШИБКА:', error.message);
        console.error(error.stack);
        throw error;
    }
}

// CLI
const filePath = process.argv[2];
const systemFilter = process.argv[3];

if (!filePath) {
    console.error('\n❌ Использование: node parse-astana-opera-v2.js <file-path> [system-code]\n');
    console.error('Примеры:');
    console.error('  node parse-astana-opera-v2.js "Audit teatr_UTF8.txt" APS');
    console.error('\nДоступные коды систем:');
    console.error('  APS, SOUE, AUPT, LIFTS, POWER, CCTV, ACS, STAGE_TECH, GATES, HVAC, BMS, CHILLERS\n');
    process.exit(1);
}

parseAstanaOperaReportV2(filePath, systemFilter);
