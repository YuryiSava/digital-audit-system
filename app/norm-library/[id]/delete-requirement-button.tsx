'use client';

import { Trash2 } from 'lucide-react';
import { deleteRequirement } from '@/app/actions/requirements';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function DeleteRequirementButton({
    requirementId,
    normId
}: {
    requirementId: string;
    normId: string;
}) {
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        if (!confirm('Удалить это требование?')) return;

        setIsDeleting(true);
        const result = await deleteRequirement(requirementId, normId);

        if (result.success) {
            router.refresh();
        } else {
            alert(`Ошибка: ${result.error}`);
            setIsDeleting(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 hover:bg-red-500/20 rounded-full transition-colors text-red-400 disabled:opacity-50"
            title="Удалить требование"
        >
            <Trash2 className="h-4 w-4" />
        </button>
    );
}
