'use client';

import { useState, useEffect } from 'react';
import { Loader2, Atom, X, Activity, RefreshCw } from 'lucide-react';
import { getSignedReadUrl, notifyTextReady, processNormBatch } from "@/app/actions/universal-parser";
import { getNormById } from "@/app/actions/norm-library";
import { supabase } from "@/lib/supabaseClient";

export function UniversalParseButton({ normId }: { normId: string }) {
    const [open, setOpen] = useState(false);
    const [parsing, setParsing] = useState(false);
    const [progress, setProgress] = useState<string>('');
    const [isStuckAtStart, setIsStuckAtStart] = useState(false);

    // Check if ALREADY parsing on mount
    useEffect(() => {
        async function checkInitialStatus() {
            const res = await getNormById(normId);
            if (res.success && res.data && res.data.status === 'PARSING') {
                setParsing(true);
                setProgress(res.data.parsing_details || 'Восстановление сессии...');
                setOpen(true);
                // Also trigger stuck detection if it was already parsing
                const timer = setTimeout(() => setIsStuckAtStart(true), 8000);
                return () => clearTimeout(timer);
            }
        }
        checkInitialStatus();
    }, [normId]);

    // Poll status from DB during parsing
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (parsing && open) {
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
                        setOpen(false);

                        // Check if there was an error
                        if (norm.parsing_details && norm.parsing_details.includes('Ошибка')) {
                            alert('❌ ' + norm.parsing_details);
                        } else {
                            alert('✓ Парсинг завершен!');
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
    }, [parsing, normId, open, supabase]);

    const extractTextFromPdf = async (url: string) => {
        const pdfjs = await import('pdfjs-dist');
        // @ts-ignore
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

        const loadingTask = pdfjs.getDocument(url);
        const pdf = await loadingTask.promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            setProgress(`Извлечение текста: страница ${i} из ${pdf.numPages}...`);
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n';
        }
        return fullText;
    };

    const handleParse = async () => {
        setIsStuckAtStart(false);
        setParsing(true);
        setProgress('Инициализация...');
        console.log('[PARSE] Starting parsing process...');

        // Watchdog for extraction phase
        const watchdog = setTimeout(() => {
            setIsStuckAtStart(true);
        }, 60000); // 1 min for extraction

        try {
            // STEP 1: Get Signed URL (No CORS/Public issues)
            setProgress('Получение прав доступа к файлу...');
            console.log('[PARSE] Step 1: Getting signed URL for', normId);

            const urlResult = await getSignedReadUrl(normId);
            console.log('[PARSE] Signed URL result:', urlResult);

            if (!urlResult.success || !urlResult.url) {
                throw new Error(urlResult.error || 'Не удалось получить ссылку на файл');
            }

            const pdfUrl = urlResult.url;
            console.log('[PARSE] PDF URL obtained:', pdfUrl.substring(0, 100) + '...');

            // STEP 2: Client-side Extraction
            setProgress('Извлечение текста из PDF (в браузере)...');
            console.log('[PARSE] Step 2: Starting client-side PDF extraction...');

            const fullText = await extractTextFromPdf(pdfUrl);
            console.log('[PARSE] Extraction complete. Text length:', fullText.length);

            if (!fullText || fullText.length < 100) {
                throw new Error('Текст не извлечен или слишком короткий');
            }

            // STEP 3: Direct Upload to Supabase Storage (Bypass Vercel Payload Limit)
            setProgress('Загрузка текста в облако (напрямую)...');
            console.log('[PARSE] Step 3: Uploading text to Supabase Storage...');

            const tempPath = `temp-text/${normId}.txt`;
            const { error: uploadError } = await supabase.storage
                .from('norm-docs')
                .upload(tempPath, fullText, { contentType: 'text/plain', upsert: true });

            if (uploadError) {
                console.error('[PARSE] Upload error:', uploadError);
                throw new Error(`Ошибка загрузки: ${uploadError.message}`);
            }
            console.log('[PARSE] Text uploaded successfully to', tempPath);

            // STEP 4: Notify Server & Get Chunk Count
            console.log('[PARSE] Step 4: Notifying server...');
            const notifyRes = await notifyTextReady(normId, fullText.length);
            console.log('[PARSE] Notify result:', notifyRes);

            if (!notifyRes.success) {
                throw new Error(notifyRes.error);
            }

            const totalChunks = notifyRes.chunkCount || 1;
            setProgress(`Текст готов. Всего блоков: ${totalChunks}`);
            console.log('[PARSE] Total chunks to process:', totalChunks);

            // STEP 5: Batch Processing
            for (let i = 0; i < totalChunks; i++) {
                setProgress(`Обработка блока ${i + 1} из ${totalChunks}...`);
                console.log(`[PARSE] Processing batch ${i + 1}/${totalChunks}...`);

                const batchRes = await processNormBatch(normId, i, totalChunks);
                console.log(`[PARSE] Batch ${i + 1} result:`, batchRes);

                if (!batchRes.success) {
                    throw new Error(`Ошибка блока ${i + 1}: ${batchRes.error}`);
                }
            }

            clearTimeout(watchdog);
            console.log('[PARSE] ✓ Parsing completed successfully!');
            setProgress('Парсинг завершен!');
            setParsing(false);
            setOpen(false);
            alert('✓ Парсинг успешно завершен!');
            window.location.reload();

        } catch (e: any) {
            clearTimeout(watchdog);
            setParsing(false);
            console.error('[PARSE] ❌ Error:', e);
            console.error('[PARSE] Error stack:', e.stack);
            alert(`Ошибка процесса: ${e.message}`);
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
            <button
                onClick={() => setOpen(true)}
                className="text-xs bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-3 py-1.5 rounded transition-all flex items-center gap-2 shadow-lg"
            >
                <Atom className="w-3 h-3" />
                {parsing ? 'Парсинг выполняется...' : 'Универсал. парсинг (v2)'}
            </button>
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
