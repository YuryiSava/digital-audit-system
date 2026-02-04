'use client';

import { useState, useEffect } from 'react';
import { Loader2, Atom, X, Activity, RefreshCw } from 'lucide-react';
import { runFullParsing } from "@/app/actions/universal-parser";
import { getNormById } from "@/app/actions/norm-library";
import { supabase } from "@/lib/supabaseClient";

export function UniversalParseButton({ normId }: { normId: string }) {
    const [open, setOpen] = useState(false);
    const [parsing, setParsing] = useState(false);
    const [isPolling, setIsPolling] = useState(false); // New state to prevent premature finishing
    const [progress, setProgress] = useState<string>('');
    const [isStuckAtStart, setIsStuckAtStart] = useState(false);

    // Check if ALREADY parsing on mount
    useEffect(() => {
        async function checkInitialStatus() {
            const res = await getNormById(normId);
            if (res.success && res.data && res.data.status === 'PARSING') {
                setParsing(true);
                setIsPolling(true); // Enable polling immediately if resuming
                setProgress(res.data.parsing_details || 'Восстановление сессии...');
                setOpen(true);

                const timer = setTimeout(() => setIsStuckAtStart(true), 8000);
                return () => clearTimeout(timer);
            }
        }
        checkInitialStatus();
    }, [normId]);

    // Poll status from DB during parsing
    useEffect(() => {
        let interval: NodeJS.Timeout;

        // Only poll if parsing AND polling is enabled
        if (parsing && open && isPolling) {
            // Immediate check
            const checkStatus = async () => {
                const { data: norm } = await supabase
                    .from('norm_sources')
                    .select('status, parsing_details')
                    .eq('id', normId)
                    .single();

                if (norm) {
                    if (norm.status === 'PARSING') {
                        // Update progress if available
                        if (norm.parsing_details) {
                            setProgress(norm.parsing_details);
                        }
                    } else {
                        // Finished or failed
                        setParsing(false);
                        setIsPolling(false);
                        setOpen(false);

                        // Check if there was an error
                        if (norm.parsing_details && norm.parsing_details.includes('Ошибка')) {
                            alert('❌ ' + norm.parsing_details);
                        } else {
                            alert('✓ Парсинг завершен! (по данным сервера)');
                        }

                        window.location.reload();
                    }
                }
            };

            // Check immediately
            checkStatus();

            // Then poll every 2 seconds
            interval = setInterval(checkStatus, 2000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [parsing, open, isPolling, normId, supabase]);

    const handleParse = async () => {
        setIsStuckAtStart(false);
        setParsing(true); // Shows the modal with spinner
        setProgress('Запуск полного цикла (v2.0 Script Revert)...');

        try {
            console.log('[PARSE] Calling Monolithic Server Action...');
            // Enable polling ensures we see "parsing_details" updates from the DB
            setIsPolling(true);

            // This is the SINGLE call that does everything (Download -> Extract -> Chunk -> AI -> Save)
            // It mimics the original Node.js script exactly.
            const result = await runFullParsing(normId);

            if (!result.success) {
                throw new Error(result.error);
            }

            setProgress('Готово!');
            alert(`✓ Парсинг завершен успешно!\nВсего фрагментов: ${result.count}`);
            window.location.reload();

        } catch (e: any) {
            console.error('[PARSE] ❌ Error:', e);
            alert(`Ошибка: ${e.message}`);
            // Keep modal open so user can see error
            setParsing(false);
        }
    };

    const handleResetStatus = async () => {
        if (confirm('Сбросить статус парсинга? Используйте это, только если процесс явно завис.')) {
            await supabase
                .from('norm_sources')
                .update({ status: 'DRAFT', parsing_details: null })
                .eq('id', normId);
            setParsing(false);
            setProgress('');
            window.location.reload();
        }
    };

    if (!open) {
        return (
            <div className="flex flex-col items-end">
                <button
                    onClick={() => setOpen(true)}
                    className="text-xs bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-3 py-1.5 rounded transition-all flex items-center gap-2 shadow-lg"
                >
                    <Atom className="w-3 h-3" />
                    {parsing ? 'Парсинг выполняется...' : 'Универсал. парсинг (v2)'}
                </button>
                <p className="text-[10px] text-amber-400/70 mt-1">
                    💡 Рекомендуется на локальной версии
                </p>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop with higher Z */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={() => !parsing && setOpen(false)}
            />

            <div className="relative bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md text-white animate-in zoom-in duration-200">
                <div className="flex justify-between items-center p-4 border-b border-slate-800">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Atom className="w-4 h-4 text-indigo-400" />
                        Универсальный парсер v2.0
                    </h3>
                    {!parsing && (
                        <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                <div className="p-4 space-y-4">
                    {parsing ? (
                        <div className="py-8 space-y-6 text-center">
                            <div className="relative inline-block">
                                <Activity className="w-12 h-12 text-indigo-500 animate-pulse mx-auto opacity-50" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-bold text-lg text-indigo-300">Парсинг в процессе</h4>
                                <p className="text-slate-400 text-sm italic font-mono">{progress}</p>
                            </div>

                            {isStuckAtStart && (
                                <div className="bg-red-500/10 border border-red-500/30 p-3 rounded text-xs text-red-300 animate-in fade-in">
                                    <p>Похоже, процесс прервался или затянулся.</p>
                                    <button
                                        onClick={handleResetStatus}
                                        className="mt-2 flex items-center gap-2 mx-auto text-white bg-red-600 px-3 py-1 rounded hover:bg-red-500 font-bold"
                                    >
                                        <RefreshCw className="w-3 h-3" /> Сбросить статус и закрыть
                                    </button>
                                </div>
                            )}

                            <div className="flex justify-center gap-4 text-[10px] text-slate-500">
                                <button onClick={handleResetStatus} className="hover:text-red-400 transition-colors">
                                    [ Принудительный сброс ]
                                </button>
                                <button onClick={() => setOpen(false)} className="hover:text-white transition-colors">
                                    [ Закрыть окно ]
                                </button>
                            </div>

                            <div className="bg-slate-950/50 rounded-lg p-3 text-[10px] text-slate-500 text-left border border-white/5">
                                <p>• Извлечение текста (OpenAI GPT-4o-mini)</p>
                                <p>• Очистка от двуязычного шума (RU/KZ)</p>
                                <p>• Сохранение в Raw Fragments</p>
                                <p className="mt-2 text-green-500/70">✓ Процесс идет в фоне. Можно закрыть окно и обновить страницу.</p>
                            </div>

                            <button
                                onClick={() => window.location.reload()}
                                className="mt-3 w-full bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded text-xs transition-colors"
                            >
                                Обновить страницу и проверить результат
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 p-4 rounded-lg">
                                <h4 className="font-semibold text-sm mb-2 text-indigo-300">Прямое извлечение норм</h4>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    ИИ проанализирует документ и найдет все пункты, содержащие требования, параметры и условия.
                                    Они попадут в промежуточный список для вашей проверки.
                                </p>
                            </div>

                            <div className="flex justify-between items-center text-xs text-slate-500 px-1 pt-2">
                                <span>Версия движка: 2.0.4 (Parallel)</span>
                                <button
                                    onClick={handleResetStatus}
                                    className="text-slate-600 hover:text-red-400 flex items-center gap-1 transition-colors"
                                >
                                    <RefreshCw className="w-3 h-3" /> Сбросить статус
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {!parsing && (
                    <div className="p-4 border-t border-slate-800 flex justify-end gap-2 bg-slate-950/30 rounded-b-xl">
                        <button
                            onClick={() => setOpen(false)}
                            className="px-3 py-2 text-sm text-slate-400 hover:text-white"
                        >
                            Отмена
                        </button>
                        <button
                            onClick={handleParse}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-sm font-medium flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                        >
                            <Atom className="w-4 h-4" />
                            Начать парсинг
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
