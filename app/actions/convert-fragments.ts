'use server';

import { createClient } from '@/utils/supabase/server';
import OpenAI from 'openai';
import { revalidatePath } from 'next/cache';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function convertFragmentsToRequirements(normSourceId: string) {
    const supabase = createClient();
    console.log('=== CONVERT FRAGMENTS START ===');
    console.log('normSourceId:', normSourceId);

    try {
        // 0. Получить информацию о норме (для jurisdiction и других полей)
        console.log('Step 0: Fetching norm source data...');
        const { data: normSource, error: normError } = await supabase
            .from('norm_sources')
            .select('jurisdiction, code, title')
            .eq('id', normSourceId)
            .single();

        console.log('Norm source:', normSource);

        if (normError || !normSource) {
            console.error('Norm source error:', normError);
            return { success: false, error: 'Не найден документ нормы' };
        }

        // 1. Получить APPROVED фрагменты
        console.log('Step 1: Fetching APPROVED fragments...');
        const { data: approvedFragments, error: fetchError } = await supabase
            .from('raw_norm_fragments')
            .select('*')
            .eq('normSourceId', normSourceId)
            .eq('status', 'APPROVED');

        console.log('Fetch result:', { count: approvedFragments?.length, error: fetchError });

        if (fetchError) {
            console.error('Fetch error:', fetchError);
            return { success: false, error: fetchError.message };
        }

        if (!approvedFragments || approvedFragments.length === 0) {
            console.log('No approved fragments found');
            return { success: false, error: 'Нет одобренных фрагментов для конвертации' };
        }

        console.log(`Step 2: Converting ${approvedFragments.length} approved fragments to requirements...`);

        // 2. Отправить в GPT для создания Requirements
        const systemPrompt = `Ты — эксперт по анализу нормативных требований.

Твоя задача: преобразовать одобренные RAW фрагменты в структурированные Requirements.

Для каждого фрагмента создай requirement со следующими полями:
- clause: номер пункта/раздела (из source_clause)
- requirementTextShort: краткая формулировка требования (1-2 предложения)
- requirementTextFull: полный текст требования
- checkMethod: метод проверки (visual | measurement | document | calculation | test)
- tags: массив тегов (тематика, например ["пожарная безопасность", "конструкции"])
- severityHint: уровень критичности (CRITICAL | HIGH | MEDIUM | LOW)
- mustCheck: обязательно ли проверять (true для обязательных требований)

Верни ТОЛЬКО валидный JSON массив requirements.`;

        const userPrompt = `Преобразуй следующие одобренные фрагменты в структурированные требования:

${approvedFragments.map((f: any, i: number) => `
Фрагмент ${i + 1}:
Раздел: ${f.sourceSection || 'N/A'}
Пункт: ${f.sourceClause || 'N/A'}
Текст: ${f.rawText}
Модальность: ${f.detectedModality || 'N/A'}
Тип: ${f.predictedRequirementType || 'N/A'}
`).join('\n---\n')}

Верни JSON массив requirements.`;

        console.log('Step 3: Calling OpenAI API...');
        console.log('Prompt length:', systemPrompt.length + userPrompt.length);

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3
        });

        console.log('Step 4: OpenAI response received');
        console.log('Tokens used:', completion.usage?.total_tokens);

        const responseText = completion.choices[0].message.content;
        if (!responseText) {
            return { success: false, error: 'Empty response from GPT' };
        }
        const parsedData = JSON.parse(responseText);

        // Extract requirements array
        let requirements = [];
        if (Array.isArray(parsedData)) {
            requirements = parsedData;
        } else if (parsedData.requirements && Array.isArray(parsedData.requirements)) {
            requirements = parsedData.requirements;
        } else {
            return { success: false, error: 'Invalid response format from GPT' };
        }

        console.log(`GPT returned ${requirements.length} requirements`);

        // 2.5. Определить systemId автоматически по содержанию нормы
        let detectedSystemId = 'FIRE_GENERAL'; // Default fallback

        const titleLower = normSource.title.toLowerCase();
        const codeLower = normSource.code.toLowerCase();

        // Определение по ключевым словам в названии и коде
        if (titleLower.includes('пожарная автомат') || titleLower.includes('пожарна сигнал') ||
            titleLower.includes('автоматическ') || codeLower.includes('102')) {
            detectedSystemId = 'APS';
        } else if (titleLower.includes('оповещен') || titleLower.includes('соуэ') || titleLower.includes('управлен эвакуа')) {
            detectedSystemId = 'SOUE';
        } else if (titleLower.includes('видеонаблюд') || titleLower.includes('камер') || titleLower.includes('cctv')) {
            detectedSystemId = 'CCTV';
        } else if (titleLower.includes('тушен') || titleLower.includes('пожаротуш') || codeLower.includes('103')) {
            detectedSystemId = 'FIRE_SUPPRESSION';
        } else if (titleLower.includes('водоснабж') || titleLower.includes('противопожар') && titleLower.includes('водо')) {
            detectedSystemId = 'WATER_SUPPLY';
        } else if (titleLower.includes('дымоудален') || titleLower.includes('вентиляц')) {
            detectedSystemId = 'SMOKE_CONTROL';
        }

        console.log(`Auto-detected systemId: ${detectedSystemId} (based on: "${normSource.title}")`);

        // 3. Создать или получить RequirementSet для этой нормы
        const requirementSetId = `RS-${normSourceId.substring(0, 8)}`;

        // Проверить существует ли RequirementSet
        const { data: existingSet } = await supabase
            .from('requirement_sets')
            .select('id')
            .eq('requirementSetId', requirementSetId)
            .single();

        let requirementSetDbId;

        if (existingSet) {
            requirementSetDbId = existingSet.id;
            console.log('Using existing RequirementSet:', requirementSetDbId);
        } else {
            // Создать новый RequirementSet
            console.log('Creating new RequirementSet...');
            const { data: newSet, error: setError } = await supabase
                .from('requirement_sets')
                .insert({
                    id: crypto.randomUUID(),
                    requirementSetId,
                    name: `${normSource.code} - ${normSource.title}`, // Display name
                    notes: `Автоматически создан из норматива ${normSource.code}`, // Description
                    jurisdiction: normSource.jurisdiction,
                    systemId: detectedSystemId, // Use auto-detected system
                    version: '1.0',
                    status: 'PUBLISHED', // Auto-publish norm-based sets
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                })
                .select('id')
                .single();

            console.log('RequirementSet create result:', { id: newSet?.id, error: setError });

            if (setError) {
                console.error('RequirementSet create error:', setError);
                return { success: false, error: `Failed to create requirement set: ${setError.message}` };
            }

            requirementSetDbId = newSet.id;
        }

        // 4. Сохранить в БД
        const now = new Date().toISOString();

        // Find the max existing requirementId counter for this norm to avoid duplicates
        const normPrefix = `REQ-${normSourceId.substring(0, 8)}`;
        const { data: existingReqs } = await supabase
            .from('requirements')
            .select('requirementId')
            .eq('normSourceId', normSourceId)
            .like('requirementId', `${normPrefix}%`);

        let reqCounter = 1;
        if (existingReqs && existingReqs.length > 0) {
            // Extract the max counter from existing IDs
            const maxCounter = Math.max(...existingReqs.map((r: any) => {
                const match = r.requirementId.match(/-(\d+)$/);
                return match ? parseInt(match[1], 10) : 0;
            }));
            reqCounter = maxCounter + 1;
            console.log(`Found ${existingReqs.length} existing requirements, starting counter at ${reqCounter}`);
        }

        const requirementsToInsert = requirements.map((req: any) => ({
            id: crypto.randomUUID(),
            requirementId: `${normPrefix}-${String(reqCounter++).padStart(4, '0')}`,
            requirementSetId: requirementSetDbId, // Use actual DB ID
            systemId: detectedSystemId, // Use auto-detected system
            normSourceId,
            clause: req.clause || '',
            requirementTextShort: req.requirementTextShort || '',
            requirementTextFull: req.requirementTextFull || req.requirementTextShort || '',
            checkMethod: req.checkMethod || 'visual',
            tags: req.tags || [],
            severityHint: req.severityHint || 'MEDIUM',
            mustCheck: req.mustCheck || false,
            createdAt: now,
            updatedAt: now
        }))

            ;

        // Insert new requirements (existing requirements are preserved)
        console.log('Step 5: Inserting new requirements (preserving existing ones)...');
        const { error: insertError } = await supabase
            .from('requirements')
            .insert(requirementsToInsert);

        if (insertError) {
            console.error('Error inserting requirements:', insertError);
            return { success: false, error: insertError.message };
        }

        // 4. Обновить статус фрагментов на PROCESSED
        const { error: updateError } = await supabase
            .from('raw_norm_fragments')
            .update({ status: 'PROCESSED', updatedAt: now })
            .eq('normSourceId', normSourceId)
            .eq('status', 'APPROVED');

        if (updateError) {
            console.warn('Warning: Could not update fragments status:', updateError);
        }

        revalidatePath(`/norm-library/${normSourceId}`);

        return {
            success: true,
            count: requirements.length,
            message: `Успешно создано ${requirements.length} требований`
        };

    } catch (error: any) {
        console.error('Error converting fragments:', error);
        return { success: false, error: error.message };
    }
}
