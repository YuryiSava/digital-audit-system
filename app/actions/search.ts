'use server';

import { createClient } from "@/utils/supabase/server";

export async function searchRequirements(query: string) {
    const supabase = createClient();

    if (!query || query.length < 2) return { success: true, data: [] };

    const { data, error } = await supabase
        .from('requirements')
        .select(`
            *,
            normSource:norm_sources(*),
            requirementSet:requirement_sets(name)
        `)
        .or(`content.ilike.%${query}%,clause.ilike.%${query}%`)
        .limit(20);

    if (error) {
        console.error('Search error:', error);
        return { success: false, error: error.message };
    }

    return { success: true, data };
}
