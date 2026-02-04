'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateFragmentStatus(fragmentId: string, status: 'PENDING' | 'APPROVED' | 'REJECTED', normSourceId: string) {
    const supabase = createClient();
    try {
        const { error } = await supabase
            .from('raw_norm_fragments')
            .update({
                status,
                updatedAt: new Date().toISOString()
            })
            .eq('id', fragmentId);

        if (error) {
            console.error('Error updating fragment status:', error);
            return { success: false, error: error.message };
        }

        revalidatePath(`/norm-library/${normSourceId}`);
        return { success: true };
    } catch (error: any) {
        console.error('Failed to update fragment status:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update tags and checkMethod on a fragment for manual editing
 */
export async function updateFragmentTags(
    fragmentId: string,
    updates: {
        tags?: string[];
        checkMethod?: string;
    },
    normSourceId: string
) {
    const supabase = createClient();
    try {
        const { error } = await supabase
            .from('raw_norm_fragments')
            .update({
                ...updates,
                updatedAt: new Date().toISOString()
            })
            .eq('id', fragmentId);

        if (error) {
            console.error('Error updating fragment tags:', error);
            return { success: false, error: error.message };
        }

        revalidatePath(`/norm-library/${normSourceId}`);
        return { success: true };
    } catch (error: any) {
        console.error('Failed to update fragment tags:', error);
        return { success: false, error: error.message };
    }
}
