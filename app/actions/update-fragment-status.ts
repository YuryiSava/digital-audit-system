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
