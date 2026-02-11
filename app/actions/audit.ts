'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

// --- Checklists (Привязка каталога к проекту) ---

export async function createAuditChecklist(projectId: string, requirementSetId: string) {
    const supabase = createClient();
    const now = new Date().toISOString();

    // 0. Check if this requirement set is already added to this project
    const { data: existingChecklist, error: checkError } = await supabase
        .from('audit_checklists')
        .select('id')
        .eq('projectId', projectId)
        .eq('requirementSetId', requirementSetId)
        .maybeSingle();

    if (existingChecklist) {
        return {
            success: false,
            error: 'Этот раздел аудита уже добавлен в проект'
        };
    }

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

/**
 * NEW: Create Checklist by System ID (Phase 8 System-Centric)
 * automatically finds the relevant Requirement Set for the system
 */
export async function createSystemChecklist(projectId: string, systemId: string) {
    const supabase = createClient();

    // 1. Find the best matching Requirement Set for this System
    // Logic: Latest PUBLISHED set for this system
    const { data: reqSet, error: rsError } = await supabase
        .from('requirement_sets')
        .select('id, name')
        .eq('systemId', systemId)
        .eq('status', 'PUBLISHED')
        .order('createdAt', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (rsError) return { success: false, error: rsError.message };

    if (!reqSet) {
        // Fallback: finding ANY set for this system (maybe DRAFT allowed for testing?)
        const { data: draftSet } = await supabase
            .from('requirement_sets')
            .select('id, name')
            .eq('systemId', systemId)
            .order('createdAt', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (!draftSet) {
            return { success: false, error: `Для системы ${systemId} не найдено каталогов требований.` };
        }
        return createAuditChecklist(projectId, draftSet.id);
    }

    return createAuditChecklist(projectId, reqSet.id);
}

export async function getProjectChecklists(projectId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('audit_checklists')
        .select(`
            *,
            requirementSet:requirement_sets (
                id, requirementSetId, version, name, notes,
                system:systems(name, systemId)
            ),
            results:audit_results (
                id,
                status
            )
        `)
        .eq('projectId', projectId)
        .order('createdAt', { ascending: false });

    if (error) return { success: false, error: error.message };

    return { success: true, data };
}

// --- Audit Execution (Проведение аудита) ---

export async function getChecklistDetails(checklistId: string) {
    const supabase = createClient();
    const { data: checklist, error } = await supabase
        .from('audit_checklists')
        .select(`
            *,
            project:projects(*),
            requirementSet:requirement_sets (
                id, requirementSetId, version, name, notes,
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

export async function saveAuditResult(
    resultId: string,
    status: string,
    comment?: string,
    photos?: string[],
    videoLink?: string,
    quantitativeData?: {
        isMultiple?: boolean;
        totalCount?: number;
        failCount?: number;
        inspectionMethod?: string;
        defect_items?: any[];
    }
) {
    const supabase = createClient();
    const now = new Date().toISOString();

    const updateData: any = {
        status,
        updatedAt: now
    };
    if (comment !== undefined) updateData.comment = comment;
    if (photos !== undefined) updateData.photos = photos;
    if (videoLink !== undefined) updateData.video_link = videoLink;

    if (quantitativeData) {
        if (quantitativeData.isMultiple !== undefined) updateData.isMultiple = quantitativeData.isMultiple;
        if (quantitativeData.totalCount !== undefined) updateData.totalCount = quantitativeData.totalCount;
        if (quantitativeData.failCount !== undefined) updateData.failCount = quantitativeData.failCount;
        if (quantitativeData.inspectionMethod !== undefined) updateData.inspectionMethod = quantitativeData.inspectionMethod;
        if (quantitativeData.defect_items !== undefined) updateData.defect_items = quantitativeData.defect_items;
    }

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
    const supabase = createClient();
    const { error } = await supabase
        .from('audit_checklists')
        .update({ ...data, updatedAt: new Date().toISOString() })
        .eq('id', checklistId);

    if (error) return { success: false, error: error.message };
    revalidatePath(`/audit/${checklistId}`);
    revalidatePath(`/audit/${checklistId}/report`);
    return { success: true };
}

export async function deleteAuditChecklist(checklistId: string, projectId: string) {
    const supabase = createClient();
    // First delete all audit results for this checklist
    const { error: resultsError } = await supabase
        .from('audit_results')
        .delete()
        .eq('checklistId', checklistId);

    if (resultsError) {
        console.error('Error deleting audit results:', resultsError);
        return { success: false, error: resultsError.message };
    }

    // Then delete the checklist itself
    const { error: checklistError } = await supabase
        .from('audit_checklists')
        .delete()
        .eq('id', checklistId);

    if (checklistError) {
        console.error('Error deleting checklist:', checklistError);
        return { success: false, error: checklistError.message };
    }

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}

export async function getProjectFullAuditData(projectId: string) {
    const supabase = createClient();

    // 1. Get Project
    const { data: project, error: pError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

    if (pError) return { success: false, error: pError.message };

    // 2. Get all checklists with their requirement sets and results
    const { data: checklists, error: cError } = await supabase
        .from('audit_checklists')
        .select(`
            *,
            requirementSet:requirement_sets (
                id, name,
                system:systems(name)
            ),
            results:audit_results (
                *,
                requirement:requirements (*)
            )
        `)
        .eq('projectId', projectId);

    if (cError) return { success: false, error: cError.message };

    return { success: true, project, checklists };
}

export async function getProjectFullExecutionData(projectId: string) {
    const supabase = createClient();

    // 1. Get Project
    const { data: project, error: pError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

    if (pError) return { success: false, error: pError.message };

    // 2. Get ALL audit results for this project via checklists
    // We join checklists -> results -> requirements -> normSource
    const { data: checklists, error: cError } = await supabase
        .from('audit_checklists')
        .select(`
            id,
            requirementSet:requirement_sets (
                id, name, systemId,
                system:systems(name)
            ),
            results:audit_results (
                *,
                requirement:requirements (
                    *,
                    normSource:norm_sources (code, title)
                )
            )
        `)
        .eq('projectId', projectId);

    if (cError) return { success: false, error: cError.message };

    // Flatten results into a single array
    let allResults: any[] = [];
    checklists?.forEach((checklist: any) => {
        if (checklist.results) {
            checklist.results.forEach((result: any) => {
                // Enrich result with checklist/system context if needed
                result.systemId = checklist.requirementSet?.systemId;
                result.systemName = checklist.requirementSet?.system?.name;
                result.checklistId = checklist.id;
                allResults.push(result);
            });
        }
    });

    // Sort by clause
    allResults.sort((a, b) =>
        a.requirement.clause.localeCompare(b.requirement.clause, undefined, { numeric: true })
    );

    return { success: true, project, results: allResults };
}
