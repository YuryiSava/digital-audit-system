'use client';

import { useState } from 'react';
import {
    FileText,
    Loader2,
    AlertTriangle,
    CheckCircle2,
    TrendingUp,
    ArrowRight,
    Building2,
    ShieldAlert,
    X
} from 'lucide-react';
import { Button } from '@/components/ui/simple-ui';
import { generateExecutiveSummary } from '@/app/actions/report-generation';

interface ExecutiveSummaryDialogProps {
    projectId: string;
    projectName: string;
}

export function ExecutiveSummaryDialog({ projectId, projectName }: ExecutiveSummaryDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    async function handleGenerate() {
        setLoading(true);
        setError(null);
        try {
            const res = await generateExecutiveSummary(projectId);
            if (res.success) {
                setSummary(res.data);
            } else {
                setError(res.error || 'Произошла ошибка при анализе');
            }
        } catch (err: any) {
            setError(err.message || 'Не удалось сформировать отчет');
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <Button
                variant="outline"
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 border-blue-500/30 bg-blue-500/5 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/50"
            >
                <FileText className="w-4 h-4" />
                <span>Сводный отчет (AI)</span>
            </Button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-[#1e1e24] border border-white/10 rounded-xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[85vh] my-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/10 flex-none bg-[#1e1e24] rounded-t-xl z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/20">
                                    <TrendingUp className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Executive Summary</h2>
                                    <p className="text-xs text-slate-500 font-normal">{projectName}</p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors p-1">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-[#1e1e24]">
                            {!summary && !loading && (
                                <div className="py-12 text-center space-y-4">
                                    <div className="h-16 w-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto border border-white/5">
                                        <ShieldAlert className="w-8 h-8 text-slate-600" />
                                    </div>
                                    <div className="max-w-xs mx-auto">
                                        <h3 className="font-semibold text-slate-300">Сформировать резюме</h3>
                                        <p className="text-sm text-slate-500 mt-1">
                                            ИИ проанализирует данные всех систем объекта и подготовит отчет для руководства.
                                        </p>
                                    </div>
                                    <Button onClick={handleGenerate} className="bg-blue-600 hover:bg-blue-500">
                                        Сформировать отчет
                                    </Button>
                                    {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
                                </div>
                            )}

                            {loading && (
                                <div className="py-20 text-center flex flex-col items-center gap-4">
                                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                                    <div className="space-y-1">
                                        <p className="text-lg font-medium text-blue-400 animate-pulse">Анализируем системы...</p>
                                        <p className="text-sm text-slate-500">Это может занять до 15 секунд</p>
                                    </div>
                                </div>
                            )}

                            {summary && !loading && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {/* Overview Section */}
                                    <section className="space-y-3">
                                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                            <Building2 className="w-4 h-4" />
                                            Общая картина
                                        </h4>
                                        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-5 text-lg leading-relaxed text-slate-200 italic">
                                            "{summary.overview}"
                                        </div>
                                    </section>

                                    {/* Critical Issues */}
                                    <section className="space-y-4">
                                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                                            Критические узлы
                                        </h4>
                                        <div className="grid gap-3">
                                            {summary.criticalIssues.map((issue: string, idx: number) => (
                                                <div key={idx} className="flex gap-4 p-4 rounded-xl bg-slate-900 border border-white/5 items-start group hover:border-amber-500/30 transition-colors">
                                                    <div className="mt-1 w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 text-xs font-bold border border-amber-500/20">
                                                        {idx + 1}
                                                    </div>
                                                    <p className="text-slate-300 text-sm flex-1 leading-relaxed">{issue}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    {/* Strategic Steps */}
                                    <section className="space-y-4">
                                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            Стратегические рекомендации
                                        </h4>
                                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl overflow-hidden">
                                            {summary.strategicSteps.map((step: string, idx: number) => (
                                                <div key={idx} className="flex items-center gap-4 px-6 py-4 border-b border-emerald-500/10 last:border-0 hover:bg-emerald-500/10 transition-colors">
                                                    <ArrowRight className="w-4 h-4 text-emerald-500 shrink-0" />
                                                    <span className="text-slate-200 text-sm font-medium">{step}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    <div className="pt-6 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-600 uppercase tracking-tighter">
                                        <span>Сформировано ИИ «Antigravity»</span>
                                        <Button variant="ghost" onClick={() => setSummary(null)} className="h-6 text-[10px] hover:text-white">
                                            Перегенерировать
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-white/10 flex justify-end flex-none bg-[#1e1e24] rounded-b-xl">
                            <Button variant="ghost" onClick={() => setIsOpen(false)}>
                                Закрыть
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
