'use server';

import { supabase } from '@/lib/supabaseClient';
import { revalidatePath } from 'next/cache';

/**
 * Project Pre-Audit Actions
 * These work with the Project model (not Audit model)
 */

/**
 * Update Project Scope (Step 2 of Pre-Audit)
 */
export async function updateProjectScope(projectId: string, data: {
    systemsInScope: string[];
    scopeDepth?: 'BASIC' | 'STANDARD' | 'DEEP';
    scopeExclusions?: string;
}) {
    try {
        const { error } = await supabase
            .from('projects')
            .update({
                systemsInScope: data.systemsInScope,
                scopeDepth: data.scopeDepth || 'STANDARD',
                scopeExclusions: data.scopeExclusions,
                updatedAt: new Date().toISOString()
            })
            .eq('id', projectId);

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath(`/projects/${projectId}`);
        return { success: true };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Freeze Baseline for Project
 * Creates AuditChecklists from selected RequirementSets
 */
export async function freezeProjectBaseline(projectId: string, requirementSetIds: string[]) {
    try {
        console.log(`[Project Baseline] Freezing baseline for project: ${projectId}`);

        // 1. Fetch project
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();

        if (projectError || !project) {
            return { success: false, error: 'Project not found' };
        }

        if (project.baselineFrozen) {
            return { success: false, error: 'Baseline already frozen for this project' };
        }

        if (!project.systemsInScope || project.systemsInScope.length === 0) {
            return { success: false, error: 'No systems in scope. Please select systems first.' };
        }

        // 2. Validate requirement sets
        if (!requirementSetIds || requirementSetIds.length === 0) {
            return { success: false, error: 'No requirement sets selected' };
        }

        // 3. Create AuditChecklists for each requirement set
        const now = new Date().toISOString();
        let totalCheckItems = 0;

        for (const reqSetId of requirementSetIds) {
            // Create checklist
            const { data: checklist, error: checklistError } = await supabase
                .from('audit_checklists')
                .insert({
                    id: crypto.randomUUID(),
                    projectId: projectId,
                    requirementSetId: reqSetId,
                    status: 'PENDING',
                    startedAt: now,
                    createdAt: now,
                    updatedAt: now
                })
                .select()
                .single();

            if (checklistError) {
                console.error('[Project Baseline] Error creating checklist:', checklistError);
                return { success: false, error: `Failed to create checklist: ${checklistError.message}` };
            }

            // Get requirements for this set
            const { data: requirements, error: reqError } = await supabase
                .from('requirements')
                .select('id')
                .eq('requirementSetId', reqSetId);

            if (reqError) {
                console.error('[Project Baseline] Error fetching requirements:', reqError);
                return { success: false, error: `Failed to fetch requirements: ${reqError.message}` };
            }

            if (requirements && requirements.length > 0) {
                // Create AuditResults for all requirements
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

                if (batchError) {
                    console.error('[Project Baseline] Error creating audit results:', batchError);
                    return { success: false, error: `Failed to create audit results: ${batchError.message}` };
                }

                totalCheckItems += resultsToCreate.length;
                console.log(`[Project Baseline] Created ${resultsToCreate.length} check items for checklist ${checklist.id}`);
            }
        }

        // 4. Mark project as frozen
        const { error: updateError } = await supabase
            .from('projects')
            .update({
                baselineFrozen: true,
                baselineFrozenAt: now,
                baselineFrozenBy: 'system', // TODO: Replace with actual user
                status: 'IN_PROGRESS',
                updatedAt: now
            })
            .eq('id', projectId);

        if (updateError) {
            console.error('[Project Baseline] Error updating project:', updateError);
            return { success: false, error: `Failed to update project: ${updateError.message}` };
        }

        console.log(`[Project Baseline] Baseline frozen successfully`);

        revalidatePath(`/projects/${projectId}`);
        revalidatePath('/projects');

        return {
            success: true,
            stats: {
                checklists: requirementSetIds.length,
                checkItems: totalCheckItems
            }
        };

    } catch (error: any) {
        console.error('[Project Baseline] Unexpected error:', error);
        return {
            success: false,
            error: `Unexpected error: ${error.message || error.toString()}`
        };
    }
}

/**
 * Get available requirement sets for project scope
 */
export async function getAvailableRequirementSets(projectId: string) {
    try {
        const { data: project } = await supabase
            .from('projects')
            .select('systemsInScope')
            .eq('id', projectId)
            .single();

        if (!project || !project.systemsInScope || project.systemsInScope.length === 0) {
            return { success: true, requirementSets: [] };
        }

        // Get requirement sets for systems in scope
        const { data: requirementSets, error } = await supabase
            .from('requirement_sets')
            .select(`
                *,
                system:systems(systemId, name, nameRu)
            `)
            .in('systemId', project.systemsInScope)
            .eq('status', 'PUBLISHED')
            .order('createdAt', { ascending: false });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, requirementSets: requirementSets || [] };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Get project pre-audit progress
 */
export async function getProjectPreAuditProgress(projectId: string) {
    try {
        const { data: project, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();

        if (error || !project) {
            return { success: false, error: 'Project not found' };
        }

        const progress = {
            step1_basicInfo: !!(project.name && project.address),
            step2_scope: !!(project.systemsInScope && project.systemsInScope.length > 0),
            step3_requirementSets: false, // Will check below
            readyToFreeze: false
        };

        // Check if requirement sets are selected (checklists exist)
        const { data: checklists } = await supabase
            .from('audit_checklists')
            .select('id')
            .eq('projectId', projectId);

        progress.step3_requirementSets = !!(checklists && checklists.length > 0);
        progress.readyToFreeze = progress.step1_basicInfo && progress.step2_scope && !project.baselineFrozen;

        return { success: true, progress, project };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
