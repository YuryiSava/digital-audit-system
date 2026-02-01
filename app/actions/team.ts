'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getTeamMembers() {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('user_profiles')
        .select(`
            *,
            assignments:project_assignments(
                project:projects(name)
            )
        `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching team members:', error)
        return { success: false, error: error.message }
    }

    return { success: true, data }
}

export async function updateUserRole(userId: string, role: string) {
    const supabase = createClient()

    const { error } = await supabase
        .from('user_profiles')
        .update({ role })
        .eq('id', userId)

    if (error) {
        console.error('Error updating role:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/team')
    return { success: true }
}

export async function getCurrentUser() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // Normalize role to lowercase to avoid UI/RLS mismatches
    if (profile) {
        profile.role = (profile.role?.toLowerCase() || 'engineer') as 'admin' | 'engineer' | 'manager' | 'viewer';
    }

    return { ...user, profile }
}
