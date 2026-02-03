'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// --- Requirement Set (Набор требований) ---

const RequirementSetSchema = z.object({
    systemId: z.string().min(1, "Система обязательна"),
    jurisdiction: z.enum(['KZ', 'RU', 'INT']),
    version: z.string().min(1, "Версия обязательна"),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
    notes: z.string().optional(),
});

export type RequirementSetData = z.infer<typeof RequirementSetSchema>;

export async function getRequirementSets() {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('requirement_sets')
        .select(`
      *,
      system:systems(name)
    `)
        .in('status', ['PUBLISHED', 'ACTIVE'])  // Show both published and active sets
        .order('updatedAt', { ascending: false });

    if (error) {
        console.error('Error fetching requirement sets:', error);
        return { success: false, error: error.message };
    }

    return { success: true, data };
}

export async function getRequirementSetById(id: string) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('requirement_sets')
        .select(`
        *,
        system:systems(*),
        requirements:requirements(*)
    `)
        .eq('id', id)
        .single();

    if (error) return { success: false, error: error.message };

    if (data && data.requirements) {
        // Сортировка: сначала по длине пункта, потом по значению (чтобы 5.10 шло после 5.9)
        data.requirements.sort((a: any, b: any) =>
            a.clause.localeCompare(b.clause, undefined, { numeric: true })
        );
    }

    return { success: true, data };
}

export async function createRequirementSet(data: RequirementSetData) {
    const supabase = createClient();
    const validation = RequirementSetSchema.safeParse(data);
    if (!validation.success) return { success: false, error: validation.error.format() };

    const { systemId, jurisdiction, version, notes } = validation.data;
    const now = new Date().toISOString();

    const requirementSetId = `RS-${systemId}-${jurisdiction}-${version}`;

    const { data: newSet, error } = await supabase
        .from('requirement_sets')
        .insert([{
            id: crypto.randomUUID(),
            requirementSetId,
            systemId,
            jurisdiction,
            version,
            status: 'DRAFT',
            notes,
            createdAt: now,
            updatedAt: now
        }])
        .select()
        .single();

    if (error) {
        console.error('Create set error:', error);
        if (error.code === '23505') {
            return { success: false, error: `Набор с ID ${requirementSetId} уже существует` };
        }
        return { success: false, error: error.message };
    }

    revalidatePath('/requirements');
    return { success: true, data: newSet };
}

/**
 * Publish a RequirementSet (change status from DRAFT to PUBLISHED)
 */
export async function publishRequirementSet(id: string) {
    const supabase = createClient();
    try {
        const { data, error } = await supabase
            .from('requirement_sets')
            .update({
                status: 'PUBLISHED',
                updatedAt: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error publishing requirement set:', error);
            return { success: false, error: error.message };
        }

        revalidatePath('/requirements');
        revalidatePath('/requirement-sets');
        return { success: true, data };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Publish all DRAFT RequirementSets
 */
export async function publishAllRequirementSets() {
    const supabase = createClient();
    try {
        const { data, error } = await supabase
            .from('requirement_sets')
            .update({
                status: 'PUBLISHED',
                updatedAt: new Date().toISOString()
            })
            .eq('status', 'DRAFT')
            .select();

        if (error) {
            console.error('Error publishing all requirement sets:', error);
            return { success: false, error: error.message };
        }

        revalidatePath('/requirements');
        revalidatePath('/requirement-sets');
        return { success: true, count: data?.length || 0 };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}


// --- Requirements (Требования) ---

const RequirementSchema = z.object({
    requirementSetId: z.string(),
    systemId: z.string(),
    normSourceId: z.string().min(1, "Норматив обязателен"),
    clause: z.string().min(1, "Пункт обязателен"),
    requirementTextShort: z.string().min(1, "Краткое требование обязательно"),
    requirementTextFull: z.string().optional(),
    checkMethod: z.string().default('visual'),
    severityHint: z.string().optional(),
});

export type RequirementData = z.infer<typeof RequirementSchema>;

export async function createRequirement(data: RequirementData) {
    const supabase = createClient();
    const validation = RequirementSchema.safeParse(data);
    if (!validation.success) return { success: false, error: validation.error.format() };

    const { requirementSetId, systemId, ...rest } = validation.data;

    // Генерируем ID
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const requirementId = `REQ-${systemId}-${randomSuffix}`;
    const now = new Date().toISOString();

    const { data: newReq, error } = await supabase
        .from('requirements')
        .insert([{
            id: crypto.randomUUID(),
            requirementId,
            requirementSetId,
            systemId,
            ...rest,
            createdAt: now,
            updatedAt: now
        }])
        .select()
        .single();

    if (error) {
        console.error('Create requirement error:', error);
        return { success: false, error: error.message };
    }

    revalidatePath(`/requirements/${requirementSetId}`);
    return { success: true, data: newReq };
}

// --- BATCH IMPORT ---

export async function createRequirementsBatch(items: RequirementData[]) {
    const supabase = createClient();
    if (items.length === 0) return { success: true, count: 0 };

    const now = new Date().toISOString();

    const records = items.map(item => {
        const randomSuffix = Math.floor(100000 + Math.random() * 900000);
        return {
            id: crypto.randomUUID(),
            requirementId: `REQ-${item.systemId}-${randomSuffix}`,
            requirementSetId: item.requirementSetId,
            systemId: item.systemId,
            normSourceId: item.normSourceId,
            clause: item.clause,
            requirementTextShort: item.requirementTextShort,
            checkMethod: item.checkMethod || 'visual',
            severityHint: item.severityHint || 'medium',
            createdAt: now,
            updatedAt: now
        };
    });

    const { error } = await supabase
        .from('requirements')
        .insert(records);

    if (error) {
        console.error('Batch import error:', error);
        return { success: false, error: error.message };
    }

    // items[0] надеемся существует
    if (items.length > 0) {
        revalidatePath(`/requirements/${items[0].requirementSetId}`);
    }

    return { success: true, count: records.length };
}


export async function deleteRequirement(id: string, setId: string) {
    const supabase = createClient();
    const { error } = await supabase
        .from('requirements')
        .delete()
        .eq('id', id);

    if (error) return { success: false, error: error.message };

    revalidatePath(`/requirements/${setId}`);
    return { success: true };
}

/**
 * Update an existing requirement (manual editing)
 */
export async function updateRequirement(
    requirementId: string,
    updates: {
        clause?: string;
        systemId?: string;
        requirementTextShort?: string;
        requirementTextFull?: string;
        checkMethod?: string;
        mustCheck?: boolean;
        tags?: string[];
        notes?: string;
    }
) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('requirements')
        .update({
            ...updates,
            updatedAt: new Date().toISOString()
        })
        .eq('id', requirementId)
        .select()
        .single();

    if (error) {
        console.error('Error updating requirement:', error);
        return { success: false, error: error.message };
    }

    // Revalidate the norm page
    if (data.normSourceId) {
        revalidatePath(`/norm-library/${data.normSourceId}`);
    }

    return { success: true, data };
}

// --- Helpers ---

export async function getSystemsList() {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('systems')
        .select('id, name, systemId')
        .eq('status', 'ACTIVE')
        .order('order', { ascending: true });

    if (error) return [];
    return data;
}

export async function getNormSourcesListForSelect() {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('norm_sources')
        .select('id, code, title')
        // Убрали фильтр по статусу для теста, или можно оставить
        .order('updatedAt', { ascending: false });

    if (error) return [];
    return data;
}

// Alias for compatibility
export { createRequirement as addRequirement };

