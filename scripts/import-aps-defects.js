#!/usr/bin/env node
/**
 * Импорт дефектов АПС Астана опера в базу данных
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function importAstanaOperaDefects() {
    console.log('\n🏛️  ИМПОРТ ДЕФЕКТОВ АПС - АСТАНА ОПЕРА\n');
    console.log('='.repeat(70) + '\n');

    try {
        // Step 1: Read defects JSON
        console.log('📂 Step 1: Reading defects file...');
        const defectsJson = await fs.readFile('aps-defects-manual.json', 'utf-8');
        const defects = JSON.parse(defectsJson);
        console.log(`   ✅ Loaded ${defects.length} defects\n`);

        // Step 2: Create or get project
        console.log('📋 Step 2: Creating project...');

        let project;
        const { data: existingProject } = await supabase
            .from('projects')
            .select('*')
            .eq('name', 'Астана Опера')
            .single();

        if (existingProject) {
            console.log(`   ✅ Using existing project: ${existingProject.name}\n`);
            project = existingProject;
        } else {
            const { data: newProject, error: projectError } = await supabase
                .from('projects')
                .insert({
                    id: uuidv4(),
                    name: 'Астана Опера',
                    address: 'г. Астана, улица Динмухамед Конаев 1',
                    customer: 'Государственный театр оперы и балета "Астана Опера"',
                    description: 'Техническое обследование инженерных систем',
                    status: 'IN_PROGRESS',
                    startDate: new Date().toISOString(),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                })
                .select()
                .single();

            if (projectError) throw projectError;
            project = newProject;
            console.log(`   ✅ Created project: ${project.name}\n`);
        }

        // Step 3: Get or create norm source
        console.log('📚 Step 3: Getting norm source...');

        let normSource;
        const { data: existingNorm } = await supabase
            .from('norm_sources')
            .select('*')
            .eq('normId', 'PPB-RK-55-2022')
            .single();

        if (existingNorm) {
            normSource = existingNorm;
            console.log(`   ✅ Using existing norm: ${normSource.normId}\n`);
        } else {
            // Create a norm source
            const { data: newNorm, error: normError } = await supabase
                .from('norm_sources')
                .insert({
                    id: uuidv4(),
                    normId: 'PPB-RK-55-2022',
                    normTitle: 'Правила пожарной безопасности РК (Приказ МЧС №55)',
                    documentType: 'norm',
                    jurisdiction: 'KZ',
                    year: 2022,
                    tags: ['fire-safety', 'ppb'],
                    status: 'active',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                })
                .select()
                .single();

            if (normError) throw normError;
            normSource = newNorm;
            console.log(`   ✅ Created norm source: ${normSource.normId}\n`);
        }

        // Step 4: Get or create requirement set for APS
        console.log('📦 Step 4: Getting requirement set for APS...');

        const { data: reqSets } = await supabase
            .from('requirement_sets')
            .select('*')
            .eq('systemId', 'APS')
            .eq('jurisdiction', 'KZ')
            .limit(1);

        let requirementSet;
        if (reqSets && reqSets.length > 0) {
            requirementSet = reqSets[0];
            console.log(`   ✅ Using requirement set: ${requirementSet.requirementSetId}\n`);
        } else {
            // Create a basic requirement set
            const { data: newSet, error: setError } = await supabase
                .from('requirement_sets')
                .insert({
                    id: uuidv4(),
                    requirementSetId: 'RS-APS-KZ-BASIC',
                    systemId: 'APS',
                    jurisdiction: 'KZ',
                    version: '1.0',
                    status: 'DRAFT',
                    notes: 'Базовый набор требований АПС для Казахстана',
                    tags: ['aps', 'fire-safety'],
                    createdAt: new Date().toISOString(),
                    createdBy: 'import-script',
                    updatedAt: new Date().toISOString()
                })
                .select()
                .single();

            if (setError) throw setError;
            requirementSet = newSet;
            console.log(`   ✅ Created requirement set: ${requirementSet.requirementSetId}\n`);
        }

        // Step 4: Create audit checklist
        console.log('📝 Step 4: Creating audit checklist...');

        const { data: existingChecklist } = await supabase
            .from('audit_checklists')
            .select('*')
            .eq('projectId', project.id)
            .eq('requirementSetId', requirementSet.id)
            .single();

        let checklist;
        if (existingChecklist) {
            checklist = existingChecklist;
            console.log(`   ✅ Using existing checklist\n`);
        } else {
            const { data: newChecklist, error: checklistError } = await supabase
                .from('audit_checklists')
                .insert({
                    id: uuidv4(),
                    projectId: project.id,
                    requirementSetId: requirementSet.id,
                    status: 'IN_PROGRESS',
                    summary: 'Техническое обследование системы АПС театра Астана Опера',
                    facilityDescription: 'Астана Опера - Автоматическая пожарная сигнализация',
                    startedAt: new Date().toISOString(),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                })
                .select()
                .single();

            if (checklistError) throw checklistError;
            checklist = newChecklist;
            console.log(`   ✅ Created audit checklist\n`);
        }

        // Step 5: Import defects as "failed" audit results
        console.log('💾 Step 5: Importing defects as audit results...\n');

        let imported = 0;
        let skipped = 0;

        for (const defect of defects) {
            // Create a "virtual" requirement for tracking
            const requirementId = `REQ-APS-${defect.defect_id.padStart(3, '0')}`;

            // Check if requirement exists
            let { data: requirement } = await supabase
                .from('requirements')
                .select('*')
                .eq('requirementId', requirementId)
                .single();

            if (!requirement) {
                // Create requirement
                const { data: newReq, error: reqError } = await supabase
                    .from('requirements')
                    .insert({
                        id: uuidv4(),
                        requirementId: requirementId,
                        requirementSetId: requirementSet.id,
                        systemId: 'APS',
                        normSourceId: normSource.id,
                        clause: defect.location,
                        requirementTextShort: defect.defect_fact.substring(0, 200),
                        requirementTextFull: defect.defect_fact,
                        checkMethod: 'visual',
                        evidenceTypeExpected: [],
                        mustCheck: defect.severity === 'CRITICAL' || defect.severity === 'HIGH',
                        tags: [defect.severity.toLowerCase(), 'astana-opera'],
                        createdAt: new Date().toISOString(),
                        createdBy: 'import-defects',
                        updatedAt: new Date().toISOString()
                    })
                    .select()
                    .single();

                if (reqError) {
                    console.error(`   ❌ Error creating requirement ${requirementId}:`, reqError.message);
                    continue;
                }
                requirement = newReq;
            }

            // Create audit result (as FAIL with defect data)
            const { error: resultError } = await supabase
                .from('audit_results')
                .insert({
                    id: uuidv4(),
                    checklistId: checklist.id,
                    requirementId: requirement.id,
                    status: 'FAIL',
                    comment: `${defect.recommendation}\n\nНарушение: ${defect.noncomplianceStatement}\nВлияние: ${defect.impact}/4\nВероятность: ${defect.likelihood}/4`,
                    photos: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });

            if (resultError) {
                console.error(`   ❌ Error ${defect.defect_id}:`, resultError.message);
                skipped++;
            } else {
                console.log(`   ✅ Imported defect #${defect.defect_id}: ${defect.location}`);
                imported++;
            }
        }

        console.log('\n' + '='.repeat(70));
        console.log('📊 ИТОГОВАЯ СТАТИСТИКА\n');
        console.log(`   Проект: ${project.name}`);
        console.log(`   Чек-лист ID: ${checklist.id}`);
        console.log(`   Импортировано дефектов: ${imported}`);
        console.log(`   Пропущено: ${skipped}`);

        // Statistics by severity
        const bySeverity = {};
        defects.forEach(d => {
            bySeverity[d.severity] = (bySeverity[d.severity] || 0) + 1;
        });

        console.log('\n   По критичности:');
        Object.entries(bySeverity).forEach(([sev, count]) => {
            console.log(`      ${sev.padEnd(12)}: ${count}`);
        });

        console.log('\n' + '='.repeat(70));
        console.log('✅ ИМПОРТ ЗАВЕРШЕН!\n');
        console.log(`🌐 Откройте проект: http://localhost:3000/projects/${project.id}\n`);

    } catch (error) {
        console.error('\n❌ КРИТИЧЕСКАЯ ОШИБКА:', error.message);
        console.error(error.stack);
        throw error;
    }
}

importAstanaOperaDefects();
