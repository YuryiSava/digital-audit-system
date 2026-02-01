'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function deleteRawFragments(normSourceId: string) {
    const supabase = createClient();
    console.log(`[deleteRawFragments] Deleting fragments for normSourceId: ${normSourceId}`);

    const { error } = await supabase
        .from('raw_norm_fragments')
        .delete()
        .eq('normSourceId', normSourceId);

    if (error) {
        console.error('[deleteRawFragments] Error:', error);
        return { success: false, error: error.message };
    }

    console.log(`[deleteRawFragments] Fragments deleted successfully`);

    revalidatePath(`/norm-library/${normSourceId}`);

    return { success: true };
}
