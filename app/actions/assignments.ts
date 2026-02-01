'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getProjectMembers(projectId: string) {
    const supabase = createClient()

    // We need to join with user_profiles. 
    // Supabase JS doesn't support deep join syntax easily for 1:M:1 in typed client sometimes, 
    // but standard join works: .select('*, user:user_profiles(*)')

    const { data: assignments, error } = await supabase
        .from('project_assignments')
        .select(`
            *,
            user:user_profiles (
                id,
                full_name,
                email,
                role
            )
        `)
        .eq('project_id', projectId)

    if (error) {
        console.error('Error fetching project members:', error)
        return { success: false, error: error.message }
    }

    return { success: true, data: assignments }
}

export async function assignUserToProject(projectId: string, userId: string, role: string = 'contributor') {
    const supabase = createClient()

    const { error } = await supabase
        .from('project_assignments')
        .insert({
            project_id: projectId,
            user_id: userId,
            role: role
        })

    if (error) {
        // Check for uniqueness violation
        if (error.code === '23505') {
            return { success: false, error: 'Пользователь уже назначен на этот проект' }
        }
        console.error('Error assigning user:', error)
        return { success: false, error: error.message }
    }

    revalidatePath(`/projects/${projectId}`)
    return { success: true }
}

export async function removeUserFromProject(projectId: string, userId: string) {
    const supabase = createClient()

    const { error } = await supabase
        .from('project_assignments')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId)

    if (error) {
        console.error('Error removing user:', error)
        return { success: false, error: error.message }
    }

    revalidatePath(`/projects/${projectId}`)
    return { success: true }
}

export async function searchUsers(query: string) {
    const supabase = createClient()

    if (!query || query.length < 2) return { success: true, data: [] }

    const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, email, role')
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10)

    if (error) {
        console.error('Error searching users:', error)
        return { success: false, error: error.message }
    }

    return { success: true, data }
}

export async function getAllUsers() {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, email, role')
        .order('full_name', { ascending: true })
        .limit(100)

    if (error) {
        console.error('Error fetching all users:', error)
        return { success: false, error: error.message }
    }

    return { success: true, data }
}

