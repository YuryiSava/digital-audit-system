'use server';

import { createClient } from '@/utils/supabase/server';

export async function getSystemsList() {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('systems')
        .select('*')
        .eq('status', 'ACTIVE')
        .order('order', { ascending: true });

    if (error) {
        console.error('Error fetching systems:', error);
        return [];
    }

    return data || [];
}
