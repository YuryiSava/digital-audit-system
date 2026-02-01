#!/usr/bin/env node
/**
 * Скрипт для конвертации Markdown документации в PDF
 * 
 * Использование:
 *   node scripts/generate-pdf-docs.js
 * 
 * Конвертирует все инструкции для пользователей в PDF формат
 */

const { mdToPdf } = require('md-to-pdf');
const fs = require('fs');
const path = require('path');

// Список документов для конвертации
const documents = [
    // Нормативщик
    {
        input: 'NORMATIVE_SPECIALIST_GUIDE.md',
        output: 'docs/pdf/Инструкция_для_Нормативщика.pdf'
    },
    {
        input: 'NORMATIVE_QUICK_GUIDE.md',
        output: 'docs/pdf/Быстрая_памятка_для_Нормативщика.pdf'
    },
    {
        input: 'NORMATIVE_WORKFLOW_DIAGRAM.md',
        output: 'docs/pdf/Схема_процесса_работы_Нормативщика.pdf'
    },
    // Полевой инженер
    {
        input: 'FIELD_ENGINEER_GUIDE.md',
        output: 'docs/pdf/Инструкция_для_Полевого_инженера.pdf'
    },
    {
        input: 'FIELD_ENGINEER_QUICK_GUIDE.md',
        output: 'docs/pdf/Быстрая_памятка_для_Полевого_инженера.pdf'
    },
    {
        input: 'FIELD_APP_USER_MANUAL.md',
        output: 'docs/pdf/Руководство_по_Field_App.pdf'
    },
    // Главный аудитор
    {
        input: 'LEAD_AUDITOR_GUIDE.md',
        output: 'docs/pdf/Инструкция_для_Главного_аудитора.pdf'
    },
    {
        input: 'LEAD_AUDITOR_QUICK_GUIDE.md',
        output: 'docs/pdf/Быстрая_памятка_для_Главного_аудитора.pdf'
    },
    {
        input: 'REPORT_GENERATION_GUIDE.md',
        output: 'docs/pdf/Руководство_по_отчетам.pdf'
    },
    // Аналитик
    {
        input: 'ANALYST_GUIDE.md',
        output: 'docs/pdf/Инструкция_для_Аналитика.pdf'
    },
    {
        input: 'ANALYST_QUICK_GUIDE.md',
        output: 'docs/pdf/Быстрая_памятка_для_Аналитика.pdf'
    },
    // Координатор и Админ
    {
        input: 'PM_GUIDE.md',
        output: 'docs/pdf/Инструкция_для_Координатора.pdf'
    },
    {
        input: 'ADMIN_GUIDE.md',
        output: 'docs/pdf/Инструкция_для_Администратора.pdf'
    },
    // Общие
    {
        input: 'GETTING_STARTED.md',
        output: 'docs/pdf/Быстрый_старт.pdf'
    },
    // Техническая документация
    {
        input: 'FRAGMENT_CONVERSION_LOGIC.md',
        output: 'docs/pdf/Логика_конвертации_фрагментов.pdf'
    },
    {
        input: 'IMPORTANT_AI_API_INFO.md',
        output: 'docs/pdf/Информация_об_AI_API.pdf'
    },
    {
        input: 'README.md',
        output: 'docs/pdf/README.pdf'
    }
];

async function convertToPdf(doc) {
    const inputPath = path.join(process.cwd(), doc.input);
    const outputPath = path.join(process.cwd(), doc.output);

    console.log(`📄 Конвертирую: ${doc.input} → ${doc.output}`);

    try {
        // Создать директорию если не существует
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Конвертировать MD в PDF
        await mdToPdf(
            { path: inputPath },
            {
                dest: outputPath,
                pdf_options: {
                    format: 'A4',
                    margin: '20mm',
                    printBackground: true
                }
            }
        );

        console.log(`   ✅ Готово: ${doc.output}`);
        return true;
    } catch (error) {
        console.error(`   ❌ Ошибка при конвертации ${doc.input}:`, error.message);
        return false;
    }
}

async function main() {
    console.log('🚀 Начинаю конвертацию документации в PDF...\n');

    let successCount = 0;
    let failCount = 0;

    for (const doc of documents) {
        const success = await convertToPdf(doc);
        if (success) {
            successCount++;
        } else {
            failCount++;
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Успешно: ${successCount}`);
    console.log(`❌ Ошибок: ${failCount}`);
    console.log('='.repeat(60));

    if (successCount > 0) {
        console.log('\n📁 PDF файлы сохранены в: docs/pdf/');
    }
}

main().catch(console.error);
