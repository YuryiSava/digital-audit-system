'use client';

import { useState, useEffect } from 'react';
import { Loader2, Sparkles, X, Settings2 } from 'lucide-react';
import { parseNormWithExternalGPT, checkExistingRequirements } from "@/app/actions/external-parser";
import { getSystemsList } from "@/app/actions/systems";

export function ParseButton({ normId }: { normId: string }) {
    const [open, setOpen] = useState(false);
    const [parsing, setParsing] = useState(false);
    const [systems, setSystems] = useState<any[]>([]);
    const [selectedSystem, setSelectedSystem] = useState<string>('APS');
    const [loadingSystems, setLoadingSystems] = useState(false);

    // Load systems when dialog opens
    useEffect(() => {
        if (open && systems.length === 0) {
            setLoadingSystems(true);
            getSystemsList().then(data => {
                setSystems(data);
                setLoadingSystems(false);
            });
        }
    }, [open, systems.length]);

    const handleParse = async () => {
        if (!selectedSystem) {
            alert('Пожалуйста, выберите инженерную систему!');
            return;
        }

        // Check for existing requirements
        const existingCheck = await checkExistingRequirements(normId);

        if (existingCheck.exists) {
            let confirmMessage = `⚠️ ВНИМАНИЕ!\n\nУ этого норматива уже есть ${existingCheck.count} требований.`;

            if (existingCheck.manualCount > 0) {
                confirmMessage += `\n\n🔴 ${existingCheck.manualCount} из них добавлены ВРУЧНУЮ и будут УДАЛЕНЫ!`;
            }

            confirmMessage += '\n\nПродолжить парсинг и заменить требования?';

            if (!confirm(confirmMessage)) {
                return;
            }
        }

        setParsing(true);
        try {
            console.log('Starting external GPT parser for normId:', normId, 'System:', selectedSystem);

            // Call the external GPT parser
            const res = await parseNormWithExternalGPT(normId, selectedSystem);

            if (res.success) {
                alert(`✓ Успешно извлечено ${res.count} требований с помощью GPT-4o-mini!`);
                setOpen(false);
                window.location.reload();
            } else {
                alert(`Ошибка парсинга: ${res.error}\n${res.details || ''}`);
            }
        } catch (e: any) {
            console.error('Parse error:', e);
            alert(`Unexpected error: ${e?.message || String(e)}`);
        } finally {
            setParsing(false);
        }
    };

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded transition-colors flex items-center gap-2"
            >
                <Sparkles className="w-3 h-3 text-purple-400" />
                Запустить AI Парсинг
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-sm text-white">
                <div className="flex justify-between items-center p-4 border-b border-slate-800">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Settings2 className="w-4 h-4 text-blue-400" />
                        Настройка парсинга
                    </h3>
                    <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                            К какой системе относится норматив?
                        </label>
                        {loadingSystems ? (
                            <div className="text-center py-4 text-slate-500 text-sm">
                                <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Загрузка систем...
                            </div>
                        ) : (
                            <select
                                value={selectedSystem}
                                onChange={(e) => setSelectedSystem(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                {systems.map(sys => (
                                    <option key={sys.id} value={sys.systemId}>
                                        {sys.systemId} - {sys.nameRu || sys.name}
                                    </option>
                                ))}
                            </select>
                        )}
                        <p className="text-xs text-slate-500 mt-2">
                            Все извлеченные требования будут привязаны к этой системе.
                        </p>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded text-xs text-blue-300">
                        <Sparkles className="w-3 h-3 inline mr-1" />
                        Используется <strong>GPT-4o-mini</strong> для интеллектуального извлечения структуры документа.
                    </div>
                </div>

                <div className="p-4 border-t border-slate-800 flex justify-end gap-2 bg-slate-950/30 rounded-b-xl">
                    <button
                        onClick={() => setOpen(false)}
                        className="px-3 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                        disabled={parsing}
                    >
                        Отмена
                    </button>
                    <button
                        onClick={handleParse}
                        disabled={parsing || loadingSystems}
                        className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded text-sm font-medium flex items-center gap-2 shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {parsing ? 'Обработка...' : 'Начать парсинг'}
                    </button>
                </div>
            </div>
        </div>
    );
}
