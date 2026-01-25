import { ClipboardList, AlertTriangle, CheckCircle2, User, Calendar, Target } from 'lucide-react';
import { ReportHeader, ReportFooter } from '../shared/layout-elements';

export function Doc07CAPA({ checklist }: { checklist: any }) {
    const results = checklist.results || [];

    // Select items that are not OK (WARNING or VIOLATION/FAIL)
    const defects = results.filter((r: any) =>
        r.status !== 'OK' && r.status !== 'NA' && r.status !== 'NOT_CHECKED'
    );

    const criticalCount = defects.filter((d: any) => d.status === 'VIOLATION' || d.status === 'FAIL').length;
    const warningCount = defects.filter((d: any) => d.status === 'WARNING').length;

    return (
        <div className="bg-white p-12 min-h-[29.7cm] relative text-slate-900 font-sans text-xs">
            <ReportHeader title="План корректирующих мероприятий (CAPA)" docNumber="DOC-07" checklist={checklist} />

            <div className="mb-8 bg-slate-50 p-6 rounded-xl border border-slate-100 grid grid-cols-2 gap-y-6 gap-x-12">
                <div>
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">
                        <Target className="w-3 h-3" /> Цель документа
                    </div>
                    <div className="text-sm text-slate-700 leading-snug">
                        Снижение рисков эксплуатации системы и устранение выявленных нарушения.
                    </div>
                </div>
                <div>
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">
                        <Calendar className="w-3 h-3" /> Контрольный срок
                    </div>
                    <div className="font-bold text-sm text-slate-800">
                        {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()} (Рекомендуемый)
                    </div>
                </div>
                <div>
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">
                        <ClipboardList className="w-3 h-3" /> Объем работ
                    </div>
                    <div className="flex gap-4 text-sm font-bold">
                        <span className="text-slate-900">{defects.length} Задач</span>
                        <span className="text-slate-300">|</span>
                        <span className="text-red-600">{criticalCount} Критических</span>
                    </div>
                </div>
                <div>
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">
                        <User className="w-3 h-3" /> Ответственный за контроль
                    </div>
                    <div className="font-bold text-sm text-slate-800">
                        Технический директор
                    </div>
                </div>
            </div>

            <table className="w-full border-collapse border border-slate-200">
                <thead>
                    <tr className="bg-slate-800 text-white uppercase tracking-wider text-[9px] font-bold">
                        <th className="p-2 text-center w-8 border-r border-slate-700">№</th>
                        <th className="p-2 text-left w-64 border-r border-slate-700">Основание (Дефект)</th>
                        <th className="p-2 text-left border-r border-slate-700">Мероприятие (Action Plan)</th>
                        <th className="p-2 text-center w-24 border-r border-slate-700">Приоритет</th>
                        <th className="p-2 text-center w-32 border-r border-slate-700">Ресурс / Срок</th>
                        <th className="p-2 text-center w-20">Статус</th>
                    </tr>
                </thead>
                <tbody>
                    {defects.length > 0 ? (
                        defects.map((item: any, idx: number) => {
                            const isCritical = item.status === 'VIOLATION' || item.status === 'FAIL';
                            return (
                                <tr key={item.id} className="break-inside-avoid border-b border-slate-100 hover:bg-slate-50">
                                    <td className="p-2 text-center text-slate-400 font-bold border-r border-slate-100 align-top">
                                        {idx + 1}
                                    </td>
                                    <td className="p-2 align-top border-r border-slate-100">
                                        <div className="font-bold text-[10px] mb-1">
                                            <span className="text-slate-500 font-normal mr-1">{item.requirement.normSource?.code}</span>
                                            {item.requirement.clause}
                                        </div>
                                        <div className="mb-2 text-slate-600 leading-snug">{item.requirement.requirementTextShort}</div>
                                        {item.comment && (
                                            <div className="text-[9px] text-slate-500 italic bg-white p-1 rounded border border-slate-200">
                                                "{item.comment}"
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-2 align-top bg-yellow-50/10 border-r border-slate-100">
                                        <div className="text-slate-700 font-medium text-[11px]">
                                            {isCritical
                                                ? 'Провести ремонтно-восстановительные работы.'
                                                : 'Выполнить техническое обслуживание компонента.'}
                                        </div>
                                    </td>
                                    <td className="p-2 text-center align-top border-r border-slate-100">
                                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase ${isCritical ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                                            }`}>
                                            {isCritical ? 'Высокий' : 'Средний'}
                                        </span>
                                    </td>
                                    <td className="p-2 text-center align-top text-[10px] border-r border-slate-100">
                                        <div className="font-bold text-slate-700">Подрядчик</div>
                                        <div className="text-slate-400 mt-1">~ 30 дней</div>
                                    </td>
                                    <td className="p-2 text-center align-top">
                                        <div className="w-4 h-4 border-2 border-slate-300 rounded mx-auto mt-1"></div>
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan={6} className="p-12 text-center text-slate-400 italic">
                                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                Несоответствий не выявлено.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <div className="mt-12 grid grid-cols-2 gap-16 break-inside-avoid">
                <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-12 border-b border-slate-300 pb-2">
                        План разработал
                    </div>
                    <div className="text-sm font-bold text-slate-800 mb-1">
                        {checklist.auditorName || '_________________'}
                    </div>
                </div>
                <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-12 border-b border-slate-300 pb-2">
                        План утвердил
                    </div>
                    <div className="text-sm font-bold text-slate-800 mb-1">
                        _________________
                    </div>
                </div>
            </div>

            <ReportFooter />
        </div>
    );
}
