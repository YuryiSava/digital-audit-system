#!/usr/bin/env node
/**
 * External PDF Parser using GPT API
 * Usage: node scripts/parse-pdf-with-gpt.js <norm-id> [target-system-id]
 * 
 * This script:
 * 1. Fetches PDF file from database
 * 2. Extracts text using pdf-parse
 * 3. Sends to GPT-4o-mini API for parsing
 * 4. Saves structured requirements to database
 */

require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Import our robust PDF helper
const { extractPdfText } = require('../lib/pdf-helper-combo');

// Initialize clients
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/**
 * Extract ONLY Russian text from bilingual documents
 * Strategy: Bilingual docs usually have structure [Kazakh part] [Russian part]
 * We find where Russian starts and cut everything before it
 */
function extractRussianText(fullText) {
    // Markers that indicate start of Russian section
    const russianMarkers = [
        'ПОЖАРНАЯ БЕЗОПАСНОСТЬ',
        'ПОЖАРНАЯ АВТОМАТИКА',
        'ПРОТИВОПОЖАРНАЯ ЗАЩИТА',
        'ОБЩИЕ ПОЛОЖЕНИЯ',
        'ОБЛАСТЬ ПРИМЕНЕНИЯ',
        'НОРМАТИВНЫЕ ССЫЛКИ',
        '1 Область применения',
        '2 Нормативные',
        'ВВЕДЕНИЕ'
    ];

    let bestSplitIndex = -1;
    let bestMarker = null;

    // Try to find any of the markers
    for (const marker of russianMarkers) {
        const index = fullText.indexOf(marker);
        if (index > 0 && (bestSplitIndex === -1 || index < bestSplitIndex)) {
            bestSplitIndex = index;
            bestMarker = marker;
        }
    }

    if (bestSplitIndex > 0) {
        console.log(`   ✅ Found Russian marker: "${bestMarker}" at position ${bestSplitIndex}`);
        // Take from the marker onwards
        return fullText.substring(bestSplitIndex);
    }

    // Fallback: If no marker found, try to detect by language ratio
    // Split in half and check which half has more Cyrillic
    const midPoint = Math.floor(fullText.length / 2);
    const firstHalf = fullText.substring(0, midPoint);
    const secondHalf = fullText.substring(midPoint);

    const cyrillicPattern = /[а-яА-ЯёЁ]/g;
    const latinPattern = /[a-zA-Z]/g;

    const firstCyrillic = (firstHalf.match(cyrillicPattern) || []).length;
    const secondCyrillic = (secondHalf.match(cyrillicPattern) || []).length;

    // Kazakh uses more Latin characters, Russian uses pure Cyrillic
    // So second half (Russian) should have MORE Cyrillic
    if (secondCyrillic > firstCyrillic * 1.2) {
        console.log(`   ℹ️  No marker found, using language detection split`);
        console.log(`   First half Cyrillic: ${firstCyrillic}, Second half: ${secondCyrillic}`);
        return secondHalf;
    }

    // If all fails, return as is (maybe it's Russian-only document)
    console.log(`   ⚠️  Could not determine bilingual structure, keeping full text`);
    return fullText;
}

// ===== MAIN FUNCTION =====
// Parse command line arguments
const normId = process.argv[2];
const targetSystemId = process.argv[3] || null;

if (!normId) {
    console.error('❌ Usage: node scripts/parse-pdf-with-gpt.js <norm-id> [target-system-id]');
    process.exit(1);
}

console.log('\n🚀 External PDF Parser with GPT');
console.log('================================\n');
console.log(`📋 Norm ID: ${normId}`);
if (targetSystemId) {
    console.log(`🎯 Target System: ${targetSystemId}`);
}
console.log('');

async function parsePdfWithGpt() {
    try {
        // Step 1: Fetch norm details
        console.log('📖 Step 1: Fetching norm details...');
        const { data: norm, error: normError } = await supabase
            .from('norm_sources')
            .select('*')
            .eq('id', normId)
            .single();

        if (normError || !norm) {
            throw new Error('Norm not found');
        }

        console.log(`   ✅ Found: ${norm.code} - ${norm.title}\n`);

        // Step 2: Fetch PDF files
        console.log('📁 Step 2: Fetching PDF files...');
        const { data: files, error: filesError } = await supabase
            .from('norm_files')
            .select('*')
            .eq('normSourceId', normId)
            .order('uploadedAt', { ascending: false });

        if (filesError || !files || files.length === 0) {
            throw new Error('No PDF files attached to this norm');
        }

        // Filter out ghost files
        const validFiles = files.filter(f =>
            !f.storageUrl.includes('test/data') &&
            !f.storageUrl.includes('test\\data')
        );

        if (validFiles.length === 0) {
            throw new Error('No valid PDF files found');
        }

        console.log(`   ✅ Found ${validFiles.length} valid file(s)\n`);

        // Step 3: Extract text from PDF
        console.log('📄 Step 3: Extracting text from PDF...');
        let text = '';
        let fileUsed = null;

        for (const fileRecord of validFiles) {
            const relativePath = fileRecord.storageUrl;
            const cleanPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
            let absolutePath = path.join(process.cwd(), 'public', cleanPath);

            // Try to access file
            try {
                await fs.access(absolutePath);
            } catch {
                // Fallback to uploads folder
                const fileName = path.basename(relativePath);
                absolutePath = path.join(process.cwd(), 'public', 'uploads', 'norms', fileName);
                try {
                    await fs.access(absolutePath);
                } catch {
                    console.log(`   ⚠️  Skipping ${fileRecord.fileName} - file not found`);
                    continue;
                }
            }

            console.log(`   📖 Reading: ${fileRecord.fileName}`);

            try {
                const dataBuffer = await fs.readFile(absolutePath);
                const stats = await fs.stat(absolutePath);
                console.log(`   📊 Size: ${(stats.size / 1024).toFixed(2)} KB`);

                text = await extractPdfText(dataBuffer);
                console.log(`   ✅ Extracted ${text.length} characters\n`);

                if (text && text.length >= 50) {
                    fileUsed = fileRecord;
                    break;
                }
            } catch (err) {
                console.error(`   ❌ Error extracting from ${fileRecord.fileName}:`, err.message);
            }
        }

        if (!text || text.length < 50) {
            throw new Error('Could not extract meaningful text from PDF');
        }

        // Step 3.5: Extract ONLY Russian text from bilingual documents
        console.log('🇷🇺 Step 3.5: Extracting Russian text only...');
        const originalLength = text.length;
        text = extractRussianText(text);
        console.log(`   ✂️  Removed Kazakh part: ${originalLength} → ${text.length} chars (${((1 - text.length / originalLength) * 100).toFixed(1)}% reduction)`);
        console.log(`   💰 Token savings: ~${Math.floor((originalLength - text.length) / 4)} tokens\n`);

        // Step 4: Send to GPT API
        console.log('🤖 Step 4: Sending to GPT-4o-mini for parsing...');
        console.log(`   📝 Sending ${text.length} characters to AI\n`);

        const systemPrompt = `Ты - эксперт по анализу нормативных документов в области пожарной безопасности и инженерных систем.

Твоя задача: извлечь структурированные требования из нормативного документа.

**ВАЖНО**: 
- Если документ на двух языках (казахский и русский), **ПРИОРИТЕТ на РУССКИЙ текст**
- Обычно структура: сначала казахский, потом русский
- Извлекай требования ТОЛЬКО из русской части документа

Верни JSON массив требований в формате:
[
  {
    "clause": "пункт документа (например, 5.2.1)",
    "system": "ОСНОВНАЯ система (одна)",
    "requirementTextShort": "краткая формулировка требования (1-2 предложения)",
    "requirementTextFull": "полный текст требования",
    "checkMethod": "метод проверки (visual/document/test/measurement/log)",
    "mustCheck": true/false,
    "tags": ["все_связанные_системы", "ключевые_слова"]
  }
]

**ПОЛНЫЙ КЛАССИФИКАТОР СН/СП РК:**

**Противопожарные системы:**
- FIRE_GENERAL: Общие требования пожарной безопасности (для общих требований ко всем системам)
- APS: Система автоматической пожарной сигнализации (АПС)
- SOUE: Система оповещения и управления эвакуацией людей при пожаре (СОУЭ)
- AUPT: Автоматические установки пожаротушения (АУПТ) - включает водяные, пенные, газовые, порошковые, аэрозольные
- SMOKE_CONTROL: Система противодымной защиты зданий и сооружений
- FIRE_WATER_INT: Внутренний противопожарный водопровод (ВПВ)
- FIRE_WATER_EXT: Наружное противопожарное водоснабжение
- FIRE_POWER: Электроснабжение систем противопожарной защиты
- FIRE_CABLES: Кабельные линии и огнестойкие трассы систем ПБ
- FIRE_BARRIERS: Противопожарные преграды (стены, перегородки, перекрытия, двери, ворота, люки)
- FIRE_PRIMARY: Первичные средства пожаротушения (огнетушители, щиты, инвентарь)
- FIRE_CONTROL: Автоматическое управление системами противопожарной защиты
- FIRE_MONITORING: Система передачи извещений о пожаре и диспетчеризации

**Другие И.С.:**
- CCTV: Видеонаблюдение
- ACS: Контроль доступа
- OS: Охранная сигнализация
- SCS: Структурированная кабельная система

**КАК ОПРЕДЕЛЯТЬ СИСТЕМУ:**
1. system - выбери ОДНУ основную систему, к которой относится требование
2. tags - добавь ВСЕ системы которых касается требование + ключевые слова

**Пример 1** (требование касается нескольких систем):
{
  "clause": "5.2.1",
  "system": "APS",
  "requirementTextShort": "Пожарные извещатели должны быть обеспечены резервным питанием",
  "tags": ["АПС", "FIRE_POWER", "электропитание", "резерв"]
}

**Пример 2** (общее требование):
{
  "clause": "4.1",
  "system": "FIRE_GENERAL",
  "requirementTextShort": "Системы противопожарной защиты должны соответствовать проекту",
  "tags": ["общие_требования", "APS", "SOUE", "FIRE_EXTINGUISH", "проектирование"]
}

Методы проверки:
- visual: Визуальный осмотр
- document: Проверка документации
- test: Функциональное тестирование
- measurement: Измерения
- log: Анализ журналов

Извлекай только значимые проверяемые требования. Игнорируй определения, преамбулы, титульные листы.`;

        const userPrompt = `Нормативный документ: "${norm.code} - ${norm.title}"
${targetSystemId ? `\nЦелевая система: ${targetSystemId} (извлекай требования только для этой системы)\n` : ''}

Текст документа:
${text.substring(0, 100000)}

Верни JSON массив требований.`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3
        });

        const responseText = completion.choices[0].message.content;
        console.log('   ✅ Received response from GPT\n');

        // Step 5: Parse JSON response
        console.log('🔍 Step 5: Parsing AI response...');

        let parsedData;
        try {
            parsedData = JSON.parse(responseText);
        } catch (err) {
            console.error('   ❌ Failed to parse JSON:', err.message);
            console.error('   Response:', responseText.substring(0, 500));
            throw new Error('Invalid JSON response from GPT');
        }

        // Handle different response formats
        let requirements = [];
        if (Array.isArray(parsedData)) {
            requirements = parsedData;
        } else if (parsedData.requirements && Array.isArray(parsedData.requirements)) {
            requirements = parsedData.requirements;
        } else if (parsedData.items && Array.isArray(parsedData.items)) {
            requirements = parsedData.items;
        } else {
            console.error('   ❌ Unexpected response format:', Object.keys(parsedData));
            throw new Error('Could not find requirements array in response');
        }

        console.log(`   ✅ Extracted ${requirements.length} requirements\n`);

        if (requirements.length === 0) {
            throw new Error('No requirements extracted');
        }

        // Step 6: Save to database
        console.log('💾 Step 6: Saving to database...');

        // Step 6a: Find requirement set (use existing)
        console.log('   🔍 Finding requirement set...');

        // Try to find existing set for this jurisdiction
        let { data: existingSets } = await supabase
            .from('requirement_sets')
            .select('id, requirementSetId')
            .eq('jurisdiction', norm.jurisdiction || 'KZ')
            .limit(1);

        let requirementSetId;

        if (existingSets && existingSets.length > 0) {
            requirementSetId = existingSets[0].id;
            console.log(`   ✅ Using requirement set: ${existingSets[0].requirementSetId}`);
        } else {
            // Use any available set as fallback
            const { data: fallbackSet } = await supabase
                .from('requirement_sets')
                .select('id, requirementSetId')
                .limit(1)
                .single();

            if (fallbackSet) {
                requirementSetId = fallbackSet.id;
                console.log(`   ✅ Using fallback set: ${fallbackSet.requirementSetId}`);
            } else {
                throw new Error('No requirement sets in database');
            }
        }

        // Step 6b: Check for existing requirements (protection against accidental overwrites)
        console.log('   🔍 Checking for existing requirements...');
        const { data: existingReqs, error: checkError } = await supabase
            .from('requirements')
            .select('id, createdBy')
            .eq('normSourceId', normId);

        if (existingReqs && existingReqs.length > 0) {
            const manualCount = existingReqs.filter(r => r.createdBy === 'manual').length;
            console.log(`   ⚠️  WARNING: Found ${existingReqs.length} existing requirements`);
            if (manualCount > 0) {
                console.log(`   ⚠️  WARNING: ${manualCount} were added manually!`);
            }
            console.log(`   🗑️  Deleting old requirements...`);
        }

        // Delete old requirements for this norm
        const { error: deleteError } = await supabase
            .from('requirements')
            .delete()
            .eq('normSourceId', normId);

        if (deleteError) {
            console.warn('   ⚠️  Warning: Could not delete old requirements:', deleteError.message);
        }

        // Step 6c: Prepare requirements for insertion
        const now = new Date().toISOString();

        // Valid system IDs (must match database)
        const validSystems = ['APS', 'SOUE', 'CCTV', 'ACS', 'OS', 'SCS'];

        // Helper to normalize system ID
        const normalizeSystemId = (system) => {
            if (!system) return 'APS';
            const upper = system.toUpperCase();
            return validSystems.includes(upper) ? upper : 'APS'; // Default to APS if invalid
        };

        const requirementsToInsert = requirements.map((req, index) => ({
            id: uuidv4(), // Generate UUID for primary key
            requirementId: `REQ-${norm.code.replace(/[^A-Z0-9]/gi, '-')}-${String(index + 1).padStart(4, '0')}`,
            requirementSetId: requirementSetId,
            systemId: normalizeSystemId(req.system || targetSystemId),
            normSourceId: normId,
            clause: req.clause || `Section-${index + 1}`,
            requirementTextShort: req.requirementTextShort || req.requirementTextFull?.substring(0, 200) || 'No description',
            requirementTextFull: req.requirementTextFull || req.requirementTextShort || '',
            checkMethod: req.checkMethod || 'visual',
            evidenceTypeExpected: req.evidenceTypeExpected || ['photo'],
            mustCheck: req.mustCheck || false,
            tags: req.tags || [],
            createdBy: 'external-parser',
            createdAt: now,
            updatedAt: now
        }));

        // Insert requirements
        const { data: inserted, error: insertError } = await supabase
            .from('requirements')
            .insert(requirementsToInsert)
            .select();

        if (insertError) {
            console.error('   ❌ Error inserting requirements:', insertError);
            throw insertError;
        }

        console.log(`   ✅ Saved ${inserted.length} requirements to database\n`);

        // Summary
        console.log('═══════════════════════════════════════');
        console.log('✅ PARSING COMPLETED SUCCESSFULLY!');
        console.log('═══════════════════════════════════════');
        console.log(`📄 File: ${fileUsed.fileName}`);
        console.log(`📊 Text extracted: ${text.length} characters`);
        console.log(`🎯 Requirements extracted: ${requirements.length}`);
        console.log(`💾 Requirements saved: ${inserted.length}`);
        console.log('═══════════════════════════════════════\n');

        // Show sample requirements
        console.log('📋 Sample requirements:\n');
        inserted.slice(0, 3).forEach((req, idx) => {
            console.log(`${idx + 1}. [${req.clause}] ${req.requirementTextShort}`);
            console.log(`   System: ${req.systemId} | Method: ${req.checkMethod}\n`);
        });

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error('\nStack:', error.stack);
        process.exit(1);
    }
}

// Run the parser
parsePdfWithGpt();
