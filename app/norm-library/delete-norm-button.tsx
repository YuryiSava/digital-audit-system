'use client';

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { deleteNormSource } from '@/app/actions/norm-library';
import { useRouter } from 'next/navigation';

export function DeleteNormButton({ normId, normCode }: { normId: string; normCode: string }) {
    const [deleting, setDeleting] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        if (!confirm(`Вы уверены, что хотите удалить документ "${normCode}"?\n\nЭто действие необратимо и удалит все связанные требования и файлы.`)) {
            return;
        }

        setDeleting(true);
        try {
            const result = await deleteNormSource(normId);
            if (result.success) {
                alert('✓ Документ успешно удален');
                router.refresh();
            } else {
                alert(`Ошибка: ${result.error}`);
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
            className="text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed p-1 transition-colors"
            title="Удалить документ"
        >
            {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Trash2 className="h-4 w-4" />
            )}
        </button>
    );
}
