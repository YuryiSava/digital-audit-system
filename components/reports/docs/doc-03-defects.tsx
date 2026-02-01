import { AlertTriangle, XCircle, MapPin } from 'lucide-react';
import { ReportHeader, ReportFooter } from '../shared/layout-elements';

export function Doc03Defects({ checklist }: { checklist: any }) {
    const results = checklist.results || [];

    // Filter defects: DEFECT, VIOLATION, and WARNING
    const defects = results.filter((r: any) => r.status === 'DEFECT' || r.status === 'VIOLATION' || r.status === 'WARNING');

    return (
        <div className="bg-white p-12 min-h-[29.7cm] relative text-slate-900 font-sans text-xs">
            <ReportHeader title="Реестр дефектов" docNumber="DOC-03" checklist={checklist} />

            <div className="mb-6 flex justify-between items-end">
                <p className="text-slate-500 max-w-2xl">
                    Настоящий реестр содержит исчерпывающий перечень выявленных несоответствий требованиям нормативно-технической документации Республики Казахстан и проектных решений.
                </p>
                <div className="text-right">
                    <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Выявлено дефектов:</span>
                    <span className="ml-2 text-xl font-bold">{defects.length}</span>
                </div>
            </div>

            <table className="w-full border-collapse border border-slate-200">
                <thead>
                    <tr className="bg-slate-950 text-white uppercase tracking-wider text-[9px] font-bold">
                        <th className="border border-slate-700 p-2 text-center w-8">№</th>
                        <th className="border border-slate-700 p-2 text-left w-28">Статус / Объект</th>
                        <th className="border border-slate-700 p-2 text-left">Описание несоответствия (Факт)</th>
                        <th className="border border-slate-700 p-2 text-left w-44">Требование НТД</th>
                        <th className="border border-slate-700 p-2 text-left w-32">Рекомендация</th>
                        <th className="border border-slate-700 p-2 text-center w-12">Фото</th>
                    </tr>
                </thead>
                <tbody>
                    {defects.length > 0 ? (
                        defects.map((item: any, idx: number) => {
                            return (
                                <tr key={item.id} className="break-inside-avoid border-b border-slate-200 hover:bg-slate-50">
                                    <td className="p-3 text-center font-bold text-slate-400 align-top border-r border-slate-200 bg-slate-50/30">
                                        {idx + 1}
                                    </td>
                                    <td className="p-3 align-top border-r border-slate-200 shadow-sm">
                                        <div className="text-[9px] font-bold uppercase px-2 py-1 rounded border w-fit mb-2 bg-red-50 text-red-700 border-red-200">
                                            ДЕФЕКТ
                                        </div>
                                        <div className="flex items-start gap-1 text-[9px] text-slate-500 leading-tight">
                                            <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
                                            <span>
                                                {checklist.project?.name || 'Объект'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-3 align-top border-r border-slate-200">
                                        <div className="mb-2 text-slate-900 font-bold text-[13px] leading-tight">
                                            {item.comment || 'Описание не заполнено инженером'}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-red-600 bg-red-50/50 p-1 rounded border border-red-100/50">
                                            <AlertTriangle className="w-3 h-3" />
                                            Требуется устранение
                                        </div>
                                    </td>
                                    <td className="p-3 align-top border-r border-slate-200 text-slate-600 bg-slate-50/50">
                                        <div className="font-bold text-slate-700 mb-1 text-[10px]">
                                            {item.requirement.normSource?.code} {item.requirement.clause}
                                        </div>
                                        <div className="text-[10px] leading-snug italic">{item.requirement.content}</div>
                                    </td>
                                    <td className="p-3 align-top border-r border-slate-200 text-slate-600 font-medium text-[10px] leading-relaxed">
                                        Привести в соответствие с НТД РК и требованиями завода-изготовителя.
                                    </td>
                                    <td className="p-3 text-center align-top bg-slate-50/20">
                                        {(item.photos && item.photos.length > 0) ? (
                                            <div className="w-7 h-7 rounded-sm bg-slate-900 text-white flex items-center justify-center mx-auto font-bold text-[10px] shadow-sm">
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
                            <td colSpan={6} className="p-16 text-center text-slate-400 italic">
                                В ходе аудита дефектов не выявлено. Система соответствует установленным нормам.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <div className="mt-8 p-4 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-600 leading-relaxed shadow-inner">
                <h4 className="font-bold uppercase mb-2 text-slate-800 tracking-wider">Пояснения к реестру:</h4>
                <p>Все выявленные дефекты подлежат обязательному устранению в сроки, установленные регламентом эксплуатации. Отсутствие фотографий по ряду пунктов не является основанием для игнорирования замечания, если оно зафиксировано аудитором в ходе визуального осмотра или инструментального контроля.</p>
            </div>

            <ReportFooter />
        </div>
    );
}
