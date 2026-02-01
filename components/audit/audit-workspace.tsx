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
    photos?: string[];
    isMultiple?: boolean;
    totalCount?: number;
    failCount?: number;
    inspectionMethod?: string;
}

interface AuditWorkspaceProps {
    initialResults: AuditResult[];
    checklist: any;
    mode?: 'field' | 'desktop'; // NEW: Distinguish between Field App and Desktop
}

export function AuditWorkspace({ initialResults, checklist, mode = 'desktop' }: AuditWorkspaceProps) {
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

    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    const validateChecklist = () => {
        const errors: string[] = [];
        results.forEach(r => {
            if (r.status === 'VIOLATION' || r.status === 'WARNING') {
                // 1. Комментарий обязателен для любого нарушения
                if (!r.comment) {
                    errors.push(`Пункт ${r.requirement.clause}: отсутствует описание дефекта`);
                }
                // 2. Фото обязательно ТОЛЬКО для визуального метода
                if (r.requirement.checkMethod === 'visual' && (!r.photos || r.photos.length === 0)) {
                    errors.push(`Пункт ${r.requirement.clause}: визуальное нарушение требует фотофиксации`);
                }
            }
            // 3. Проверка количественных данных для массовых объектов
            if (r.isMultiple && (!r.totalCount || r.totalCount === 0)) {
                errors.push(`Пункт ${r.requirement.clause}: не указано количество осмотренных объектов`);
            }
        });
        return errors;
    };

    const handleFinishAudit = () => {
        const errors = validateChecklist();
        setValidationErrors(errors);
        setIsFinishModalOpen(true);
    };

    const submitFinishAudit = async () => {
        const errors = validateChecklist();
        if (errors.length > 0) {
            alert('Пожалуйста, исправьте ошибки валидации перед завершением.');
            return;
        }

        await updateChecklistDetails(checklist.id, {
            ...finalData,
            status: 'COMPLETED'
        });
        setIsFinishModalOpen(false);

        // Different redirects for Field App vs Desktop
        if (mode === 'field') {
            // Field App: Go back to project list with success message
            window.location.href = `/field/projects/${checklist.projectId}?completed=true`;
        } else {
            // Desktop: Go to report page
            window.location.href = `/audit/${checklist.id}/report`;
        }
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
                    projectId={checklist.projectId}
                />
            </div>

            {/* Finish Modal */}
            {isFinishModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">Завершение аудита</h2>
                            <Button variant="ghost" size="sm" onClick={() => setIsFinishModalOpen(false)}><X className="h-4 w-4" /></Button>
                        </div>

                        {validationErrors.length > 0 ? (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 space-y-3">
                                <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                                    <AlertTriangle className="h-4 w-4" />
                                    <span>Внимание! Требуется доработка ({validationErrors.length})</span>
                                </div>
                                <ul className="text-[11px] text-red-300/80 space-y-1 ml-6 list-disc">
                                    {validationErrors.map((err, i) => (
                                        <li key={i}>{err}</li>
                                    ))}
                                </ul>
                                <p className="text-[10px] text-red-400/50 italic pt-2 border-t border-red-500/10">
                                    * Фото обязательно только для визуальных методов проверки.
                                </p>
                            </div>
                        ) : (
                            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                <span className="text-sm text-green-400">Данные прошли проверку. Можно завершать.</span>
                            </div>
                        )}

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
                            {/* ... rest of inputs ... */}
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-400 mb-1 block text-xs uppercase tracking-wider">Основные риски</label>
                                    <Textarea
                                        className="bg-black/40 min-h-[60px]"
                                        placeholder="Какие угрозы несет объект..."
                                        value={finalData.risks}
                                        onChange={e => setFinalData({ ...finalData, risks: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-400 mb-1 block text-xs uppercase tracking-wider">Рекомендации</label>
                                    <Textarea
                                        className="bg-black/40 min-h-[60px]"
                                        placeholder="Что нужно исправить в первую очередь..."
                                        value={finalData.recommendations}
                                        onChange={e => setFinalData({ ...finalData, recommendations: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-400 mb-1 block text-xs uppercase tracking-wider">Аудитор</label>
                                <Input
                                    className="bg-black/40"
                                    placeholder="Ваше ФИО для подписи отчета"
                                    value={finalData.auditorName}
                                    onChange={e => setFinalData({ ...finalData, auditorName: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 pt-2">
                            <Button
                                onClick={submitFinishAudit}
                                disabled={validationErrors.length > 0}
                                className={`w-full ${validationErrors.length > 0 ? 'bg-slate-800 text-slate-500' : 'bg-green-600 hover:bg-green-500'}`}
                            >
                                {validationErrors.length > 0 ? 'Исправьте ошибки для сохранения' : 'Сохранить и Создать Отчет'}
                            </Button>
                            <Button variant="ghost" onClick={() => setIsFinishModalOpen(false)}>Продолжить аудит</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
