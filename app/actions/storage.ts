'use server';

import { createClient } from '@/utils/supabase/server';

export async function uploadEvidence(file: File | Blob, path: string) {
    const supabase = createClient();

    // Convert Blob to ArrayBuffer if necessary
    const buffer = await file.arrayBuffer();
    const fileName = path.split('/').pop() || `${Date.now()}.jpg`;

    const { data, error } = await supabase.storage
        .from('audit-evidence')
        .upload(path, buffer, {
            contentType: 'image/jpeg',
            upsert: true
        });

    if (error) {
        console.error('Storage upload error:', error);
        return { success: false, error: error.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from('audit-evidence')
        .getPublicUrl(path);

    return { success: true, publicUrl };
}
