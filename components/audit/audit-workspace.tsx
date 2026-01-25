'use client';

import { useState, useMemo } from 'react';
import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertCircle, Check, X, AlertTriangle, Minus, MessageSquare, Camera } from 'lucide-react';
import { Button, Textarea, Input } from '@/components/ui/simple-ui';
import { saveAuditResult, updateChecklistDetails } from '@/app/actions/audit';
import { AuditExecutionList } from './audit-execution-list';

interface AuditResult {
    id: string;
    requirement: {
        id: string;
        clause: string;
        requirementTextShort: string;
        checkMethod: string;
        severityHint?: string;
    };
    status: string;
    comment?: string;
}

interface AuditWorkspaceProps {
    initialResults: AuditResult[];
    checklist: any;
}

export function AuditWorkspace({ initialResults, checklist }: AuditWorkspaceProps) {
    const [results, setResults] = useState(initialResults);
    const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
    const [tempComment, setTempComment] = useState('');

    const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
    const [finalData, setFinalData] = useState({
        summary: checklist.summary || '',
        risks: checklist.risks || '',
        recommendations: checklist.recommendations || '',
        auditorName: checklist.auditorName || ''
    });

    // Вычисляем статистику "на лету" из стейта
    const stats = useMemo(() => {
        const total = results.length;
        const checked = results.filter(r => r.status !== 'NOT_CHECKED').length;
        const violations = results.filter(r => r.status === 'VIOLATION').length;
        const ok = results.filter(r => r.status === 'OK').length;
        const progress = total > 0 ? Math.round((checked / total) * 100) : 0;
        return { total, checked, violations, ok, progress };
    }, [results]);

    const handleFinishAudit = async () => {
        setIsFinishModalOpen(true);
    };

    const submitFinishAudit = async () => {
        // Here we could set status to COMPLETED
        await updateChecklistDetails(checklist.id, {
            ...finalData,
            status: 'COMPLETED'
        });
        setIsFinishModalOpen(false);
        // Navigate to report or refresh
        window.location.href = `/audit/${checklist.id}/report`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 pb-20">
            {/* Sticky Header */}
            <header className="border-b border-white/10 bg-black/80 backdrop-blur-md sticky top-0 z-20">
                <div className="container mx-auto px-4 md:px-6 py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

                        {/* Title & Back */}
                        <div className="flex items-center gap-4">
                            <Link
                                href={`/projects/${checklist.projectId}`}
                                className="p-2 -ml-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                            <div>
                                <h1 className="text-lg font-bold text-white flex items-center gap-2">
                                    {checklist.requirementSet?.system?.name}
                                    <span className="text-xs font-normal text-gray-400 bg-white/10 px-2 py-0.5 rounded">
                                        v{checklist.requirementSet?.version}
                                    </span>
                                </h1>
                                <p className="text-xs text-blue-300">
                                    ID: {checklist.requirementSet?.requirementSetId}
                                </p>
                            </div>
                        </div>

                        {/* Actions & Stats */}
                        <div className="flex items-center gap-6">
                            {/* Stats Bar (Live update) */}
                            <div className="hidden md:flex items-center gap-6 text-sm">
                                <div className="flex flex-col items-end">
                                    <div className="flex items-center gap-2 font-medium text-gray-300">
                                        <span>Прогресс</span>
                                        <span className="text-white">{stats.progress}%</span>
                                    </div>
                                    <div className="w-32 h-1.5 bg-gray-700 rounded-full mt-1 overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 transition-all duration-500"
                                            style={{ width: `${stats.progress}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 border-l border-white/10 pl-6">
                                    <div className="flex items-center gap-2 text-green-400">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span>{stats.ok} OK</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-red-400">
                                        <AlertCircle className="h-4 w-4" />
                                        <span>{stats.violations} Нарушений</span>
                                    </div>
                                </div>
                            </div>

                            <Button onClick={handleFinishAudit} className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20">
                                Завершить
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* List */}
            <div className="container mx-auto px-4 md:px-6 py-6 max-w-4xl space-y-4">
                <AuditExecutionList
                    results={results}
                    onResultsChange={setResults}
                    checklistId={checklist.id}
                />
            </div>

            {/* Finish Modal */}
            {isFinishModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
                        <h2 className="text-xl font-bold text-white">Завершение аудита</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-400 mb-1 block">Краткое резюме</label>
                                <Textarea
                                    className="bg-black/40 min-h-[80px]"
                                    placeholder="Общий вывод по аудиту..."
                                    value={finalData.summary}
                                    onChange={e => setFinalData({ ...finalData, summary: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-400 mb-1 block">Основные риски</label>
                                <Textarea
                                    className="bg-black/40 min-h-[80px]"
                                    placeholder="Выявленные риски..."
                                    value={finalData.risks}
                                    onChange={e => setFinalData({ ...finalData, risks: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-400 mb-1 block">Рекомендации</label>
                                <Textarea
                                    className="bg-black/40 min-h-[80px]"
                                    placeholder="Рекомендации к устранению..."
                                    value={finalData.recommendations}
                                    onChange={e => setFinalData({ ...finalData, recommendations: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-400 mb-1 block">Аудитор</label>
                                <Input
                                    className="bg-black/40"
                                    placeholder="ФИО аудитора"
                                    value={finalData.auditorName}
                                    onChange={e => setFinalData({ ...finalData, auditorName: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="ghost" onClick={() => setIsFinishModalOpen(false)}>Отмена</Button>
                            <Button onClick={submitFinishAudit} className="bg-green-600 hover:bg-green-500">Сохранить и Создать Отчет</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
