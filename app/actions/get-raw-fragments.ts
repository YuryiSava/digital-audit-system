'use server';

import { createClient } from '@/utils/supabase/server';

export async function getRawFragments(normSourceId: string) {
    const supabase = createClient();
    console.log(`[getRawFragments] Fetching fragments for normSourceId: ${normSourceId}`);

    const { data: fragments, error } = await supabase
        .from('raw_norm_fragments')
        .select('*')
        .eq('normSourceId', normSourceId)
        .order('createdAt', { ascending: true });

    if (error) {
        console.error('[getRawFragments] Error fetching raw fragments:', error);
        return { fragments: [], count: 0 };
    }

    console.log(`[getRawFragments] Found ${fragments?.length || 0} fragments`);

    return {
        fragments: fragments || [],
        count: fragments?.length || 0
    };
}
