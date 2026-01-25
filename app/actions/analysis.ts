'use server';

import { supabase } from '@/lib/supabaseClient';
import { revalidatePath } from 'next/cache';
import { enrichRequirement } from '@/lib/ai-analysis';

export async function analyzeNormRequirements(normId: string) {
    console.log('Starting AI Analysis for Norm:', normId);

    // 1. Fetch Requirements
    const { data: requirements, error: fetchError } = await supabase
        .from('requirements')
        .select('*')
        .eq('normSourceId', normId);

    if (fetchError || !requirements || requirements.length === 0) {
        return { success: false, error: 'No requirements found to analyze. Parse file first.' };
    }

    // 2. Process items
    let updatedCount = 0;
    const updates = requirements.map(req => {
        const enriched = enrichRequirement(req.requirementTextFull || req.requirementTextShort);

        // Only update if changed (naive check, or just overwrite)
        return {
            id: req.id,
            ...enriched
        };
    });

    // 3. Save updates (Upsert is best, but requirements table might not have easy upsert on ID without all fields)
    // We will update one by one for safety in this restricted environment, or use upsert if schema allows.
    // Supabase upsert works if we provide primary key.

    const { error: updateError } = await supabase
        .from('requirements')
        .upsert(updates); // batch update

    if (updateError) {
        console.error('Analysis Update Error:', updateError);
        return { success: false, error: updateError.message };
    }

    revalidatePath(`/norm-library/${normId}`);
    return { success: true, count: updates.length };
}
