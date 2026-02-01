'use client';

import { useState } from 'react';
import { publishRequirementSet } from '@/app/actions/requirements';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';

interface PublishRequirementSetButtonProps {
    normId: string;
    requirementSetId?: string;
    requirementSetDbId?: string;
    currentStatus?: string;
    requirementsCount?: number;
}

export function PublishRequirementSetButton({
    normId,
    requirementSetId,
    requirementSetDbId,
    currentStatus,
    requirementsCount
}: PublishRequirementSetButtonProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Don't show button if no requirement set or already published
    if (!requirementSetDbId || currentStatus === 'PUBLISHED') {
        return null;
    }

    // Don't show if no requirements
    if (!requirementsCount || requirementsCount === 0) {
        return null;
    }

    const handlePublish = async () => {
        const confirmMessage = `Опубликовать набор требований "${requirementSetId}"?\n\n` +
            `Требований: ${requirementsCount}\n\n` +
            `После публикации набор станет доступен для использования в Pre-Audit Setup.\n` +
            `Убедитесь что все требования проверены!`;

        if (!confirm(confirmMessage)) {
            return;
        }

        setLoading(true);
        const result = await publishRequirementSet(requirementSetDbId);
        setLoading(false);

        if (result.success) {
            alert(`✅ Набор требований "${requirementSetId}" опубликован!\n\nТеперь его можно использовать в Pre-Audit Setup.`);
            router.refresh();
        } else {
            alert(`❌ Ошибка публикации: ${result.error}`);
        }
    };

    return (
        <button
            onClick={handlePublish}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-lg hover:shadow-green-500/50"
            title={`Опубликовать набор требований (${requirementsCount} требований)`}
        >
            <CheckCircle2 className="h-4 w-4" />
            <span>{loading ? 'Публикация...' : 'Опубликовать набор'}</span>
        </button>
    );
}
