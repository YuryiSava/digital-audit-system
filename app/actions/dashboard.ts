'use server';

import { createClient } from '@/utils/supabase/server';
import { getCurrentUser } from './team';

export async function getDashboardStats() {
    const supabase = createClient();
    const currentUser = await getCurrentUser();
    const role = currentUser?.profile?.role || 'engineer';
    const userId = currentUser?.id;

    let projectQuery = supabase.from('projects').select('*', { count: 'exact', head: true });
    let checklistQuery = supabase.from('audit_checklists').select('*', { count: 'exact', head: true });
    let recentQuery = supabase.from('projects').select('*, checklists:audit_checklists(count)');

    // Filter for Engineers/Viewers: Only assigned projects
    if (role !== 'admin' && (role === 'engineer' || role === 'viewer')) {
        // Fetch assigned project IDs
        const { data: assignments } = await supabase
            .from('project_assignments')
            .select('project_id')
            .eq('user_id', userId);

        const assignedIds = assignments?.map(a => a.project_id) || [];

        projectQuery = projectQuery.in('id', assignedIds);
        checklistQuery = checklistQuery.in('projectId', assignedIds);
        recentQuery = recentQuery.in('id', assignedIds);
    }

    // 1. Fetch total projects
    const { count: totalProjects, error: errProjects } = await projectQuery;

    // 2. Fetch completed audits
    let completedQuery = supabase.from('audit_checklists').select('*', { count: 'exact', head: true }).eq('status', 'COMPLETED');
    if (role !== 'admin' && (role === 'engineer' || role === 'viewer')) {
        const { data: assignments } = await supabase.from('project_assignments').select('project_id').eq('user_id', userId);
        const assignedIds = assignments?.map(a => a.project_id) || [];
        completedQuery = completedQuery.in('projectId', assignedIds);
    }
    const { count: completedAudits, error: errCompleted } = await completedQuery;

    // 3. Fetch active audits
    let activeQuery = supabase.from('audit_checklists').select('*', { count: 'exact', head: true }).neq('status', 'COMPLETED');
    if (role !== 'admin' && (role === 'engineer' || role === 'viewer')) {
        const { data: assignments } = await supabase.from('project_assignments').select('project_id').eq('user_id', userId);
        const assignedIds = assignments?.map(a => a.project_id) || [];
        activeQuery = activeQuery.in('projectId', assignedIds);
    }
    const { count: activeAudits, error: errActive } = await activeQuery;

    // 4. Fetch recent projects
    const { data: recentProjects, error: errRecent } = await recentQuery
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
