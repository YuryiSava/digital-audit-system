'use client';

import { CheckCircle2, AlertCircle, AlertTriangle, Minus, Printer } from 'lucide-react';
import { Button } from '@/components/ui/simple-ui';

export function ReportView({ checklist }: { checklist: any }) {
    const results = checklist.results || [];
    const violations = results.filter((r: any) => r.status === 'VIOLATION');
    const warnings = results.filter((r: any) => r.status === 'WARNING');
    const okItems = results.filter((r: any) => r.status === 'OK');
    const naItems = results.filter((r: any) => r.status === 'NA');

    const total = results.length;
    const score = total > 0 ? Math.round((okItems.length / (total - naItems.length)) * 100) : 0;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-gray-50 text-black p-8 print:p-0 print:bg-white">
            {/* Toolbar - hidden in print */}
            <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center print:hidden">
                <Button variant="ghost" className="text-gray-600" onClick={() => window.history.back()}>
                    &larr; Назад
                </Button>
                <Button onClick={handlePrint} className="flex gap-2 bg-blue-600 text-white hover:bg-blue-700">
                    <Printer className="w-4 h-4" />
                    Печать / PDF
                </Button>
            </div>

            <div className="max-w-4xl mx-auto bg-white shadow-xl print:shadow-none p-12 min-h-[29.7cm] print:min-h-0 relative">

                {/* Header */}
                <header className="border-b-2 border-slate-800 pb-6 mb-8 flex justify-between items-baseline">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">Отчет по аудиту</h1>
                        <p className="text-lg text-slate-600 font-medium">{checklist.requirementSet?.system?.name}</p>
                    </div>
                    <div className="text-right text-sm text-slate-500">
                        <p>ID: {checklist.id.slice(0, 8)}</p>
                        <p>{new Date().toLocaleDateString()}</p>
                    </div>
                </header>

                {/* Project Info */}
                <section className="mb-12 grid grid-cols-2 gap-8 text-sm">
                    <div>
                        <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Проект</h3>
                        <div className="font-semibold text-lg">{checklist.project?.name || 'Без названия'}</div>
                        <div className="text-slate-600">{checklist.project?.address || 'Адрес не указан'}</div>
                    </div>
                    <div>
                        <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Аудитор</h3>
                        <div className="font-semibold text-lg">{checklist.auditorName || 'Не указан'}</div>
                        <div className="text-slate-600">Дата завершения: {checklist.updatedAt ? new Date(checklist.updatedAt).toLocaleDateString() : 'В процессе'}</div>
                    </div>
                </section>

                {/* Executive Summary */}
                <section className="mb-12 bg-slate-50 p-6 rounded-lg border border-slate-100 break-inside-avoid">
                    <h2 className="text-lg font-bold text-slate-900 mb-4 border-b pb-2">Резюме</h2>

                    <div className="space-y-6">
                        <div>
                            <h4 className="font-semibold text-slate-700 mb-1">Общие выводы</h4>
                            <p className="text-slate-600 whitespace-pre-wrap">{checklist.summary || 'Нет данных'}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-semibold text-red-700 mb-1">Риски</h4>
                                <p className="text-slate-600 whitespace-pre-wrap">{checklist.risks || 'Нет выявленных рисков'}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-blue-700 mb-1">Рекомендации</h4>
                                <p className="text-slate-600 whitespace-pre-wrap">{checklist.recommendations || 'Нет рекомендаций'}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Score & Stats */}
                <section className="mb-12 flex items-center justify-around border-y border-slate-100 py-8 break-inside-avoid">
                    <div className="text-center">
                        <div className="text-4xl font-bold text-slate-900 mb-1">{score}%</div>
                        <div className="text-xs uppercase text-slate-400 font-bold tracking-wider">Рейтинг</div>
                    </div>
                    <div className="h-12 w-px bg-slate-200"></div>
                    <div className="text-center">
                        <div className="text-4xl font-bold text-red-500 mb-1">{violations.length}</div>
                        <div className="text-xs uppercase text-slate-400 font-bold tracking-wider">Нарушений</div>
                    </div>
                    <div className="h-12 w-px bg-slate-200"></div>
                    <div className="text-center">
                        <div className="text-4xl font-bold text-yellow-500 mb-1">{warnings.length}</div>
                        <div className="text-xs uppercase text-slate-400 font-bold tracking-wider">Замечаний</div>
                    </div>
                    <div className="h-12 w-px bg-slate-200"></div>
                    <div className="text-center">
                        <div className="text-4xl font-bold text-green-500 mb-1">{okItems.length}</div>
                        <div className="text-xs uppercase text-slate-400 font-bold tracking-wider">Соответствий</div>
                    </div>
                </section>

                {/* Violations Detail */}
                {(violations.length > 0 || warnings.length > 0) && (
                    <section className="mb-12">
                        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <AlertCircle className="w-6 h-6 text-red-500" />
                            Детализация нарушений
                        </h2>
                        <div className="space-y-6">
                            {[...violations, ...warnings].map((item: any) => (
                                <div key={item.id} className="break-inside-avoid border rounded-lg p-5 border-l-4 shadow-sm relative overflow-hidden bg-white"
                                    style={{ borderLeftColor: item.status === 'VIOLATION' ? '#ef4444' : '#eab308' }}>
                                    <div className="flex justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-sm text-slate-700">
                                                {item.requirement.clause}
                                            </span>
                                            <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded text-white ${item.status === 'VIOLATION' ? 'bg-red-500' : 'bg-yellow-500'}`}>
                                                {item.status === 'VIOLATION' ? 'Нарушение' : 'Замечание'}
                                            </span>
                                        </div>
                                    </div>

                                    <p className="text-slate-800 font-medium mb-3">
                                        {item.requirement.requirementTextShort}
                                    </p>

                                    {item.comment && (
                                        <div className="bg-slate-50 p-3 rounded text-sm text-slate-600 mb-3 italic border border-slate-100">
                                            "{item.comment}"
                                        </div>
                                    )}

                                    {item.photos && item.photos.length > 0 && (
                                        <div className="flex gap-4 mt-4 overflow-x-auto pb-2">
                                            {item.photos.map((photo: string, idx: number) => (
                                                <div key={idx} className="relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden border border-slate-200">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={photo} className="w-full h-full object-cover" alt="Evidence" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Full Audit Table (Summary) */}
                <section className="break-before-page">
                    <h2 className="text-xl font-bold text-slate-900 mb-6">Полный протокол</h2>
                    <table className="w-full text-sm text-left border-collapse">
                        <thead>
                            <tr className="border-b-2 border-slate-200 text-slate-500">
                                <th className="py-2 w-16">Пункт</th>
                                <th className="py-2">Требование</th>
                                <th className="py-2 w-24 text-center">Статус</th>
                            </tr>
                        </thead>
                        <tbody className="text-slate-700">
                            {results.map((item: any) => (
                                <tr key={item.id} className="border-b border-slate-100">
                                    <td className="py-3 font-mono text-xs">{item.requirement.clause}</td>
                                    <td className="py-3 pr-4">
                                        <div className="line-clamp-2">{item.requirement.requirementTextShort}</div>
                                    </td>
                                    <td className="py-3 text-center font-medium">
                                        {item.status === 'OK' && <span className="text-green-600">OK</span>}
                                        {item.status === 'VIOLATION' && <span className="text-red-500">FAIL</span>}
                                        {item.status === 'WARNING' && <span className="text-yellow-500">WARN</span>}
                                        {item.status === 'NA' && <span className="text-gray-400">N/A</span>}
                                        {item.status === 'NOT_CHECKED' && <span className="text-gray-300">-</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                <footer className="mt-12 pt-6 border-t border-slate-200 text-center text-xs text-slate-400">
                    Сформировано автоматически системой Digital Audit • {new Date().getFullYear()}
                </footer>

            </div>
        </div>
    );
}
