'use client';

import { Trash2 } from 'lucide-react';
import { deleteAuditChecklist } from '@/app/actions/audit';

interface DeleteChecklistButtonProps {
    checklistId: string;
    projectId: string;
}

export function DeleteChecklistButton({ checklistId, projectId }: DeleteChecklistButtonProps) {
    const handleDelete = async () => {
        if (!confirm('Удалить этот раздел аудита? Все результаты проверки будут удалены.')) {
            return;
        }

        const res = await deleteAuditChecklist(checklistId, projectId);
        if (!res.success) {
            alert('Ошибка при удалении: ' + res.error);
        }
    };

    return (
        <button
            onClick={handleDelete}
            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Удалить раздел"
        >
            <Trash2 className="h-5 w-5" />
        </button>
    );
}
