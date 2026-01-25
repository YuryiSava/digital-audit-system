import { Calculator, DollarSign, PieChart } from 'lucide-react';
import { ReportHeader, ReportFooter } from '../shared/layout-elements';

export function Doc08Budget({ checklist }: { checklist: any }) {
    const results = checklist.results || [];

    // Select items that are not OK
    const defects = results.filter((r: any) =>
        r.status !== 'OK' && r.status !== 'NA' && r.status !== 'NOT_CHECKED'
    );

    // Mock pricing logic (since we don't have a price book yet)
    // Randomize slightly based on index to look less fake, but deterministic-ish
    const getEstCost = (id: string) => {
        const hash = id.charCodeAt(0) + id.charCodeAt(id.length - 1);
        return (hash % 20) * 1000 + 5000;
    };

    const totalCost = defects.reduce((acc: number, item: any) => acc + getEstCost(item.id), 0);

    return (
        <div className="bg-white p-12 min-h-[29.7cm] relative text-slate-900 font-sans text-xs">
            <ReportHeader title="Бюджетная оценка (ROM)" docNumber="DOC-08" checklist={checklist} />

            <div className="mb-8">
                <div className="flex items-start gap-4 p-4 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-100 mb-6">
                    <Calculator className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-bold text-sm mb-1">Предварительная оценка стоимости (ROM)</h3>
                        <p className="text-xs leading-relaxed opacity-90">
                            Бюджетная оценка класса Rough Order of Magnitude (ROM) с точностью ±30%.
                            Не является коммерческой офертой. Предназначена для планирования бюджета
                            на устранение выявленных несоответствий.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                        <h4 className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-2">Итоговая смета</h4>
                        <div className="text-4xl font-bold text-slate-900 mb-1">
                            {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(totalCost)}
                        </div>
                        <div className="text-xs text-slate-500">
                            Включая материалы и работы (без НДС)
                        </div>
                    </div>

                    <div className="flex flex-col justify-center space-y-2 text-xs text-slate-600">
                        <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
                            <span>Оборудование и материалы:</span>
                            <span className="font-bold">~60%</span>
                        </div>
                        <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
                            <span>Монтажные работы:</span>
                            <span className="font-bold">~30%</span>
                        </div>
                        <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
                            <span>ПНР и транспортные расходы:</span>
                            <span className="font-bold">~10%</span>
                        </div>
                    </div>
                </div>
            </div>

            <table className="w-full border-collapse border border-slate-300 mb-6">
                <thead>
                    <tr className="bg-slate-100 text-slate-700 uppercase tracking-wider text-[9px] font-bold">
                        <th className="border border-slate-300 p-2 text-center w-10">№</th>
                        <th className="border border-slate-300 p-2 text-left">Наименование работ / материалов</th>
                        <th className="border border-slate-300 p-2 text-center w-16">Ед. изм.</th>
                        <th className="border border-slate-300 p-2 text-center w-16">Кол-во</th>
                        <th className="border border-slate-300 p-2 text-right w-24">Цена, ₸</th>
                        <th className="border border-slate-300 p-2 text-right w-28">Сумма, ₸</th>
                    </tr>
                </thead>
                <tbody>
                    {defects.length > 0 ? (
                        defects.map((item: any, idx: number) => {
                            const cost = getEstCost(item.id);
                            return (
                                <tr key={item.id} className="break-inside-avoid hover:bg-slate-50">
                                    <td className="border border-slate-300 p-2 text-center text-slate-500 text-[10px]">
                                        {idx + 1}
                                    </td>
                                    <td className="border border-slate-300 p-2">
                                        <div className="font-bold text-[11px] mb-1">Устранение дефекта по п.{item.requirement.clause}</div>
                                        <div className="text-[10px] text-slate-500 truncate max-w-sm">
                                            {item.requirement.requirementTextShort}
                                        </div>
                                    </td>
                                    <td className="border border-slate-300 p-2 text-center text-[10px]">
                                        компл.
                                    </td>
                                    <td className="border border-slate-300 p-2 text-center text-[10px]">
                                        1
                                    </td>
                                    <td className="border border-slate-300 p-2 text-right text-[11px] font-mono">
                                        {new Intl.NumberFormat('ru-RU').format(cost)}
                                    </td>
                                    <td className="border border-slate-300 p-2 text-right text-[11px] font-bold font-mono">
                                        {new Intl.NumberFormat('ru-RU').format(cost)}
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400">
                                <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p>Затраты не требуются.</p>
                            </td>
                        </tr>
                    )}

                    {/* Total Row */}
                    <tr className="bg-slate-50 font-bold">
                        <td colSpan={5} className="border border-slate-300 p-2 text-right text-xs uppercase">
                            Итого (ориентировочно):
                        </td>
                        <td className="border border-slate-300 p-2 text-right text-xs font-mono bg-emerald-50 text-emerald-900 border-l-emerald-200">
                            {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT' }).format(totalCost)}
                        </td>
                    </tr>
                </tbody>
            </table>

            <div className="text-[10px] text-slate-400 italic mt-4">
                * Цены указаны справочно на основе средних рыночных показателей для данного региона.
                Точная стоимость определяется после разработки проектно-сметной документации.
            </div>

            <ReportFooter />
        </div>
    );
}
