'use server';

import { supabase } from '@/lib/supabaseClient';

export async function getDashboardStats() {
    // 1. Fetch total projects
    const { count: totalProjects, error: errProjects } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true });

    // 2. Fetch completed audits (checklists)
    const { count: completedAudits, error: errCompleted } = await supabase
        .from('audit_checklists')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'COMPLETED');

    // 3. Fetch active audits
    const { count: activeAudits, error: errActive } = await supabase
        .from('audit_checklists')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'COMPLETED');

    // 4. Fetch recent projects
    const { data: recentProjects, error: errRecent } = await supabase
        .from('projects')
        .select('*, checklists:audit_checklists(count)')
        .order('updatedAt', { ascending: false })
        .limit(4);

    if (errProjects || errCompleted || errActive || errRecent) {
        console.error('Error fetching dashboard stats');
        return {
            success: false,
            stats: { totalProjects: 0, completedAudits: 0, activeAudits: 0 },
            recentProjects: []
        };
    }

    return {
        success: true,
        stats: {
            totalProjects: totalProjects || 0,
            completedAudits: completedAudits || 0,
            activeAudits: activeAudits || 0
        },
        recentProjects: recentProjects || []
    };
}
