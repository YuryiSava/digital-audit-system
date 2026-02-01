#!/usr/bin/env node
/**
 * Автоматическая миграция дефектов АПС в правильную модель
 * Audit.defects → Project.AuditChecklist.AuditResults
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const PROJECT_ID = 'd217668c-f97c-422e-bcbe-afb0c5403eea';
const AUDIT_ID_STR = 'AUDIT-ASTANA-OPERA-2025';

async function migrateDefects() {
    console.log('\n🔄 МИГРАЦИЯ ДЕФЕКТОВ АПС В ПРОЕКТ\n');
    console.log('='.repeat(70) + '\n');

    try {
        // Step 1: Получить все дефекты из Audit
        console.log('📂 Step 1: Reading defects from Audit...');

        const { data: audit } = await supabase
            .from('audits')
            .select('id')
            .eq('auditId', AUDIT_ID_STR)
            .single();

        if (!audit) throw new Error('Audit not found');

        const { data: defects } = await supabase
            .from('defects')
            .select('*')
            .eq('auditId', audit.id)
            .order('defectId');

        console.log(`   ✅ Found ${defects.length} defects\n`);

        // Step 2: Создать RequirementSet
        console.log('📦 Step 2: Creating RequirementSet...');

        let requirementSet;
        const { data: existingRS } = await supabase
            .from('requirement_sets')
            .select('*')
            .eq('requirementSetId', 'RS-APS-ASTANA-OPERA')
            .single();

        if (existingRS) {
            requirementSet = existingRS;
            console.log('   ✅ Using existing RequirementSet\n');
        } else {
            const { data: newRS, error: rsError } = await supabase
                .from('requirement_sets')
                .insert({
                    id: uuidv4(),
                    requirementSetId: 'RS-APS-ASTANA-OPERA',
                    systemId: 'APS',
                    jurisdiction: 'KZ',
                    version: '1.0',
                    status: 'ACTIVE',
                    notes: 'Требования АПС из дефектов Астана Опера',
                    tags: ['aps', 'defects', 'astana-opera'],
                    createdAt: new Date().toISOString(),
                    createdBy: 'migration-script',
                    updatedAt: new Date().toISOString()
                })
                .select()
                .single();

            if (rsError) throw rsError;
            requirementSet = newRS;
            console.log('   ✅ Created RequirementSet\n');
        }

        // Step 3: Создать AuditChecklist
        console.log('📝 Step 3: Creating AuditChecklist...');

        let checklist;
        const { data: existingCL } = await supabase
            .from('audit_checklists')
            .select('*')
            .eq('projectId', PROJECT_ID)
            .eq('requirementSetId', requirementSet.id)
            .single();

        if (existingCL) {
            checklist = existingCL;
            console.log('   ✅ Using existing AuditChecklist\n');
        } else {
            const { data: newCL, error: clError } = await supabase
                .from('audit_checklists')
                .insert({
                    id: uuidv4(),
                    projectId: PROJECT_ID,
                    requirementSetId: requirementSet.id,
                    status: 'IN_PROGRESS',
                    summary: `Техническое обследование АПС - ${defects.length} дефектов`,
                    facilityDescription: 'Автоматическая пожарная сигнализация театра Астана Опера',
                    startedAt: new Date().toISOString(),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                })
                .select()
                .single();

            if (clError) throw clError;
            checklist = newCL;
            console.log('   ✅ Created AuditChecklist\n');
        }

        // Step 4: Получить или создать NormSource
        console.log('📚 Step 4: Getting NormSource...');

        let normSource;
        const { data: existingNorm } = await supabase
            .from('norm_sources')
            .select('*')
            .limit(1)
            .single();

        if (existingNorm) {
            normSource = existingNorm;
            console.log(`   ✅ Using NormSource: ${normSource.normId}\n`);
        } else {
            const { data: newNorm } = await supabase
                .from('norm_sources')
                .insert({
                    id: uuidv4(),
                    normId: 'PPB-RK-DEFECTS',
                    normTitle: 'Дефекты из технического аудита',
                    documentType: 'audit',
                    jurisdiction: 'KZ',
                    year: 2025,
                    tags: ['defects'],
                    status: 'active',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                })
                .select()
                .single();

            normSource = newNorm;
            console.log('   ✅ Created NormSource\n');
        }

        // Step 5: Мигрировать каждый дефект
        console.log('💾 Step 5: Migrating defects...\n');

        let migrated = 0;
        let skipped = 0;

        for (const defect of defects) {
            try {
                // Создать Requirement
                const reqId = `REQ-${defect.defectId}`;

                const { data: requirement, error: reqError } = await supabase
                    .from('requirements')
                    .insert({
                        id: uuidv4(),
                        requirementId: reqId,
                        requirementSetId: requirementSet.id,
                        systemId: 'APS',
                        normSourceId: normSource.id,
                        clause: defect.defectId,
                        requirementTextShort: defect.defectFact.substring(0, 200),
                        requirementTextFull: defect.defectFact,
                        checkMethod: 'visual',
                        evidenceTypeExpected: ['photo'],
                        mustCheck: defect.impact >= 3,
                        tags: [`impact-${defect.impact}`, `likelihood-${defect.likelihood}`],
                        createdAt: new Date().toISOString(),
                        createdBy: 'migration-script',
                        updatedAt: new Date().toISOString()
                    })
                    .select()
                    .single();

                if (reqError) {
                    console.error(`   ❌ Error creating requirement for ${defect.defectId}:`, reqError.message);
                    skipped++;
                    continue;
                }

                // Создать AuditResult (FAIL)
                const { error: resultError } = await supabase
                    .from('audit_results')
                    .insert({
                        id: uuidv4(),
                        checklistId: checklist.id,
                        requirementId: requirement.id,
                        status: 'FAIL',
                        comment: `${defect.recommendation || 'Требуется устранение'}\n\nВлияние: ${defect.impact}/4, Вероятность: ${defect.likelihood}/4${defect.noncomplianceStatement ? `\nНарушение: ${defect.noncomplianceStatement}` : ''}`,
                        photos: [],
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    });

                if (resultError) {
                    console.error(`   ❌ Error creating result for ${defect.defectId}:`, resultError.message);
                    skipped++;
                } else {
                    console.log(`   ✅ Migrated: ${defect.defectId} - ${defect.defectFact.substring(0, 50)}...`);
                    migrated++;
                }

            } catch (err) {
                console.error(`   ❌ Error processing ${defect.defectId}:`, err.message);
                skipped++;
            }
        }

        console.log('\n' + '='.repeat(70));
        console.log('📊 МИГРАЦИЯ ЗАВЕРШЕНА\n');
        console.log(`   Мигрировано: ${migrated}`);
        console.log(`   Пропущено: ${skipped}`);
        console.log(`\n🌐 Откройте проект: http://localhost:3000/projects/${PROJECT_ID}\n`);
        console.log('='.repeat(70) + '\n');

    } catch (error) {
        console.error('\n❌ КРИТИЧЕСКАЯ ОШИБКА:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

migrateDefects();
