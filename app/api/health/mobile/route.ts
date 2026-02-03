import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
    try {
        const supabase = createClient();

        // Count active field sessions (last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

        const { count, error } = await supabase
            .from('audit_results')
            .select('*', { count: 'exact', head: true })
            .gte('updatedAt', fiveMinutesAgo);

        if (error) {
            console.error('Mobile health check error:', error);
            return NextResponse.json({ fieldSessions: 0, lastSync: null });
        }

        return NextResponse.json({
            fieldSessions: count || 0,
            lastSync: new Date().toISOString()
        });
    } catch (error) {
        console.error('Mobile health error:', error);
        return NextResponse.json({ fieldSessions: 0, lastSync: null });
    }
}
