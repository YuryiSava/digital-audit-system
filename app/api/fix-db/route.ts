import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        console.log('Starting DB Clean...');

        // 1. Find broken files
        const { data: brokenFiles, error: searchError } = await supabase
            .from('norm_files')
            .select('id, storageUrl')
            .ilike('storageUrl', '%test/data%');

        if (searchError) throw searchError;

        const count = brokenFiles?.length || 0;
        let deleted = 0;

        // 2. Delete them
        if (count > 0) {
            const ids = brokenFiles.map(f => f.id);
            const { error: deleteError } = await supabase
                .from('norm_files')
                .delete()
                .in('id', ids);

            if (deleteError) throw deleteError;
            deleted = count;
        }

        return NextResponse.json({
            success: true,
            found: count,
            deleted: deleted,
            message: `Cleaned ${deleted} broken file records.`
        });

    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
