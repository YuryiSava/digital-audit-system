#!/usr/bin/env node
/**
 * Анализ сохраненных RawNormFragments
 */

const fs = require('fs');
const path = require('path');

const fileName = process.argv[2];

if (!fileName) {
    console.error('\n❌ Использование: node analyze-fragments.js <filename.json>\n');
    process.exit(1);
}

const filePath = path.join(process.cwd(), fileName);

if (!fs.existsSync(filePath)) {
    console.error(`\n❌ Файл не найден: ${filePath}\n`);
    process.exit(1);
}

const rawData = fs.readFileSync(filePath, 'utf-8');
const fragments = JSON.parse(rawData);

console.log('\n📊 АНАЛИЗ RAWNO RMFRAGMENTS\n');
console.log('='.repeat(60));
console.log(`📄 Файл: ${fileName}`);
console.log(`✅ Всего фрагментов: ${fragments.length}\n`);

// Statistics by type
const stats = {
    constructive: 0,
    functional: 0,
    parameterized: 0,
    operational: 0,
    prohibitive: 0,
    conditional: 0,
    base: 0,
    other: 0
};

fragments.forEach(f => {
    const type = f.predicted_requirement_type || 'other';
    stats[type] = (stats[type] || 0) + 1;
});

console.log('📈 Распределение по типам:');
console.log('-'.repeat(60));
Object.entries(stats).forEach(([type, count]) => {
    if (count > 0) {
        const percentage = ((count / fragments.length) * 100).toFixed(1);
        console.log(`   ${type.padEnd(20)} : ${String(count).padStart(3)} (${percentage}%)`);
    }
});

// Statistics by modality
console.log('\n📋 Распределение по модальности:');
console.log('-'.repeat(60));
const modalities = {};
fragments.forEach(f => {
    const modality = f.detected_modality || 'null';
    modalities[modality] = (modalities[modality] || 0) + 1;
});

Object.entries(modalities)
    .sort((a, b) => b[1] - a[1])
    .forEach(([modality, count]) => {
        console.log(`   ${modality.padEnd(25)} : ${count}`);
    });

// Parameters count
const withParams = fragments.filter(f => f.detected_parameters && f.detected_parameters.length > 0).length;
const withConditions = fragments.filter(f => f.detected_conditions && f.detected_conditions.length > 0).length;

console.log('\n📌 Дополнительная информация:');
console.log('-'.repeat(60));
console.log(`   С параметрами              : ${withParams}`);
console.log(`   С условиями                : ${withConditions}`);

// Confidence scores
const avgConfidence = (fragments.reduce((sum, f) => sum + (f.confidence_score || 0), 0) / fragments.length).toFixed(2);
const highConfidence = fragments.filter(f => (f.confidence_score || 0) >= 0.9).length;

console.log(`   Средний confidence score   : ${avgConfidence}`);
console.log(`   С высоким confidence (≥0.9): ${highConfidence}`);

// Sample fragments
console.log('\n📝 Примеры фрагментов (первые 5):');
console.log('-'.repeat(60));

fragments.slice(0, 5).forEach((fragment, idx) => {
    console.log(`\n${idx + 1}. [${fragment.source_clause || 'N/A'}] ${fragment.predicted_requirement_type || 'unknown'}`);
    console.log(`   ID: ${fragment.fragment_id}`);
    console.log(`   Текст: ${fragment.raw_text?.substring(0, 120)}...`);
    console.log(`   Модальность: ${fragment.detected_modality || 'none'}`);
    console.log(`   Условия: ${fragment.detected_conditions?.length || 0} | Параметры: ${fragment.detected_parameters?.length || 0} | Confidence: ${fragment.confidence_score || 'N/A'}`);
});

console.log('\n' + '='.repeat(60));
console.log('✅ Анализ завершен\n');
