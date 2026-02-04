'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentUser } from './team';
import crypto from 'crypto';

const ProjectSchema = z.object({
    name: z.string().min(1, "Название обязательно"),
    address: z.string().optional(),
    customer: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED']).default('PLANNING'),
    startDate: z.string().optional().nullable(),
});

export type ProjectData = z.infer<typeof ProjectSchema>;

export async function getProjects() {
    const supabase = createClient();
    const currentUser = await getCurrentUser();
    const role = currentUser?.profile?.role || 'engineer';
    const userId = currentUser?.id;

    let query = supabase.from('projects').select('*');

    if (role !== 'admin' && (role === 'engineer' || role === 'viewer')) {
        const { data: assignments } = await supabase
            .from('project_assignments')
            .select('project_id')
            .eq('user_id', userId);

        const assignedIds = assignments?.map(a => a.project_id) || [];
        query = query.in('id', assignedIds);
    }

    const { data, error } = await query.order('updatedAt', { ascending: false });

    if (error) {
        console.error('Error fetching projects:', error);
        return { success: false, error: error.message };
    }

    return { success: true, data };
}

export async function getProjectById(id: string) {
    const supabase = createClient();
    const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

    if (error) return { success: false, error: error.message };

    return { success: true, data: project };
}

export async function createProject(data: ProjectData) {
    const supabase = createClient();
    const validation = ProjectSchema.safeParse(data);
    if (!validation.success) return { success: false, error: validation.error.format() };

    const { startDate, ...rest } = validation.data;
    const now = new Date().toISOString();

    const { data: newProject, error } = await supabase
        .from('projects')
        .insert([{
            id: crypto.randomUUID(),
            ...rest,
            startDate: startDate ? new Date(startDate).toISOString() : now,
            createdAt: now,
            updatedAt: now
        }])
        .select()
        .single();

    if (error) {
        console.error('Create project error:', error);
        return { success: false, error: error.message };
    }

    // Auto-assign creator to project
    const user = await getCurrentUser();
    if (user) {
        await supabase.from('project_assignments').insert({
            project_id: newProject.id,
            user_id: user.id,
            role: 'manager'
        });
    }

    revalidatePath('/projects');
    return { success: true, data: newProject };
}

export async function deleteProject(id: string) {
    const supabase = createClient();
    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

    if (error) return { success: false, error: error.message };

    revalidatePath('/projects');
    return { success: true };
}
