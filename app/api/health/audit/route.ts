import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
    try {
        const supabase = createClient();

        // Get total audit log entries
        const { count: totalCount } = await supabase
            .from('audit_log')
            .select('*', { count: 'exact', head: true });

        // Get today's entries
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const { count: todayCount } = await supabase
            .from('audit_log')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfDay.toISOString());

        return NextResponse.json({
            totalEntries: totalCount || 0,
            todayEntries: todayCount || 0
        });
    } catch (error) {
        console.error('Audit health error:', error);
        return NextResponse.json({
            totalEntries: 0,
            todayEntries: 0
        });
    }
}
