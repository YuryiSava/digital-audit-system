'use server';

import { supabase } from '@/lib/supabaseClient';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';

// Схема валидации
const NormSourceSchema = z.object({
    jurisdiction: z.enum(['KZ', 'RU', 'INT']),
    docType: z.string().min(1, "Тип документа обязателен"),
    code: z.string().min(1, "Шифр/Номер обязателен"),
    title: z.string().min(1, "Название обязательно"),
    publisher: z.string().optional(),
    editionDate: z.string().optional().nullable(),
    status: z.enum(['DRAFT', 'ACTIVE', 'SUPERSEDED']).default('DRAFT'),
});

/**
 * Transliterate Cyrillic to Latin for safe filenames
 * Preserves ASCII characters, converts Cyrillic to Latin equivalents
 */
function transliterateFilename(filename: string): string {
    const translitMap: Record<string, string> = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
        'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
        'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
        'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
        'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
        'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch', 'Ъ': '',
        'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
    };

    return filename
        .split('')
        .map(char => translitMap[char] || char)
        .join('')
        .replace(/[^a-zA-Z0-9_.-]/g, '_'); // Replace remaining unsafe chars
}


export async function getNormSources(filters?: {
    jurisdiction?: string;
    search?: string;
    status?: string;
}) {
    let query = supabase
        .from('norm_sources')
        .select('*')
        .order('updatedAt', { ascending: false });

    if (filters?.jurisdiction) {
        query = query.eq('jurisdiction', filters.jurisdiction);
    }

    if (filters?.status) {
        query = query.eq('status', filters.status);
    }

    if (filters?.search) {
        query = query.or(`code.ilike.%${filters.search}%,title.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Supabase fetch error:', error);
        return { success: false, error: error.message };
    }

    return { success: true, data };
}

export async function getNormById(id: string) {
    // Fetch norm source
    const { data: normData, error: normError } = await supabase
        .from('norm_sources')
        .select('*')
        .eq('id', id)
        .single();

    if (normError || !normData) {
        return { success: false, error: normError?.message || 'Norm not found' };
    }

    // Fetch associated files
    const { data: filesData } = await supabase
        .from('norm_files')
        .select('*')
        .eq('normSourceId', id);

    // Fetch associated requirements
    const { data: requirementsData } = await supabase
        .from('requirements')
        .select('*')
        .eq('normSourceId', id);

    // Sort requirements by clause
    const sortedRequirements = (requirementsData || []).sort((a: any, b: any) =>
        (a.clause || '').localeCompare(b.clause || '', undefined, { numeric: true })
    );

    // Combine data
    const data = {
        ...normData,
        files: filesData || [],
        requirements: sortedRequirements
    };

    return { success: true, data };
}

export async function createNormSource(formData: FormData) {
    const rawData = {
        jurisdiction: formData.get('jurisdiction'),
        docType: formData.get('docType'),
        code: formData.get('code'),
        title: formData.get('title'),
        publisher: formData.get('publisher'),
        editionDate: formData.get('editionDate'),
        status: formData.get('status') || 'DRAFT',
    };

    const validation = NormSourceSchema.safeParse(rawData);

    if (!validation.success) {
        return { success: false, error: validation.error.format() };
    }

    const { editionDate, ...rest } = validation.data;
    const file = formData.get('file') as File | null;

    // 1. Prepare Metadata
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const normSourceId = `NORM-${rest.jurisdiction}-${randomSuffix}`;
    const now = new Date().toISOString();
    const sourceUUID = crypto.randomUUID();

    // 2. Insert Norm Source
    const { error: insertError } = await supabase
        .from('norm_sources')
        .insert([
            {
                id: sourceUUID,
                ...rest,
                normSourceId,
                editionDate: editionDate ? new Date(editionDate).toISOString() : null,
                createdAt: now,
                updatedAt: now,
            }
        ]);

    if (insertError) {
        console.error('Supabase create error:', insertError);
        if (insertError.code === '23505') {
            return { success: false, error: `Уникальное ограничение: документ с таким кодом и датой уже существует` };
        }
        return { success: false, error: insertError.message };
    }

    // 3. Handle File Upload (if present)
    if (file && file.size > 0) {
        try {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Create directory if not exists
            const uploadDir = join(process.cwd(), 'public', 'uploads', 'norms');
            await mkdir(uploadDir, { recursive: true });

            // Generate safe filename for storage (ASCII only for filesystem)
            // But keep original name with Cyrillic for display
            const safeName = transliterateFilename(file.name);
            const uniqueFileName = `${Date.now()}-${safeName}`;
            const filePath = join(uploadDir, uniqueFileName);

            // Write File
            await writeFile(filePath, buffer);

            // Insert into norm_files with ORIGINAL name (with Cyrillic)
            const fileUrl = `/uploads/norms/${uniqueFileName}`;

            const { error: fileError } = await supabase
                .from('norm_files')
                .insert([
                    {
                        id: crypto.randomUUID(),
                        normSourceId: sourceUUID,
                        fileName: file.name, // Original name with Cyrillic for display
                        fileType: file.name.split('.').pop() || 'unknown',
                        fileSize: file.size,
                        fileHash: 'pending', // TODO: Calculate hash
                        storageUrl: fileUrl,
                        accessLevel: 'INTERNAL',
                        uploadedAt: now
                    }
                ]);

            if (fileError) {
                console.error('File metadata save error:', fileError);
                // Non-fatal, but good to know
            }

        } catch (uploadErr) {
            console.error('File upload failed:', uploadErr);
            return { success: false, error: 'Failed to upload file' };
        }
    }

    revalidatePath('/norm-library');
    return { success: true };
}

export async function uploadFileToNorm(normId: string, formData: FormData) {
    const file = formData.get('file') as File | null;

    if (!file) {
        return { success: false, error: 'No file provided' };
    }

    try {
        // Ensure upload directory exists
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'norms');
        await mkdir(uploadDir, { recursive: true });

        // Save file with transliterated name for filesystem
        // but keep original Cyrillic name in database
        const buffer = Buffer.from(await file.arrayBuffer());
        const safeName = transliterateFilename(file.name);
        const uniqueFileName = `${Date.now()}-${safeName}`;
        const filePath = join(uploadDir, uniqueFileName);

        await writeFile(filePath, buffer);

        // Insert into norm_files
        const fileUrl = `/uploads/norms/${uniqueFileName}`;
        const now = new Date().toISOString();

        const { error: fileError } = await supabase
            .from('norm_files')
            .insert([
                {
                    id: crypto.randomUUID(),
                    normSourceId: normId,
                    fileName: file.name,
                    fileType: file.name.split('.').pop() || 'unknown',
                    fileSize: file.size,
                    fileHash: 'pending',
                    storageUrl: fileUrl,
                    accessLevel: 'INTERNAL',
                    uploadedAt: now
                }
            ]);

        if (fileError) {
            console.error('File metadata save error:', fileError);
            return { success: false, error: `Database error: ${fileError.message}` };
        }

        revalidatePath(`/norm-library/${normId}`);
        return { success: true };

    } catch (error: any) {
        console.error('File upload failed:', error);
        return { success: false, error: `Upload failed: ${error.message}` };
    }
}

export async function deleteNormSource(id: string) {
    const { error } = await supabase
        .from('norm_sources')
        .delete()
        .eq('id', id);

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath('/norm-library');
    return { success: true };
}

export async function deleteNormFile(fileId: string, normId: string) {
    try {
        // 1. Get file info to delete from disk
        const { data: fileRecord, error: fetchError } = await supabase
            .from('norm_files')
            .select('storageUrl')
            .eq('id', fileId)
            .single();

        if (fetchError || !fileRecord) {
            return { success: false, error: 'File not found' };
        }

        // 2. Delete from disk (if exists)
        try {
            const relativePath = fileRecord.storageUrl;
            // Handle cleanup if path is relative
            const cleanPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
            const absolutePath = join(process.cwd(), 'public', cleanPath);
            const fs = require('fs/promises'); // Dynamic import for server actions context
            await fs.unlink(absolutePath);
        } catch (filesErr) {
            console.warn(`Could not delete file from disk: ${filesErr}`);
            // Continue to delete from DB even if disk delete fails (maybe file didn't exist)
        }

        // 3. Delete from DB
        const { error: deleteError } = await supabase
            .from('norm_files')
            .delete()
            .eq('id', fileId);

        if (deleteError) {
            return { success: false, error: deleteError.message };
        }

        revalidatePath(`/norm-library/${normId}`);
        return { success: true };

    } catch (e: any) {
        console.error('Delete file error:', e);
        return { success: false, error: e.message };
    }
}
