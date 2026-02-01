#!/usr/bin/env node
/**
 * Упрощенный импорт дефектов в существующий проект
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

const PROJECT_ID = 'd217668c-f97c-422e-bcbe-afb0c5403eea';

async function importDefects() {
    console.log('\n🏛️  ИМПОРТ ДЕФЕКТОВ АПС - АСТАНА ОПЕРА\n');
    console.log('='.repeat(70) + '\n');

    try {
        // Step 1: Read defects
        console.log('📂 Step 1: Reading defects file...');
        const defectsJson = await fs.readFile('aps-defects-manual.json', 'utf-8');
        const defects = JSON.parse(defectsJson);
        console.log(`   ✅ Loaded ${defects.length} defects\n`);

        // Step 2: Verify project exists
        console.log('📋 Step 2: Verifying project...');
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('*')
            .eq('id', PROJECT_ID)
            .single();

        if (projectError || !project) {
            throw new Error(`Project not found: ${PROJECT_ID}`);
        }
        console.log(`   ✅ Project found: ${project.name}\n`);

        // Step 3: Create or get audit
        console.log('📝 Step 3: Creating audit...');

        let audit;
        const { data: existingAudit } = await supabase
            .from('audits')
            .select('*')
            .eq('projectId', PROJECT_ID)
            .limit(1)
            .single();

        if (existingAudit) {
            audit = existingAudit;
            console.log(`   ✅ Using existing audit\n`);
        } else {
            const { data: newAudit, error: auditError } = await supabase
                .from('audits')
                .insert({
                    id: uuidv4(),
                    auditId: 'AUDIT-ASTANA-OPERA-2025',
                    projectId: PROJECT_ID,
                    shortName: 'Астана Опера - Техаудит',
                    status: 'IN_PROGRESS',
                    startDate: new Date().toISOString(),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                })
                .select()
                .single();

            if (auditError) throw auditError;
            audit = newAudit;
            console.log(`   ✅ Created audit: ${audit.auditId}\n`);
        }

        // Step 4: Import defects directly
        console.log('💾 Step 4: Importing defects...\n');

        const defectsToInsert = defects.map((defect, idx) => ({
            id: uuidv4(),
            defectId: `APS-D-${String(idx + 1).padStart(4, '0')}`,
            auditId: audit.id,
            systemId: defect.system,
            locationId: null,
            defectFact: defect.defect_fact,
            noncomplianceStatement: defect.noncomplianceStatement !== 'не указано'
                ? defect.noncomplianceStatement
                : null,
            recommendation: defect.recommendation,
            impact: defect.impact,
            likelihood: defect.likelihood,
            defectStatus: 'IN_REVIEW',
            actionStatus: 'NOT_STARTED',
            photoIds: [],
            protocolIds: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }));

        const { data: insertedDefects, error: insertError } = await supabase
            .from('defects')
            .insert(defectsToInsert)
            .select();

        if (insertError) {
            console.error('❌ Error inserting defects:', insertError);
            throw insertError;
        }

        console.log(`   ✅ Successfully imported ${insertedDefects.length} defects\n`);

        // Statistics
        const bySeverity = {};
        defects.forEach(d => {
            bySeverity[d.severity] = (bySeverity[d.severity] || 0) + 1;
        });

        console.log('='.repeat(70));
        console.log('📊 ИТОГОВАЯ СТАТИСТИКА\n');
        console.log(`   Проект: ${project.name}`);
        console.log(`   Импортировано дефектов: ${insertedDefects.length}`);

        console.log('\n   По критичности:');
        Object.entries(bySeverity).forEach(([sev, count]) => {
            console.log(`      ${sev.padEnd(12)}: ${count}`);
        });

        const avgRisk = defects.reduce((sum, d) => sum + (d.impact * d.likelihood), 0) / defects.length;
        console.log(`\n   Средний риск-скор: ${avgRisk.toFixed(1)}/16`);

        console.log('\n' + '='.repeat(70));
        console.log('✅ ИМПОРТ ЗАВЕРШЕН!\n');
        console.log(`🌐 Откройте проект: http://localhost:3000/projects/${PROJECT_ID}\n`);

    } catch (error) {
        console.error('\n❌ КРИТИЧЕСКАЯ ОШИБКА:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

importDefects();
