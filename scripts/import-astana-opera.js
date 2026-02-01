#!/usr/bin/env node
/**
 * Импорт данных проекта "Астана опера" в систему
 * Создает Project, AuditChecklist и связывает с RequirementSets
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function importAstanaOpera() {
    console.log('\n🏛️  ИМПОРТ ПРОЕКТА: АСТАНА ОПЕРА\n');
    console.log('='.repeat(70) + '\n');

    try {
        // ===== STEP 1: Create Project =====
        console.log('📋 Step 1: Creating project...\n');

        const projectData = {
            id: uuidv4(),
            name: 'Астана Опера',
            address: 'г. Астана, проспект Кабанбай батыра, 44',
            customer: 'Государственный театр оперы и балета "Астана Опера"',
            description: 'Техническое обследование систем безопасности театра оперы и балета "Астана Опера"',
            status: 'PLANNING',
            startDate: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const { data: project, error: projectError } = await supabase
            .from('projects')
            .insert(projectData)
            .select()
            .single();

        if (projectError) {
            // Check if project already exists
            if (projectError.code === '23505') { // Unique violation
                console.log('   ⚠️  Project already exists, fetching...\n');
                const { data: existing } = await supabase
                    .from('projects')
                    .select('*')
                    .eq('name', 'Астана Опера')
                    .single();

                if (existing) {
                    console.log(`   ✅ Project found: ${existing.name}\n`);
                    return existing;
                }
            }
            throw projectError;
        }

        console.log(`   ✅ Project created: ${project.name}`);
        console.log(`   ID: ${project.id}\n`);

        // ===== STEP 2: Get available RequirementSets =====
        console.log('📦 Step 2: Fetching available requirement sets...\n');

        const { data: reqSets, error: setsError } = await supabase
            .from('requirement_sets')
            .select(`
                *,
                requirements:requirements(count)
            `)
            .eq('jurisdiction', 'KZ')
            .order('createdAt', { ascending: false });

        if (setsError) throw setsError;

        console.log(`   Found ${reqSets.length} requirement sets:\n`);
        reqSets.forEach((set, idx) => {
            const reqCount = set.requirements?.[0]?.count || 0;
            console.log(`   ${idx + 1}. ${set.requirementSetId} (${reqCount} requirements)`);
            console.log(`      System: ${set.systemId || 'Multiple'}, Status: ${set.status}`);
        });
        console.log('');

        // ===== STEP 3: Определяем системы для Астана опера =====
        console.log('🎭 Step 3: Selecting systems for Astana Opera...\n');

        // Театр - специфичный объект, нужны:
        // 1. Пожарная безопасность (общие требования)
        // 2. АПС (пожарная сигнализация)
        // 3. СОУЭ (оповещение и управление эвакуацией)
        // 4. АУПТ (автоматическое пожаротушение)
        // 5. Сценическая техника (специальные требования)

        const systemsNeeded = [
            'FIRE_GENERAL',
            'APS',
            'SOUE',
            'AUPT',
            'STAGE_TECH' // Если есть
        ];

        console.log('   Требуемые системы для театра:');
        systemsNeeded.forEach(sys => console.log(`   - ${sys}`));
        console.log('');

        // ===== STEP 4: Create AuditChecklists =====
        console.log('📝 Step 4: Creating audit checklists...\n');

        const checklists = [];

        for (const reqSet of reqSets) {
            // Проверяем, подходит ли этот RequirementSet для театра
            const isRelevant = reqSet.systemId && systemsNeeded.includes(reqSet.systemId)
                || reqSet.tags?.some(tag => ['пожарная', 'безопасность', 'theatre', 'theater'].includes(tag.toLowerCase()))
                || reqSet.status === 'PUBLISHED';

            if (isRelevant || reqSets.indexOf(reqSet) < 3) { // Берем первые 3 или релевантные
                const checklistData = {
                    id: uuidv4(),
                    projectId: project.id,
                    requirementSetId: reqSet.id,
                    status: 'PENDING',
                    summary: null,
                    risks: null,
                    recommendations: null,
                    auditorName: null,
                    facilityDescription: `${project.name} - ${reqSet.requirementSetId}`,
                    contractNumber: null,
                    auditorTitle: null,
                    companyLogoUrl: null,
                    startedAt: null,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                const { data: checklist, error: checklistError } = await supabase
                    .from('audit_checklists')
                    .insert(checklistData)
                    .select()
                    .single();

                if (checklistError) {
                    console.error(`   ❌ Error creating checklist for ${reqSet.requirementSetId}:`, checklistError.message);
                } else {
                    checklists.push(checklist);
                    console.log(`   ✅ Created checklist: ${reqSet.requirementSetId}`);
                }
            }
        }

        console.log(`\n   Total checklists created: ${checklists.length}\n`);

        // ===== STEP 5: Initialize AuditResults (optional) =====
        console.log('🔄 Step 5: Initializing audit results...\n');

        for (const checklist of checklists) {
            // Get requirements for this set
            const { data: requirements, error: reqError } = await supabase
                .from('requirements')
                .select('id, requirementId, systemId, clause, requirementTextShort')
                .eq('requirementSetId', checklist.requirementSetId)
                .limit(100); // Limit for initial import

            if (reqError) {
                console.error(`   ❌ Error fetching requirements:`, reqError.message);
                continue;
            }

            if (!requirements || requirements.length === 0) {
                console.log(`   ⚠️  No requirements found for checklist ${checklist.id}`);
                continue;
            }

            // Create audit results for each requirement
            const results = requirements.map(req => ({
                id: uuidv4(),
                checklistId: checklist.id,
                requirementId: req.id,
                status: 'NOT_CHECKED',
                comment: null,
                photos: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }));

            const { error: resultsError } = await supabase
                .from('audit_results')
                .insert(results);

            if (resultsError) {
                console.error(`   ❌ Error creating results:`, resultsError.message);
            } else {
                console.log(`   ✅ Initialized ${results.length} audit results`);
            }
        }

        // ===== FINAL SUMMARY =====
        console.log('\n' + '='.repeat(70));
        console.log('📊 ИТОГОВАЯ СТАТИСТИКА\n');
        console.log(`   Проект: ${project.name}`);
        console.log(`   Адрес: ${project.address}`);
        console.log(`   Чек-листов создано: ${checklists.length}`);

        // Count total audit results
        const { count: totalResults } = await supabase
            .from('audit_results')
            .select('*', { count: 'exact', head: true })
            .in('checklistId', checklists.map(c => c.id));

        console.log(`   Требований к проверке: ${totalResults || 0}`);
        console.log('\n' + '='.repeat(70));
        console.log('✅ ИМПОРТ ЗАВЕРШЕН!\n');
        console.log(`🌐 Откройте проект: http://localhost:3000/projects/${project.id}\n`);

        return project;

    } catch (error) {
        console.error('\n❌ КРИТИЧЕСКАЯ ОШИБКА:', error.message);
        console.error(error.stack);
        throw error;
    }
}

// Run import
importAstanaOpera();
