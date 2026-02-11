'use server';

import { supabase } from '@/lib/supabaseClient';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

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
import { getTagsForSystems } from '@/lib/system-tags';

/**
 * Freeze Baseline for Project (Refactored for Phase 8)
 * Creates AuditChecklists from selected Normative Documents (NormSources)
 * Filters requirements based on Project Scope (Systems)
 */
export async function freezeProjectBaseline(projectId: string, normIds: string[]) {
    try {
        console.log(`[Project Baseline] Freezing baseline for project: ${projectId} with norms: ${normIds}`);

        // 1. Fetch project to get scope
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

        // 2. Validate norm selection
        if (!normIds || normIds.length === 0) {
            return { success: false, error: 'No normative documents selected' };
        }

        // 3. Prepare Tags for filtering
        const scopeTags = getTagsForSystems(project.systemsInScope);
        console.log(`[Project Baseline] Scope Tags:`, scopeTags);

        // 4. Create AuditChecklists for each Norm and Filter Requirements
        const now = new Date().toISOString();
        let totalCheckItems = 0;
        let createdChecklistsCount = 0;

        for (const normId of normIds) {
            // Fetch requirements for this NormSource
            // Note: We need to join requirements linked to this normSourceId
            const { data: requirements, error: reqError } = await supabase
                .from('requirements')
                .select('*')
                .eq('normSourceId', normId);

            if (reqError) {
                console.error(`[Project Baseline] Error fetching requirements for norm ${normId}:`, reqError);
                continue; // Skip faulty norm
            }

            if (!requirements || requirements.length === 0) {
                console.warn(`[Project Baseline] No requirements found for norm ${normId}`);
                continue;
            }

            // FILTER: Keep only requirements relevant to scope
            // Logic: 
            // 1. If req.tags intersects with scopeTags
            // 2. OR if req.systemId matches one of project.systemsInScope (Direct System Link)
            const filteredRequirements = requirements.filter(req => {
                const hasMatchingTag = req.tags && req.tags.some((tag: string) => scopeTags.includes(tag));
                const hasMatchingSystem = project.systemsInScope.includes(req.systemId);
                return hasMatchingTag || hasMatchingSystem;
            });

            if (filteredRequirements.length === 0) {
                console.log(`[Project Baseline] Norm ${normId} has no requirements matching project scope.`);
                continue;
            }

            // Create checklist for this Norm
            // We need a RequirementSet concept for current schema compatibility, 
            // OR we create a dynamic "Project-Specific" requirement set? 
            // Existing schema expects `requirementSetId`.
            // SHORTCUT: We might need to fetch the existing RequirementSet for this Norm if it exists,
            // OR we link to a "Norm-based" entity.

            // CHALLENGE: AuditChecklist.requirementSetId is mandatory.
            // TEMPORARY FIX: We find ANY RequirementSet linked to this Norm, or create a placeholder?
            // BETTER: We search for a RequirementSet that wraps this Norm.
            // IF we are moving away from RequirmentSets, we should probably select the RequirementSet that represents this Norm.

            // Let's try to find a RequirementSet associated with this Norm (if strict 1:1 exists).
            // Actually, RequirementSet was usually "SP 484 (APS)".
            // If we select "SP 484" Norm, we can find RequirementSets that utilize it.

            // ALTERNATIVE: Use the FIRST RequirementSet found for this Norm to keep FK happy, 
            // but the checklist content is custom.

            const { data: reqSet } = await supabase
                .from('requirement_sets')
                .select('id')
                .eq('id', requirements[0].requirementSetId) // Use the set from the first requirement
                .limit(1)
                .maybeSingle();

            const targetReqSetId = reqSet?.id || requirements[0].requirementSetId;

            // Create Checklist
            const { data: checklist, error: checklistError } = await supabase
                .from('audit_checklists')
                .insert({
                    id: crypto.randomUUID(),
                    projectId: projectId,
                    requirementSetId: targetReqSetId, // Linking to underlying set for referential integrity
                    status: 'PENDING',
                    startedAt: now,
                    createdAt: now,
                    updatedAt: now
                })
                .select()
                .single();

            if (checklistError) {
                console.error('[Project Baseline] Error creating checklist:', checklistError);
                continue;
            }
            createdChecklistsCount++;

            // Create Results
            const resultsToCreate = filteredRequirements.map(req => ({
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
                console.error('[Project Baseline] Error creating results:', batchError);
            } else {
                totalCheckItems += resultsToCreate.length;
            }
        }

        if (createdChecklistsCount === 0) {
            return { success: false, error: 'No checklists created. Check if norms have matching requirements.' };
        }

        // 5. Mark project as frozen
        const { error: updateError } = await supabase
            .from('projects')
            .update({
                baselineFrozen: true,
                baselineFrozenAt: now,
                baselineFrozenBy: 'system',
                status: 'IN_PROGRESS',
                updatedAt: now
            })
            .eq('id', projectId);

        if (updateError) {
            return { success: false, error: `Failed to update project: ${updateError.message}` };
        }

        revalidatePath(`/projects/${projectId}`);
        revalidatePath('/projects');

        return {
            success: true,
            stats: {
                checklists: createdChecklistsCount,
                checkItems: totalCheckItems
            }
        };

    } catch (error: any) {
        console.error('[Project Baseline] Unexpected error:', error);
        return { success: false, error: error.message };
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

/**
 * Get available Normative Documents for selection
 * Grouped by type or just list? Returning list for now.
 */
export async function getAvailableNorms() {
    try {
        const { data: norms, error } = await supabase
            .from('norm_sources')
            .select('*')
            .eq('status', 'ACTIVE') // Only active norms
            .order('createdAt', { ascending: false });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, norms: norms || [] };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
