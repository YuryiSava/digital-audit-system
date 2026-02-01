#!/usr/bin/env node
/**
 * Сохранение RawNormFragments в БД как Requirements
 * Создает RequirementSet и связывает Requirements с NormSource
 */

require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function saveRawFragmentsToDB(fragmentsFile, normId) {
    console.log('\n💾 СОХРАНЕНИЕ RAW FRAGMENTS В БД\n');
    console.log('='.repeat(60) + '\n');

    try {
        // Step 1: Load fragments
        console.log('📂 Step 1: Loading fragments...');
        const filePath = path.join(process.cwd(), fragmentsFile);
        const rawData = await fs.readFile(filePath, 'utf-8');
        const fragments = JSON.parse(rawData);
        console.log(`   ✅ Loaded ${fragments.length} fragments\n`);

        // Step 2: Get norm info
        console.log('📋 Step 2: Fetching norm info...');
        const { data: norm, error: normError } = await supabase
            .from('norm_sources')
            .select('*')
            .eq('id', normId)
            .single();

        if (normError || !norm) {
            throw new Error('Norm not found: ' + normError?.message);
        }
        console.log(`   ✅ Norm: ${norm.code} - ${norm.title}\n`);

        // Step 3: Create or get RequirementSet
        console.log('📦 Step 3: Creating Requirement Set...');

        const reqSetId = `RS-${norm.code.replace(/\s+/g, '-')}-v2`;

        let { data: existingSet } = await supabase
            .from('requirement_sets')
            .select('*')
            .eq('requirementSetId', reqSetId)
            .single();

        let requirementSet;

        if (existingSet) {
            console.log(`   ✅ Using existing requirement set: ${reqSetId}\n`);
            requirementSet = existingSet;
        } else {
            const { data: newSet, error: setError } = await supabase
                .from('requirement_sets')
                .insert({
                    id: uuidv4(),
                    requirementSetId: reqSetId,
                    systemId: null,
                    jurisdiction: norm.jurisdiction || 'KZ',
                    version: '2.0',
                    status: 'DRAFT',
                    ownerId: null,
                    notes: `AI-парсер v2 - ${new Date().toISOString()}`,
                    tags: ['ai-parser-v2'],
                    createdAt: new Date().toISOString(),
                    createdBy: 'ai-parser-v2',
                    publishedAt: null,
                    publishedBy: null,
                    updatedAt: new Date().toISOString()
                })
                .select()
                .single();

            if (setError) {
                throw new Error(`Failed to create requirement set: ${setError.message}`);
            }

            requirementSet = newSet;
            console.log(`   ✅ Created new requirement set: ${reqSetId}\n`);
        }

        // Step 4: Map fragments to Requirements
        console.log('🔄 Step 4: Converting fragments to requirements...\n');

        const requirements = fragments.map((fragment, index) => {
            // Simple system mapping from fragment type
            let systemId = 'FIRE_GENERAL';

            const text = (fragment.raw_text || '').toLowerCase();
            if (text.includes('сигнализ') || text.includes('извещател')) {
                systemId = 'APS';
            } else if (text.includes('оповещ') || text.includes('эвакуац')) {
                systemId = 'SOUE';
            } else if (text.includes('пожаротушен') || text.includes('огнетушащ')) {
                systemId = 'AUPT';
            }

            // Create requirement ID
            const requirementId = `REQ-${norm.code.replace(/\s+/g, '-')}-${String(index + 1).padStart(4, '0')}`;

            return {
                id: uuidv4(),
                requirementId: requirementId,
                requirementSetId: requirementSet.id,
                systemId: systemId,
                normSourceId: norm.id,
                clause: fragment.source_clause || '',
                requirementTextShort: fragment.raw_text.substring(0, 200), // First 200 chars
                requirementTextFull: fragment.raw_text,
                checkMethod: 'visual', // Default
                evidenceTypeExpected: [],
                mustCheck: fragment.predicted_requirement_type !== 'base',
                tags: [
                    fragment.predicted_requirement_type,
                    fragment.detected_modality || 'unknown',
                    ...(fragment.detected_conditions || [])
                ].filter(Boolean),
                applicabilityRules: null,
                severityHint: null,
                createdAt: new Date().toISOString(),
                createdBy: 'ai-parser-v2',
                updatedAt: new Date().toISOString()
            };
        });

        console.log(`   ✅ Converted ${requirements.length} fragments to requirements\n`);

        // Step 5: Save to database
        console.log('💾 Step 5: Saving to database...\n');

        // Delete existing AI-generated requirements for this norm
        const { error: deleteError } = await supabase
            .from('requirements')
            .delete()
            .eq('normSourceId', norm.id)
            .eq('createdBy', 'ai-parser-v2');

        if (deleteError) {
            console.log(`   ⚠️  Could not delete old requirements: ${deleteError.message}`);
        } else {
            console.log('   ✅ Cleaned up old AI-generated requirements\n');
        }

        // Insert new requirements in batches
        const batchSize = 50;
        let inserted = 0;

        for (let i = 0; i < requirements.length; i += batchSize) {
            const batch = requirements.slice(i, i + batchSize);

            const { data, error } = await supabase
                .from('requirements')
                .insert(batch);

            if (error) {
                console.error(`   ❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.message);
                console.error('   Details:', JSON.stringify(error, null, 2));
            } else {
                inserted += batch.length;
                console.log(`   ✅ Inserted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} requirements`);
            }
        }

        console.log(`\n✅ Total inserted: ${inserted}/${requirements.length} requirements\n`);

        // Step 6: Verify
        console.log('🔍 Step 6: Verifying...\n');
        const { count } = await supabase
            .from('requirements')
            .select('*', { count: 'exact', head: true })
            .eq('normSourceId', norm.id);

        console.log(`   📊 Total requirements in DB for this norm: ${count}\n`);

        // Step 7: Statistics
        console.log('='.repeat(60));
        console.log('📊 СТАТИСТИКА\n');

        const systemStats = {};
        requirements.forEach(req => {
            systemStats[req.systemId] = (systemStats[req.systemId] || 0) + 1;
        });

        console.log('По системам:');
        Object.entries(systemStats)
            .sort((a, b) => b[1] - a[1])
            .forEach(([sys, count]) => {
                console.log(`   ${sys.padEnd(20)} : ${count}`);
            });

        console.log('\n' + '='.repeat(60));
        console.log('✅ СОХРАНЕНИЕ ЗАВЕРШЕНО!\n');
        console.log(`🌐 Проверьте в интерфейсе: http://localhost:3000/norm-library/${norm.id}\n`);

    } catch (error) {
        console.error('\n❌ ОШИБКА:', error.message);
        console.error(error.stack);
        throw error;
    }
}

// CLI
const fragmentsFile = process.argv[2];
const normId = process.argv[3];

if (!fragmentsFile || !normId) {
    console.error('\n❌ Использование: node save-raw-to-db.js <fragments-file.json> <norm-id>\n');
    console.error('Пример: node save-raw-to-db.js raw-fragments-123.json 452c6587-bd11-4058-b2e7-9476b037e1dd\n');
    process.exit(1);
}

saveRawFragmentsToDB(fragmentsFile, normId);
