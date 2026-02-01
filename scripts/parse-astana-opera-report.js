#!/usr/bin/env node
/**
 * AI-парсер отчета Астана опера (Word/PDF)
 * Извлекает дефекты по указанной системе
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });
const OpenAI = require('openai');
const fs = require('fs').promises;
const path = require('path');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const EXTRACTION_PROMPT = `Ты — эксперт по техническому аудиту зданий.

Твоя задача: извлечь из технического отчета ВСЕ дефекты и несоответствия по указанной системе.

Для каждого дефекта создай объект Defect.

ФОРМАТ Defect (JSON):
{
  "defect_id": "последовательный номер (1, 2, 3...)",
  "system": "код системы (APS, SOUE, AUPT, LIFTS, POWER, CCTV, ACS, STAGE_TECH, etc)",
  "location": "точная локация (этаж, помещение, зона)",
  "defect_fact": "описание выявленного дефекта (что обнаружено)",
  "noncomplianceStatement": "ссылка на нарушенный пункт нормы (если есть)",
  "recommendation": "рекомендация по устранению",
  "severity": "критичность: CRITICAL | HIGH | MEDIUM | LOW",
  "impact": "оценка влияния на безопасность (1-4, где 4 - критично)",
  "likelihood": "вероятность последствий (1-4, где 4 - высокая)",
  "photos_mentioned": "массив упоминаний фото ['Фото 1', 'Фото 2'] или []"
}

КРИТИЧНОСТЬ (severity):
- CRITICAL: Прямая угроза жизни и здоровью, система не работает
- HIGH: Серьезное несоответствие, высокий риск
- MEDIUM: Заметное несоответствие, средний риск
- LOW: Незначительное отклонение, низкий риск

СТРОГИЕ ПРАВИЛА:
✅ Извлекай КАЖДЫЙ дефект отдельно
✅ Сохраняй точные формулировки из отчета
✅ Указывай точные локации
✅ НЕ придумывай дефекты - только из текста
✅ Если дефектов нет - верни пустой массив

ФОРМАТ ОТВЕТА:
{
  "system_analyzed": "код системы",
  "total_defects": число,
  "defects": [ {...}, {...}, ... ]
}`;

async function parseAstanaOperaReport(filePath, systemFilter = null) {
    console.log('\n📄 AI-ПАРСЕР ОТЧЕТА АСТАНА ОПЕРА\n');
    console.log('='.repeat(70) + '\n');

    try {
        // Step 1: Read file
        console.log('📂 Step 1: Reading report...');
        const text = await fs.readFile(filePath, 'utf-8');
        console.log(`   ✅ Loaded ${text.length} characters\n`);

        // Step 2: Extract system sections
        const systems = [
            { code: 'STAGE_TECH', name: 'Театральная машинерия', keywords: ['машинери', 'сцен'] },
            { code: 'APS', name: 'АПС', keywords: ['пожарная сигнализация', 'апс', 'извещател'] },
            { code: 'AUPT', name: 'АУПТ', keywords: ['пожаротушение', 'аупт', 'спринклер', 'дренчер'] },
            { code: 'LIFTS', name: 'Лифты', keywords: ['лифт'] },
            { code: 'SOUE', name: 'СОУЭ', keywords: ['соуэ', 'оповещени', 'эвакуац'] },
            { code: 'POWER', name: 'Электрохозяйство', keywords: ['электрохозяйство', 'дгу', 'электр'] },
            { code: 'SECURITY', name: 'Охрана', keywords: ['охран', 'сигнализац'] },
            { code: 'CCTV', name: 'Видеонаблюдение', keywords: ['видеонаблюдени', 'камер'] },
            { code: 'ACS', name: 'СКУД', keywords: ['скуд', 'контроль доступ'] },
            { code: 'GATES', name: 'Ворота', keywords: ['ворота', 'шлагбаум'] },
            { code: 'HVAC', name: 'ОВ и ВК', keywords: ['вентиляци', 'кондиционирован', 'отоплени'] },
            { code: 'CHILLERS', name: 'Чиллеры', keywords: ['чиллер'] }
        ];

        const systemsToProcess = systemFilter
            ? systems.filter(s => s.code === systemFilter)
            : systems;

        console.log('🎯 Step 2: Processing systems...\n');
        if (systemFilter) {
            console.log(`   Filtering for: ${systemFilter}\n`);
        }

        const allDefects = [];

        for (const system of systemsToProcess) {
            console.log(`   [${system.code}] Analyzing ${system.name}...`);

            // Find relevant section
            const regex = new RegExp(system.keywords.join('|'), 'gi');
            const matches = text.match(regex);

            if (!matches || matches.length < 3) {
                console.log(`      ⚠️  Section not found or too small, skipping\n`);
                continue;
            }

            // Extract surrounding text (simple heuristic)
            const firstMatch = text.search(regex);
            const sectionText = text.substring(firstMatch, Math.min(firstMatch + 50000, text.length));

            try {
                const completion = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: EXTRACTION_PROMPT },
                        {
                            role: 'user',
                            content: `Извлеки все дефекты по системе "${system.name}" (код: ${system.code})\n\nТЕКСТ ОТЧЕТА:\n\n${sectionText.substring(0, 40000)}`
                        }
                    ],
                    temperature: 0.1,
                    response_format: { type: 'json_object' }
                });

                const responseText = completion.choices[0].message.content;
                const result = JSON.parse(responseText);

                const defects = result.defects || [];

                if (defects.length > 0) {
                    console.log(`      ✅ Extracted ${defects.length} defects\n`);
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
            `astana-opera-defects${systemFilter ? '-' + systemFilter : ''}.json`
        );

        await fs.writeFile(outputFile, JSON.stringify(allDefects, null, 2), 'utf-8');

        console.log('='.repeat(70));
        console.log('📊 РЕЗУЛЬТАТЫ ПАРСИНГА\n');
        console.log(`   Всего дефектов извлечено: ${allDefects.length}`);

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
        console.log('✅ ПАРСИНГ ЗАВЕРШЕН!\n');

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
    console.error('\n❌ Использование: node parse-astana-opera-report.js <file-path> [system-code]\n');
    console.error('Примеры:');
    console.error('  node parse-astana-opera-report.js report.txt');
    console.error('  node parse-astana-opera-report.js report.txt APS');
    console.error('\nДоступные коды систем:');
    console.error('  APS, SOUE, AUPT, LIFTS, POWER, CCTV, ACS, STAGE_TECH, GATES, HVAC, CHILLERS\n');
    process.exit(1);
}

parseAstanaOperaReport(filePath, systemFilter);
