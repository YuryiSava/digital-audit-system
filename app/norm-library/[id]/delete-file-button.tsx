'use client';

import { Trash2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { deleteNormFile } from '@/app/actions/norm-library';

export function DeleteFileButton({ fileId, normId }: { fileId: string, normId: string }) {
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm('Вы уверены, что хотите удалить этот файл?')) return;

        setDeleting(true);
        try {
            const result = await deleteNormFile(fileId, normId);
            if (result.success) {
                // UI will update via revalidatePath
            } else {
                alert(`Ошибка удаления: ${result.error}`);
            }
        } catch (e: any) {
            alert(`Ошибка: ${e.message}`);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-red-400 disabled:opacity-50"
            title="Удалить файл"
        >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </button>
    );
}
