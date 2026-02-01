'use client';

import { useState } from 'react';
import { publishAllRequirementSets } from '@/app/actions/requirements';
import { useRouter } from 'next/navigation';

export function PublishAllButton() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handlePublishAll = async () => {
        if (!confirm('Опубликовать все DRAFT наборы требований?\n\nПосле публикации они станут доступны для использования в Pre-Audit Setup.')) {
            return;
        }

        setLoading(true);
        const result = await publishAllRequirementSets();
        setLoading(false);

        if (result.success) {
            alert(`✅ Успешно опубликовано ${result.count} наборов требований!`);
            router.refresh();
        } else {
            alert(`❌ Ошибка: ${result.error}`);
        }
    };

    return (
        <button
            onClick={handlePublishAll}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
            <span>📢</span>
            <span>{loading ? 'Публикация...' : 'Опубликовать все DRAFT'}</span>
        </button>
    );
}
