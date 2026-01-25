'use server';

import { supabase } from '@/lib/supabaseClient';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

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
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updatedAt', { ascending: false });

    if (error) {
        console.error('Error fetching projects:', error);
        return { success: false, error: error.message };
    }

    return { success: true, data };
}

export async function getProjectById(id: string) {
    const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

    if (error) return { success: false, error: error.message };

    return { success: true, data: project };
}

export async function createProject(data: ProjectData) {
    const validation = ProjectSchema.safeParse(data);
    if (!validation.success) return { success: false, error: validation.error.format() };

    const { startDate, ...rest } = validation.data;
    const now = new Date().toISOString();

    const { data: newProject, error } = await supabase
        .from('projects')
        .insert([{
            id: crypto.randomUUID(),
            ...rest,
            startDate: startDate ? new Date(startDate).toISOString() : now, // Дефолт - сегодня
            createdAt: now,
            updatedAt: now
        }])
        .select()
        .single();

    if (error) {
        console.error('Create project error:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/projects');
    return { success: true, data: newProject };
}

export async function deleteProject(id: string) {
    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

    if (error) return { success: false, error: error.message };

    revalidatePath('/projects');
    return { success: true };
}
