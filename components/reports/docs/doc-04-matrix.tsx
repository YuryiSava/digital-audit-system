import { CheckCircle2, XCircle, AlertCircle, MinusCircle, Eye, FileText, Activity, Camera } from 'lucide-react';
import { ReportHeader, ReportFooter } from '../shared/layout-elements';

export function Doc04Matrix({ checklist }: { checklist: any }) {
    const results = checklist.results || [];

    // Сортировка по пунктам (если есть clause), иначе как есть
    const sortedResults = [...results].sort((a: any, b: any) => {
        return (a.requirement.clause || '').localeCompare(b.requirement.clause || '', undefined, { numeric: true });
    });

    // Stats
    const total = sortedResults.length;
    const passed = sortedResults.filter((r: any) => r.status === 'OK').length;
    const failed = sortedResults.filter((r: any) => r.status === 'VIOLATION' || r.status === 'FAIL').length;
    const warned = sortedResults.filter((r: any) => r.status === 'WARNING').length;
    const na = sortedResults.filter((r: any) => r.status === 'NA').length;

    const getMethodIcon = (method: string) => {
        const m = method?.toLowerCase() || '';
        if (m.includes('visual')) return <Eye className="w-3 h-3" />;
        if (m.includes('doc')) return <FileText className="w-3 h-3" />;
        if (m.includes('test') || m.includes('func')) return <Activity className="w-3 h-3" />;
        return <Eye className="w-3 h-3" />;
    };

    return (
        <div className="bg-white p-12 min-h-[29.7cm] relative text-slate-900 font-sans text-xs">
            <ReportHeader title="Матрица соответствия НТД" docNumber="DOC-04" checklist={checklist} />

            <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100 flex items-center justify-between">
                <div className="text-slate-500 font-medium">Статистика требований:</div>
                <div className="flex gap-6">
                    <div className="flex flex-col items-center">
                        <span className="text-xl font-bold text-slate-700">{total}</span>
                        <span className="text-[9px] uppercase tracking-wider text-slate-400">Total</span>
                    </div>
                    <div className="w-px h-8 bg-slate-200"></div>
                    <div className="flex flex-col items-center">
                        <span className="text-xl font-bold text-emerald-600">{passed}</span>
                        <span className="text-[9px] uppercase tracking-wider text-emerald-500">Pass</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-xl font-bold text-red-600">{failed}</span>
                        <span className="text-[9px] uppercase tracking-wider text-red-500">Fail</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-xl font-bold text-amber-600">{warned}</span>
                        <span className="text-[9px] uppercase tracking-wider text-amber-500">Warn</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-xl font-bold text-slate-400">{na}</span>
                        <span className="text-[9px] uppercase tracking-wider text-slate-400">N/A</span>
                    </div>
                </div>
            </div>

            <table className="w-full border-collapse border-b border-slate-200">
                <thead>
                    <tr className="bg-slate-800 text-white uppercase tracking-wider text-[9px] font-bold">
                        <th className="p-2 text-left w-20">Пункт</th>
                        <th className="p-2 text-left">Требование НТД</th>
                        <th className="p-2 text-center w-24">Метод</th>
                        <th className="p-2 text-center w-24">Результат</th>
                        <th className="p-2 text-left w-32">Примечание</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedResults.length > 0 ? (
                        sortedResults.map((item: any, index: number) => {
                            let statusIcon = <MinusCircle className="w-3 h-3 text-slate-400" />;
                            let statusText = "INIT";
                            let rowClass = "bg-white hover:bg-slate-50";
                            let statusBadgeVal = "text-slate-400 border-slate-200 bg-slate-50";

                            if (item.status === 'OK') {
                                statusIcon = <CheckCircle2 className="w-3 h-3" />;
                                statusText = "PASS";
                                statusBadgeVal = "text-emerald-700 border-emerald-200 bg-emerald-50";
                            } else if (item.status === 'VIOLATION' || item.status === 'FAIL') {
                                statusIcon = <XCircle className="w-3 h-3" />;
                                statusText = "FAIL";
                                rowClass = "bg-red-50/30 hover:bg-red-50/50";
                                statusBadgeVal = "text-red-700 border-red-200 bg-red-100";
                            } else if (item.status === 'WARNING') {
                                statusIcon = <AlertCircle className="w-3 h-3" />;
                                statusText = "WARN";
                                rowClass = "bg-amber-50/30 hover:bg-amber-50/50";
                                statusBadgeVal = "text-amber-700 border-amber-200 bg-amber-100";
                            } else if (item.status === 'NA') {
                                statusText = "N/A";
                                statusBadgeVal = "text-slate-400 border-slate-200 bg-slate-50";
                            }

                            return (
                                <tr key={item.id} className={`break-inside-avoid border-x border-slate-200 border-b border-slate-100 ${rowClass}`}>
                                    <td className="p-2 font-mono font-bold text-slate-600 align-top text-[10px] border-r border-slate-100">
                                        <div className="text-[9px] text-slate-400 font-sans mb-0.5">{item.requirement.normSource?.code}</div>
                                        {item.requirement.clause}
                                    </td>
                                    <td className="p-2 align-top border-r border-slate-100">
                                        <div className="leading-snug">{item.requirement.requirementTextShort}</div>
                                    </td>
                                    <td className="p-2 align-top text-center text-slate-400 border-r border-slate-100">
                                        <div className="inline-flex items-center gap-1 text-[9px] uppercase border border-slate-200 rounded px-1.5 py-0.5 bg-white">
                                            {getMethodIcon(item.requirement.checkMethod)}
                                            {item.requirement.checkMethod ? item.requirement.checkMethod.slice(0, 4) : 'VISU'}
                                        </div>
                                    </td>
                                    <td className="p-2 text-center align-top border-r border-slate-100">
                                        <div className={`inline-flex items-center justify-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-bold uppercase w-16 ${statusBadgeVal}`}>
                                            {statusIcon}
                                            {statusText}
                                        </div>
                                    </td>
                                    <td className="p-2 align-top text-slate-500 italic text-[10px]">
                                        {item.photos && item.photos.length > 0 ? (
                                            <span className="flex items-center gap-1 text-slate-600 not-italic font-medium">
                                                <Camera className="w-3 h-3" /> Фото ({item.photos.length})
                                            </span>
                                        ) : (
                                            (item.comment || '')
                                        )}
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-400">Данные отсутствуют</td>
                        </tr>
                    )}
                </tbody>
            </table>

            <ReportFooter />
        </div>
    );
}
