import { Share2, CheckSquare, Square, CheckCircle2, XCircle, User, Calendar, Settings, Activity } from 'lucide-react';
import { ReportHeader, ReportFooter } from '../shared/layout-elements';

export function Doc05Protocols({ checklist }: { checklist: any }) {
    const results = checklist.results || [];
    const testedItems = results.filter((r: any) => r.status !== 'NOT_CHECKED' && r.status !== 'NA');

    const passedCount = testedItems.filter((r: any) => r.status === 'OK').length;
    const failedCount = testedItems.filter((r: any) => r.status !== 'OK').length;

    return (
        <div className="bg-white p-12 min-h-[29.7cm] relative text-slate-900 font-sans text-xs">
            <ReportHeader title="Протокол испытаний" docNumber="DOC-05" checklist={checklist} />

            {/* Header Info Block */}
            <div className="mb-8 bg-slate-50 p-6 rounded-xl border border-slate-100 grid grid-cols-2 gap-y-6 gap-x-12">
                <div>
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">
                        <Settings className="w-3 h-3" /> Объект испытаний
                    </div>
                    <div className="font-bold text-sm text-slate-800">
                        {checklist.requirementSet?.system?.name || 'Система'}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                        Комплексные функциональные испытания
                    </div>
                </div>
                <div>
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">
                        <Calendar className="w-3 h-3" /> Дата проведения
                    </div>
                    <div className="font-bold text-sm text-slate-800">
                        {new Date(checklist.createdAt).toLocaleDateString()}
                    </div>
                </div>
                <div>
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">
                        <User className="w-3 h-3" /> Испытания провел
                    </div>
                    <div className="font-bold text-sm text-slate-800">
                        {checklist.auditorName || 'Инженер-аудитор'}
                    </div>
                </div>
                <div>
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">
                        <Activity className="w-3 h-3" /> Результат
                    </div>
                    <div className="flex gap-3 text-sm font-bold">
                        <span className="text-emerald-600">{passedCount} Годен</span>
                        <span className="text-slate-300">|</span>
                        <span className="text-red-600">{failedCount} Отказ</span>
                    </div>
                </div>
            </div>

            <h3 className="text-sm font-bold uppercase text-slate-500 tracking-wider mb-4 border-b border-slate-200 pb-2">
                Результаты функциональных проверок
            </h3>

            <table className="w-full border-collapse border border-slate-200">
                <thead>
                    <tr className="bg-slate-800 text-white uppercase tracking-wider text-[9px] font-bold">
                        <th className="p-2 text-center w-10 border-r border-slate-700">№</th>
                        <th className="p-2 text-left w-20 border-r border-slate-700">Код</th>
                        <th className="p-2 text-left border-r border-slate-700">Наименование проверки / Требование</th>
                        <th className="p-2 text-center w-28 border-r border-slate-700">Результат</th>
                        <th className="p-2 text-left w-32">Подпись</th>
                    </tr>
                </thead>
                <tbody>
                    {testedItems.length > 0 ? (
                        testedItems.map((item: any, idx: number) => {
                            const passed = item.status === 'OK';
                            return (
                                <tr key={item.id} className="break-inside-avoid border-b border-slate-100 hover:bg-slate-50">
                                    <td className="p-2 text-center text-slate-400 font-bold border-r border-slate-100">
                                        {idx + 1}
                                    </td>
                                    <td className="p-2 border-r border-slate-100 font-mono text-[10px] font-semibold text-slate-600">
                                        <div className="text-[8px] text-slate-400 text-right leading-tight mb-0.5">{item.requirement.normSource?.code}</div>
                                        {item.requirement.clause}
                                    </td>
                                    <td className="p-2 border-r border-slate-100">
                                        <div className="text-[11px] mb-1">{item.requirement.requirementTextShort}</div>
                                        <div className="text-[9px] text-slate-400 italic">
                                            Метод: {item.requirement.checkMethod || 'Функц. тест'}
                                        </div>
                                    </td>
                                    <td className="p-2 text-center border-r border-slate-100 align-middle">
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase w-24 justify-center ${passed
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                            : 'bg-red-50 text-red-700 border border-red-100'
                                            }`}>
                                            {passed ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                            {passed ? 'Годен' : 'Отказ'}
                                        </div>
                                    </td>
                                    <td className="p-2 border-slate-100">
                                        {/* Место для подписи */}
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan={5} className="p-12 text-center text-slate-400 italic">
                                Функциональные испытания не проводились или не зафиксированы.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <div className="mt-12 grid grid-cols-2 gap-16 break-inside-avoid">
                <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-12 border-b border-slate-300 pb-2">
                        Испытания провел (Инженер)
                    </div>
                    <div className="text-sm font-bold text-slate-800 mb-1">
                        {checklist.auditorName || '_________________'}
                    </div>
                    <div className="text-xs text-slate-500">
                        {checklist.auditorTitle || 'Должность не указана'}
                    </div>
                </div>
                <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-12 border-b border-slate-300 pb-2">
                        С результатами ознакомлен (Заказчик)
                    </div>
                    <div className="text-sm font-bold text-slate-800 mb-1">
                        _________________
                    </div>
                    <div className="text-xs text-slate-500">
                        Представитель Заказчика
                    </div>
                </div>
            </div>

            <ReportFooter />
        </div>
    );
}
