'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getNotifications() {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('createdAt', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error fetching notifications:', error);
        return { success: false, error: error.message };
    }

    return { success: true, data };
}

export async function markAsRead(notificationId: string) {
    const supabase = createClient();

    const { error } = await supabase
        .from('notifications')
        .update({ isRead: true })
        .eq('id', notificationId);

    if (error) {
        console.error('Error marking notification as read:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/', 'layout');
    return { success: true };
}

export async function markAllAsRead() {
    const supabase = createClient();

    // Get current user to ensure we only mark relevant notifications
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
        .from('notifications')
        .update({ isRead: true })
        .eq('isRead', false);

    if (error) {
        console.error('Error marking all notifications as read:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/', 'layout');
    return { success: true };
}
