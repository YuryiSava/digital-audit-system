'use client';

import { useState, useEffect } from 'react';
import { getRawFragments } from '@/app/actions/get-raw-fragments';
import { updateFragmentStatus as updateFragmentStatusAction } from '@/app/actions/update-fragment-status';
import { convertFragmentsToRequirements } from '@/app/actions/convert-fragments';
import { deleteRawFragments } from '@/app/actions/delete-raw-fragments';
import { Check, X, ArrowRight, Trash2 } from 'lucide-react';

interface RawFragment {
    id: string;
    fragmentId: string;
    sourceSection: string | null;
    sourceClause: string | null;
    rawText: string;
    detectedModality: string | null;
    detectedConditions: string[] | null;
    detectedParameters: any;
    predictedRequirementType: string | null;
    confidenceScore: number | null;
    status: string;
    createdAt: string;
}

const REQUIREMENT_TYPES: Record<string, string> = {
    'constructive': 'Конструктивное',
    'functional': 'Функциональное',
    'parameterized': 'Параметрическое',
    'operational': 'Эксплуатационное',
    'prohibitive': 'Запрет',
    'conditional': 'Условное',
    'base': 'Базовое',
    'undefined': 'Неопределено'
};

const STATUS_LABELS: Record<string, string> = {
    'PENDING': 'Ожидает',
    'APPROVED': 'Одобрено',
    'REJECTED': 'Отклонено',
    'PROCESSED': 'Обработано'
};

export default function RawFragmentsTab({ normSourceId }: { normSourceId: string }) {
    const [fragments, setFragments] = useState<RawFragment[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [converting, setConverting] = useState(false);

    useEffect(() => {
        loadFragments();
    }, [normSourceId]);

    async function loadFragments() {
        setLoading(true);
        const result = await getRawFragments(normSourceId);
        setFragments(result.fragments as RawFragment[]);
        setLoading(false);
    }

    async function updateFragmentStatus(fragmentId: string, newStatus: 'APPROVED' | 'REJECTED') {
        setUpdating(fragmentId);
        setFragments(prev => prev.map(f =>
            f.id === fragmentId ? { ...f, status: newStatus } : f
        ));

        const result = await updateFragmentStatusAction(fragmentId, newStatus, normSourceId);
        if (!result.success) {
            console.error('Failed to update status:', result.error);
            await loadFragments();
        }
        setUpdating(null);
    }

    async function handleConvertToRequirements() {
        if (!confirm(
            `Конвертировать ${approvedCount} одобренных фрагментов в требования?\n\n` +
            `⚠️ ВАЖНО: Новые требования будут ДОБАВЛЕНЫ к существующим.\n` +
            `Существующие требования НЕ будут удалены.`
        )) {
            return;
        }

        setConverting(true);
        const result = await convertFragmentsToRequirements(normSourceId);

        if (result.success) {
            alert(result.message || 'Требования успешно созданы!');
            await loadFragments();
        } else {
            alert(`Ошибка: ${result.error}`);
        }
        setConverting(false);
    }

    async function handleDeleteAll() {
        if (!confirm(`Удалить ВСЕ ${fragments.length} фрагментов этого норматива?\n\nЭто действие нельзя отменить!`)) {
            return;
        }

        setLoading(true);
        const result = await deleteRawFragments(normSourceId);

        if (result.success) {
            alert('Фрагменты удалены!');
            await loadFragments();
        } else {
            alert(`Ошибка: ${result.error}`);
        }
        setLoading(false);
    }

    if (loading) {
        return <div className="p-6 text-center text-gray-400">Загрузка фрагментов...</div>;
    }

    if (fragments.length === 0) {
        return (
            <div className="p-6 text-center text-gray-500">
                <p className="text-gray-400">Нет извлеченных фрагментов</p>
                <p className="text-sm mt-2 text-gray-600">Запустите универсальный парсинг</p>
            </div>
        );
    }

    const pendingCount = fragments.filter(f => f.status === 'PENDING').length;
    const approvedCount = fragments.filter(f => f.status === 'APPROVED').length;
    const rejectedCount = fragments.filter(f => f.status === 'REJECTED').length;

    return (
        <div className="p-6 space-y-4">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-white">Сырые фрагменты ({fragments.length})</h3>
                <div className="flex gap-4 items-center">
                    <div className="flex gap-4 text-sm">
                        <span className="text-yellow-400">Ожидают: {pendingCount}</span>
                        <span className="text-green-400">Одобрено: {approvedCount}</span>
                        <span className="text-red-400">Отклонено: {rejectedCount}</span>
                    </div>
                    <button
                        onClick={handleDeleteAll}
                        className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition text-sm font-medium"
                    >
                        <Trash2 className="h-4 w-4" />
                        Удалить все
                    </button>
                    {approvedCount > 0 && (
                        <button
                            onClick={handleConvertToRequirements}
                            disabled={converting}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded transition text-sm font-medium"
                        >
                            <ArrowRight className="h-4 w-4" />
                            {converting ? 'Конвертирую...' : `Конвертировать (${approvedCount})`}
                        </button>
                    )}
                </div>
            </div>

            <div className="space-y-3">
                {fragments.map((fragment, index) => (
                    <div
                        key={fragment.id}
                        className={`border rounded-lg p-4 transition ${fragment.status === 'APPROVED' ? 'bg-green-500/10 border-green-500/30' :
                            fragment.status === 'REJECTED' ? 'bg-red-500/10 border-red-500/30' :
                                fragment.status === 'PROCESSED' ? 'bg-blue-500/10 border-blue-500/30' :
                                    'bg-white/5 border-white/10 hover:bg-white/10'
                            }`}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex gap-3 items-center">
                                <span className="text-sm font-mono text-gray-400">#{index + 1}</span>
                                {fragment.sourceClause && (
                                    <span className="text-sm font-semibold text-blue-400">
                                        {fragment.sourceClause}
                                    </span>
                                )}
                                {fragment.sourceSection && (
                                    <span className="text-xs text-gray-500">{fragment.sourceSection}</span>
                                )}
                            </div>
                            <div className="flex gap-2 items-center">
                                {fragment.confidenceScore && (
                                    <span className={`text-xs px-2 py-1 rounded font-medium ${fragment.confidenceScore >= 0.8 ? 'bg-green-500/20 text-green-400' :
                                        fragment.confidenceScore >= 0.6 ? 'bg-yellow-500/20 text-yellow-400' :
                                            'bg-red-500/20 text-red-400'
                                        }`}>
                                        {(fragment.confidenceScore * 100).toFixed(0)}%
                                    </span>
                                )}
                                <span className={`text-xs px-2 py-1 rounded ${fragment.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' :
                                    fragment.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' :
                                        fragment.status === 'PROCESSED' ? 'bg-blue-500/20 text-blue-400' :
                                            'bg-gray-700 text-gray-300'
                                    }`}>
                                    {STATUS_LABELS[fragment.status] || fragment.status}
                                </span>
                            </div>
                        </div>

                        <div className="mb-3">
                            <p className="text-sm text-gray-300 leading-relaxed">{fragment.rawText}</p>
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs mb-3">
                            {fragment.detectedModality && (
                                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                                    {fragment.detectedModality}
                                </span>
                            )}
                            {fragment.predictedRequirementType && (
                                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded">
                                    {REQUIREMENT_TYPES[fragment.predictedRequirementType] || fragment.predictedRequirementType}
                                </span>
                            )}
                            {fragment.detectedConditions && fragment.detectedConditions.length > 0 && (
                                <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded">
                                    {fragment.detectedConditions.length} условий
                                </span>
                            )}
                        </div>

                        {fragment.status === 'PENDING' && (
                            <div className="flex gap-2 pt-2 border-t border-white/10">
                                <button
                                    onClick={() => updateFragmentStatus(fragment.id, 'APPROVED')}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition text-sm"
                                >
                                    <Check className="h-4 w-4" />
                                    Одобрить
                                </button>
                                <button
                                    onClick={() => updateFragmentStatus(fragment.id, 'REJECTED')}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition text-sm"
                                >
                                    <X className="h-4 w-4" />
                                    Отклонить
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
