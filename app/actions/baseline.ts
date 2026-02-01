'use server';

import { supabase } from '@/lib/supabaseClient';
import { revalidatePath } from 'next/cache';

/**
 * Freeze Baseline - Critical Pre-Audit Function
 * 
 * This function:
 * 1. Creates an AuditBaseline record
 * 2. Creates snapshots of all selected NormSources
 * 3. Creates snapshots of all selected RequirementSets
 * 4. Generates CheckItems from Requirements
 * 
 * Once frozen, the baseline cannot be changed - ensuring audit integrity
 */
export async function freezeBaseline(auditId: string) {
    try {
        console.log(`[Baseline] Starting freeze for audit: ${auditId}`);

        // 1. Fetch audit details
        const { data: audit, error: auditError } = await supabase
            .from('audits')
            .select('*')
            .eq('id', auditId)
            .single();

        if (auditError || !audit) {
            return { success: false, error: 'Audit not found' };
        }

        // Check if already frozen
        if (audit.baselineFrozen) {
            return { success: false, error: 'Baseline already frozen for this audit' };
        }

        // 2. Create AuditBaseline record
        const snapshotId = `BASELINE-${audit.auditId}-${Date.now()}`;

        const { data: baseline, error: baselineError } = await supabase
            .from('audit_baselines')
            .insert({
                id: crypto.randomUUID(),
                auditId: auditId,
                snapshotId: snapshotId,
                status: 'FROZEN',
                createdAt: new Date().toISOString(),
                createdBy: 'system' // TODO: Replace with actual user
            })
            .select()
            .single();

        if (baselineError) {
            console.error('[Baseline] Error creating baseline:', baselineError);
            return { success: false, error: `Failed to create baseline: ${baselineError.message}` };
        }

        console.log(`[Baseline] Created baseline: ${baseline.id}`);

        // 3. Fetch all requirements for systems in scope
        const systemsInScope = audit.systemsInScope || [];

        if (systemsInScope.length === 0) {
            return { success: false, error: 'No systems in scope. Please select systems first.' };
        }

        console.log(`[Baseline] Systems in scope: ${systemsInScope.join(', ')}`);

        // 4. Fetch requirements for all systems in scope
        const { data: requirements, error: reqError } = await supabase
            .from('requirements')
            .select(`
                *,
                normSource:norm_sources(id, code, title, editionDate),
                requirementSet:requirement_sets(id, requirementSetId, version)
            `)
            .in('systemId', systemsInScope);

        if (reqError) {
            console.error('[Baseline] Error fetching requirements:', reqError);
            return { success: false, error: `Failed to fetch requirements: ${reqError.message}` };
        }

        if (!requirements || requirements.length === 0) {
            return { success: false, error: 'No requirements found for selected systems. Please parse norms first.' };
        }

        console.log(`[Baseline] Found ${requirements.length} requirements`);

        // 5. Create NormSource snapshots (unique norms)
        const uniqueNorms = new Map();
        requirements.forEach(req => {
            if (req.normSource && !uniqueNorms.has(req.normSource.id)) {
                uniqueNorms.set(req.normSource.id, req.normSource);
            }
        });

        const normSnapshots = Array.from(uniqueNorms.values()).map(norm => ({
            id: crypto.randomUUID(),
            baselineId: baseline.id,
            normSourceId: norm.id,
            editionDate: norm.editionDate,
            fileHash: null // TODO: Add file hash if needed
        }));

        if (normSnapshots.length > 0) {
            const { error: normSnapError } = await supabase
                .from('audit_norm_snapshots')
                .insert(normSnapshots);

            if (normSnapError) {
                console.error('[Baseline] Error creating norm snapshots:', normSnapError);
                return { success: false, error: `Failed to create norm snapshots: ${normSnapError.message}` };
            }

            console.log(`[Baseline] Created ${normSnapshots.length} norm snapshots`);
        }

        // 6. Create RequirementSet snapshots (unique sets)
        const uniqueSets = new Map();
        requirements.forEach(req => {
            if (req.requirementSet && !uniqueSets.has(req.requirementSet.id)) {
                uniqueSets.set(req.requirementSet.id, req.requirementSet);
            }
        });

        const setSnapshots = Array.from(uniqueSets.values()).map(set => ({
            id: crypto.randomUUID(),
            baselineId: baseline.id,
            requirementSetId: set.id,
            version: set.version,
            snapshotData: {} // TODO: Store full requirement data if needed
        }));

        if (setSnapshots.length > 0) {
            const { error: setSnapError } = await supabase
                .from('audit_requirement_snapshots')
                .insert(setSnapshots);

            if (setSnapError) {
                console.error('[Baseline] Error creating requirement set snapshots:', setSnapError);
                return { success: false, error: `Failed to create requirement set snapshots: ${setSnapError.message}` };
            }

            console.log(`[Baseline] Created ${setSnapshots.length} requirement set snapshots`);
        }

        // 7. Generate CheckItems from Requirements
        console.log('[Baseline] Generating check items...');

        const checkItems = requirements.map((req, index) => ({
            id: crypto.randomUUID(),
            checkItemId: `CHK-${audit.auditId}-${String(index + 1).padStart(4, '0')}`,
            auditId: auditId,
            requirementId: req.id,
            systemId: req.systemId,
            locationId: null, // Will be set during field work
            locationScope: null,
            samplingRule: null,
            status: null, // NOT_CHECKED, PASS, FAIL, N_A
            checkFact: null,
            naReasonId: null,
            naReasonComment: null,
            evidenceRefs: [],
            checkedBy: null,
            checkedAt: null,
            reviewedBy: null,
            reviewedAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }));

        // Insert check items in batches (Supabase has limits)
        const batchSize = 100;
        let insertedCount = 0;

        for (let i = 0; i < checkItems.length; i += batchSize) {
            const batch = checkItems.slice(i, i + batchSize);

            const { error: checkItemError } = await supabase
                .from('check_items')
                .insert(batch);

            if (checkItemError) {
                console.error('[Baseline] Error inserting check items batch:', checkItemError);
                return {
                    success: false,
                    error: `Failed to create check items (batch ${Math.floor(i / batchSize) + 1}): ${checkItemError.message}`
                };
            }

            insertedCount += batch.length;
            console.log(`[Baseline] Inserted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} items`);
        }

        console.log(`[Baseline] Created ${insertedCount} check items`);

        // 8. Update audit record - mark as frozen
        const { error: updateError } = await supabase
            .from('audits')
            .update({
                baselineFrozen: true,
                baselineFrozenAt: new Date().toISOString(),
                baselineFrozenBy: 'system', // TODO: Replace with actual user
                status: 'FIELD', // Move to field work phase
                updatedAt: new Date().toISOString()
            })
            .eq('id', auditId);

        if (updateError) {
            console.error('[Baseline] Error updating audit:', updateError);
            return { success: false, error: `Failed to update audit: ${updateError.message}` };
        }

        console.log('[Baseline] Audit marked as frozen');

        // 9. Revalidate paths
        revalidatePath(`/audits/${auditId}`);
        revalidatePath('/audits');

        return {
            success: true,
            baselineId: baseline.id,
            snapshotId: snapshotId,
            stats: {
                normSnapshots: normSnapshots.length,
                requirementSetSnapshots: setSnapshots.length,
                checkItems: insertedCount,
                requirements: requirements.length
            }
        };

    } catch (error: any) {
        console.error('[Baseline] Unexpected error:', error);
        return {
            success: false,
            error: `Unexpected error: ${error.message || error.toString()}`
        };
    }
}

/**
 * Get baseline details for an audit
 */
export async function getBaselineDetails(auditId: string) {
    try {
        const { data: baseline, error } = await supabase
            .from('audit_baselines')
            .select(`
                *,
                normSnapshots:audit_norm_snapshots(
                    *,
                    normSource:norm_sources(code, title, editionDate)
                ),
                requirementSnapshots:audit_requirement_snapshots(
                    *,
                    requirementSet:requirement_sets(requirementSetId, version)
                )
            `)
            .eq('auditId', auditId)
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, baseline };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Unfreeze baseline (admin only - dangerous operation!)
 */
export async function unfreezeBaseline(auditId: string, reason: string) {
    try {
        console.log(`[Baseline] UNFREEZING audit ${auditId}. Reason: ${reason}`);

        // Delete all check items
        await supabase
            .from('check_items')
            .delete()
            .eq('auditId', auditId);

        // Delete baseline
        await supabase
            .from('audit_baselines')
            .delete()
            .eq('auditId', auditId);

        // Update audit
        await supabase
            .from('audits')
            .update({
                baselineFrozen: false,
                baselineFrozenAt: null,
                baselineFrozenBy: null,
                status: 'PRE_AUDIT',
                updatedAt: new Date().toISOString()
            })
            .eq('id', auditId);

        revalidatePath(`/audits/${auditId}`);
        revalidatePath('/audits');

        return { success: true };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
