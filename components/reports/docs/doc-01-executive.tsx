import { AlertCircle, AlertTriangle, CheckCircle2, TrendingUp, ShieldAlert, Award, Calendar, MapPin, User } from 'lucide-react';
import { ReportHeader, ReportFooter } from '../shared/layout-elements';

export function Doc01Executive({ checklist }: { checklist: any }) {
    const results = checklist.results || [];
    const defects = results.filter((r: any) => r.status === 'DEFECT');
    const okItems = results.filter((r: any) => r.status === 'OK');
    const naItems = results.filter((r: any) => r.status === 'NA');

    const totalActive = results.length - naItems.length;
    const score = totalActive > 0 ? Math.round((okItems.length / totalActive) * 100) : 0;

    // Оценка состояния (A/B/C/D)
    let grade = 'D';
    let gradeColor = 'text-red-600';
    let gradeBg = 'bg-red-50 border-red-100';
    let verdictText = 'Неудовлетворительно';

    if (score >= 90) {
        grade = 'A';
        gradeColor = 'text-emerald-600';
        gradeBg = 'bg-emerald-50 border-emerald-100';
        verdictText = 'Отлично';
    }
    else if (score >= 75) {
        grade = 'B';
        gradeColor = 'text-blue-600';
        gradeBg = 'bg-blue-50 border-blue-100';
        verdictText = 'Хорошо';
    }
    else if (score >= 50) {
        grade = 'C';
        gradeColor = 'text-orange-600';
        gradeBg = 'bg-orange-50 border-orange-100';
        verdictText = 'Удовлетворительно';
    }

    const topDefects = defects.slice(0, 5);

    return (
        <div className="bg-white p-12 min-h-[29.7cm] relative text-slate-900 font-sans">
            <ReportHeader title="Резюме для руководства" docNumber="DOC-01" checklist={checklist} />

            <div className="mb-12 border-b-2 border-slate-900 pb-8">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Объект аудита</div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-2">
                            {checklist.project?.name || 'Название объекта'}
                        </h2>
                        <div className="flex items-center gap-2 text-lg text-slate-600">
                            <MapPin className="w-5 h-5 text-slate-400" />
                            {checklist.project?.address || 'Адрес не указан'}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="bg-slate-100 px-4 py-2 rounded-lg inline-block">
                            <div className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Рейтинг безопасности</div>
                            <div className={`text-5xl font-black ${gradeColor} leading-none`}>{score}/100</div>
                            <div className="text-xs text-slate-400 mt-1 font-bold uppercase">{verdictText}</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-8 mt-8 pt-6 border-t border-slate-100">
                    <div>
                        <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Заказчик</div>
                        <div className="font-bold text-slate-900">{checklist.project?.customer || '—'}</div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Аудитор</div>
                        <div className="font-bold text-slate-900">{checklist.auditorName || '—'}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Статус отчета</div>
                        <div className="font-bold text-slate-900 bg-emerald-50 text-emerald-900 px-2 py-0.5 rounded inline-block text-[10px] uppercase border border-emerald-200">
                            Final Report / Verified
                        </div>
                    </div>
                </div>
            </div>

            <section className="mb-10">
                <div className="mb-10">
                    <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-900 mb-4 border-b-2 border-slate-900 pb-2">
                        <TrendingUp className="w-4 h-4" /> Заключение аудитора
                    </h3>
                    <div className="prose prose-sm max-w-none text-slate-700 text-justify leading-relaxed font-serif bg-slate-50/50 p-6 rounded-xl border border-slate-100">
                        {checklist.summary
                            ? checklist.summary.split('\n').map((line: string, i: number) => <p key={i} className="mb-3 last:mb-0">{line}</p>)
                            : <p className="italic text-slate-400 text-center py-4">Заключение не сформировано. Воспользуйтесь AI-генератором в настройках.</p>
                        }
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                    <div className="flex flex-col h-full">
                        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-700 mb-3 border-b border-red-100 pb-2">
                            <ShieldAlert className="w-4 h-4" /> Ключевые риски
                        </h3>
                        <div className="bg-red-50 rounded-xl p-5 border border-red-100 flex-1">
                            {checklist.risks
                                ? <ul className="list-disc list-outside ml-4 space-y-3 text-xs text-slate-800 font-medium leading-relaxed">
                                    {checklist.risks.split('\n').filter((l: string) => l.trim()).map((line: string, i: number) => <li key={i} className="pl-1 text-red-950">{line.replace(/^-\s*/, '')}</li>)}
                                </ul>
                                : <div className="text-center text-red-300 text-xs italic py-10">Данные не заполнены</div>
                            }
                        </div>
                    </div>
                    <div className="flex flex-col h-full">
                        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 mb-3 border-b border-blue-100 pb-2">
                            <CheckCircle2 className="w-4 h-4" /> Рекомендации
                        </h3>
                        <div className="bg-blue-50 rounded-xl p-5 border border-blue-100 flex-1">
                            {checklist.recommendations
                                ? <ul className="list-disc list-outside ml-4 space-y-3 text-xs text-slate-800 font-medium leading-relaxed">
                                    {checklist.recommendations.split('\n').filter((l: string) => l.trim()).map((line: string, i: number) => <li key={i} className="pl-1 text-blue-950">{line.replace(/^-\s*/, '')}</li>)}
                                </ul>
                                : <div className="text-center text-blue-300 text-xs italic py-10">Данные не заполнены</div>
                            }
                        </div>
                    </div>
                </div>
            </section>

            {topDefects.length > 0 && (
                <section className="mb-0 break-inside-avoid">
                    <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-900 mb-6 border-b-2 border-slate-900 pb-2">
                        <AlertTriangle className="w-4 h-4 text-red-600" /> Критические замечания (Топ-{topDefects.length})
                    </h3>

                    <div className="grid grid-cols-1 gap-4">
                        {topDefects.map((item: any, idx: number) => (
                            <div key={idx} className="flex gap-4 p-4 bg-white border border-slate-200 rounded-lg shadow-sm items-start">
                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm mt-1">
                                    {idx + 1}
                                </div>
                                <div>
                                    <div className="font-bold text-slate-900 text-sm mb-1">
                                        {item.comment || "Описание дефекта не указано"}
                                    </div>
                                    <div className="text-[10px] text-slate-500 bg-slate-50 px-2 py-1 rounded inline-block mt-1 font-medium italic border border-slate-100">
                                        <span className="font-bold text-slate-700 mr-2">{item.requirement.clause}:</span>
                                        {item.requirement.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <div className="mt-auto pt-12 break-inside-avoid">
                <div className="grid grid-cols-2 gap-16">
                    <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-12 border-b border-slate-300 pb-2">
                            Аудит провел (Ведущий инженер)
                        </div>
                        <div className="font-serif italic text-xl mb-1 text-slate-800">
                            {checklist.auditorName || '_________________'}
                        </div>
                        <div className="text-xs text-slate-500">
                            {checklist.auditorTitle || 'Инженер-аудитор'}
                        </div>
                    </div>
                    <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-12 border-b border-slate-300 pb-2">
                            С резюме ознакомлен
                        </div>
                        <div className="font-serif italic text-xl mb-1 text-slate-800">
                            _________________
                        </div>
                        <div className="text-xs text-slate-500">
                            Signature / Date
                        </div>
                    </div>
                </div>
            </div>

            <ReportFooter />
        </div>
    );
}
