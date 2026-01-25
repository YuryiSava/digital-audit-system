import { AlertTriangle, XCircle, MapPin } from 'lucide-react';
import { ReportHeader, ReportFooter } from '../shared/layout-elements';

export function Doc03Defects({ checklist }: { checklist: any }) {
    const results = checklist.results || [];

    // Filter only violations and warnings
    const defects = results.filter((r: any) => r.status === 'VIOLATION' || r.status === 'WARNING' || r.status === 'FAIL');

    // Sort: Violations first, then Warnings
    defects.sort((a: any, b: any) => {
        const severityScore = (status: string) => status === 'VIOLATION' || status === 'FAIL' ? 2 : 1;
        return severityScore(b.status) - severityScore(a.status);
    });

    return (
        <div className="bg-white p-12 min-h-[29.7cm] relative text-slate-900 font-sans text-xs">
            <ReportHeader title="Реестр дефектов" docNumber="DOC-03" checklist={checklist} />

            <div className="mb-6 flex justify-between items-end">
                <p className="text-slate-500 max-w-2xl">
                    Настоящий реестр содержит перечень выявленных несоответствий требованиям нормативно-технической документации.
                </p>
                <div className="text-right">
                    <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Всего дефектов:</span>
                    <span className="ml-2 text-xl font-bold">{defects.length}</span>
                </div>
            </div>

            <table className="w-full border-collapse border border-slate-200">
                <thead>
                    <tr className="bg-slate-800 text-white uppercase tracking-wider text-[9px] font-bold">
                        <th className="border border-slate-700 p-2 text-center w-8">№</th>
                        <th className="border border-slate-700 p-2 text-left w-28">Статус / Локация</th>
                        <th className="border border-slate-700 p-2 text-left">Описание несоответствия (Факт)</th>
                        <th className="border border-slate-700 p-2 text-left w-40">Требование НТД</th>
                        <th className="border border-slate-700 p-2 text-left w-32">Рекомендация</th>
                        <th className="border border-slate-700 p-2 text-center w-12">Фото</th>
                    </tr>
                </thead>
                <tbody>
                    {defects.length > 0 ? (
                        defects.map((item: any, idx: number) => {
                            const isCritical = item.status === 'VIOLATION' || item.status === 'FAIL';
                            const severityLabel = isCritical ? 'CRITICAL' : 'WARNING';
                            const severityClass = isCritical
                                ? 'bg-red-100 text-red-700 border-red-200'
                                : 'bg-orange-100 text-orange-700 border-orange-200';

                            return (
                                <tr key={item.id} className="break-inside-avoid border-b border-slate-200 hover:bg-slate-50">
                                    <td className="p-3 text-center font-bold text-slate-400 align-top border-r border-slate-200">
                                        {idx + 1}
                                    </td>
                                    <td className="p-3 align-top border-r border-slate-200">
                                        <div className={`text-[9px] font-bold uppercase px-2 py-1 rounded border w-fit mb-2 ${severityClass}`}>
                                            {severityLabel}
                                        </div>
                                        {/* Mock Location if not present in MVP yet */}
                                        <div className="flex items-start gap-1 text-[10px] text-slate-500">
                                            <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
                                            <span>
                                                {checklist.project?.name || 'Объект'}
                                                <br />
                                                <span className="opacity-70">Этаж 1, Пом. 101</span>
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-3 align-top border-r border-slate-200">
                                        <div className="mb-2 text-slate-900 font-medium text-sm">
                                            {item.comment || 'Описательная часть отсутствует'}
                                        </div>
                                        {isCritical && (
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-600 bg-red-50 p-1.5 rounded">
                                                <AlertTriangle className="w-3.5 h-3.5" />
                                                Значительный риск отказа системы
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-3 align-top border-r border-slate-200 text-slate-600 bg-slate-50/50">
                                        <div className="font-bold text-slate-700 mb-1 text-[10px]">
                                            {item.requirement.normSource?.code} {item.requirement.clause}
                                        </div>
                                        <div className="text-[10px] leading-snug">{item.requirement.requirementTextShort}</div>
                                    </td>
                                    <td className="p-3 align-top border-r border-slate-200 text-slate-600 italic text-[11px]">
                                        Привести в соответствие с требованиями проектной документации и нормами РК.
                                    </td>
                                    <td className="p-3 text-center align-top">
                                        {(item.photos && item.photos.length > 0) ? (
                                            <div className="w-8 h-8 rounded bg-slate-100 border border-slate-300 flex items-center justify-center mx-auto text-slate-500 font-bold text-[10px]">
                                                {item.photos.length}
                                            </div>
                                        ) : (
                                            <span className="text-slate-300 text-[10px]">—</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan={6} className="p-12 text-center text-slate-400 italic">
                                Дефектов не выявлено. Система находится в исправном состоянии.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <div className="mt-6 flex gap-6 text-[10px] text-slate-500 border-t pt-4">
                <div className="font-bold uppercase tracking-wider">Легенда:</div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-red-100 border border-red-200 rounded block"></span>
                    <b>Critical</b> — Нарушение влияет на работоспособность или безопасность
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-orange-100 border border-orange-200 rounded block"></span>
                    <b>Warning</b> — Незначительное отклонение или рекомендация
                </div>
            </div>

            <ReportFooter />
        </div>
    );
}
