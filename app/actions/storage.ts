'use server';

import { createClient } from '@/utils/supabase/server';

export async function uploadEvidence(file: File | Blob, path: string) {
    const supabase = createClient();

    // Convert Blob to ArrayBuffer if necessary
    const buffer = await file.arrayBuffer();
    // --- UPLOAD WITH ADMIN CLIENT ---
    let uploadResult;
    try {
        const { createClient: createAdminClient } = await import('@supabase/supabase-js');
        const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // Ensure bucket exists
        const { data: buckets } = await supabaseAdmin.storage.listBuckets();
        if (!buckets?.find(b => b.name === 'audit-evidence')) {
            await supabaseAdmin.storage.createBucket('audit-evidence', { public: true });
        }

        const { data, error } = await supabaseAdmin.storage
            .from('audit-evidence')
            .upload(path, buffer, {
                contentType: 'image/jpeg',
                upsert: true
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('audit-evidence')
            .getPublicUrl(path);

        return { success: true, publicUrl };

    } catch (error: any) {
        console.error('Storage upload error (Admin):', error);
        return { success: false, error: error.message };
    }
}
