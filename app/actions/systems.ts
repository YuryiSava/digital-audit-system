'use server';

import { supabase } from '@/lib/supabaseClient';

export async function getSystemsList() {
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
