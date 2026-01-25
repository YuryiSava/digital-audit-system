'use server';

import { supabase } from '@/lib/supabaseClient';
import { revalidatePath } from 'next/cache';

// --- Checklists (Привязка каталога к проекту) ---

export async function createAuditChecklist(projectId: string, requirementSetId: string) {
    const now = new Date().toISOString();

    // 1. Создаем сам чек-лист
    const { data: checklist, error } = await supabase
        .from('audit_checklists')
        .insert([{
            id: crypto.randomUUID(),
            projectId,
            requirementSetId,
            status: 'PENDING',
            startedAt: now,
            createdAt: now,
            updatedAt: now
        }])
        .select()
        .single();

    if (error) {
        console.error('Error creating checklist:', error);
        return { success: false, error: error.message };
    }

    // 2. Автоматически создаем пустые результаты для всех требований из этого набора
    // Чтобы аудитор сразу видел пункты, которые нужно проверить

    // Получаем требования
    const { data: requirements } = await supabase
        .from('requirements')
        .select('id')
        .eq('requirementSetId', requirementSetId);

    if (requirements && requirements.length > 0) {
        const resultsToCreate = requirements.map(req => ({
            id: crypto.randomUUID(),
            checklistId: checklist.id,
            requirementId: req.id,
            status: 'NOT_CHECKED',
            createdAt: now,
            updatedAt: now
        }));

        const { error: batchError } = await supabase
            .from('audit_results')
            .insert(resultsToCreate);

        if (batchError) console.error('Error creating initial results:', batchError);
    }

    revalidatePath(`/projects/${projectId}`);
    return { success: true, data: checklist };
}

export async function getProjectChecklists(projectId: string) {
    const { data, error } = await supabase
        .from('audit_checklists')
        .select(`
            *,
            requirementSet:requirement_sets (
                id, requirementSetId, version,
                system:systems(name, systemId)
            )
        `)
        .eq('projectId', projectId)
        .order('createdAt', { ascending: false });

    if (error) return { success: false, error: error.message };

    // Подсчет прогресса
    // Это можно оптимизировать, но пока сделаем отдельным запросом или в цикле, если данных мало
    // Для MVP просто вернем список
    return { success: true, data };
}

// --- Audit Execution (Проведение аудита) ---

export async function getChecklistDetails(checklistId: string) {
    const { data: checklist, error } = await supabase
        .from('audit_checklists')
        .select(`
            *,
            project:projects(*),
            requirementSet:requirement_sets (
                id, requirementSetId, version,
                system:systems(name)
            ),
            results:audit_results (
                *,
                requirement:requirements (
                    *,
                    normSource:norm_sources (*)
                )
            )
        `)
        .eq('id', checklistId)
        .single();

    if (error) return { success: false, error: error.message };

    // Сортировка результатов по пунктам
    if (checklist.results) {
        checklist.results.sort((a: any, b: any) =>
            a.requirement.clause.localeCompare(b.requirement.clause, undefined, { numeric: true })
        );
    }

    return { success: true, data: checklist };
}

export async function saveAuditResult(resultId: string, status: string, comment?: string, photos?: string[]) {
    const now = new Date().toISOString();

    const updateData: any = {
        status,
        updatedAt: now
    };
    if (comment !== undefined) updateData.comment = comment;
    if (photos !== undefined) updateData.photos = photos;

    const { error } = await supabase
        .from('audit_results')
        .update(updateData)
        .eq('id', resultId);

    if (error) return { success: false, error: error.message };

    return { success: true };
}

export async function updateChecklistDetails(checklistId: string, data: {
    summary?: string,
    risks?: string,
    recommendations?: string,
    auditorName?: string,
    status?: string,
    facilityDescription?: string,
    contractNumber?: string,
    auditorTitle?: string,
    companyLogoUrl?: string
}) {
    const { error } = await supabase
        .from('audit_checklists')
        .update({ ...data, updatedAt: new Date().toISOString() })
        .eq('id', checklistId);

    if (error) return { success: false, error: error.message };
    revalidatePath(`/audit/${checklistId}`);
    revalidatePath(`/audit/${checklistId}/report`);
    return { success: true };
}
