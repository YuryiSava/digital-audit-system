import { ReportHeader, ReportFooter } from '../shared/layout-elements';
import { BookOpen, Search, Eye, Camera, Activity, FileText } from 'lucide-react';

export function Doc02Technical({ checklist }: { checklist: any }) {
    const systemName = checklist.requirementSet?.system?.name || 'Система безопасности';

    return (
        <div className="bg-white p-12 min-h-[29.7cm] relative text-slate-900 font-sans leading-relaxed">
            <ReportHeader title="Технический отчет" docNumber="DOC-02" checklist={checklist} />

            <div className="space-y-10">
                {/* 1. Введение */}
                <section>
                    <div className="flex items-center gap-3 mb-4 border-b-2 border-slate-900 pb-2">
                        <span className="bg-slate-900 text-white w-6 h-6 flex items-center justify-center rounded text-sm font-bold">1</span>
                        <h2 className="text-lg font-bold uppercase tracking-wide">Введение</h2>
                    </div>
                    <p className="text-justify mb-4 text-sm text-slate-700">
                        Настоящий технический отчет содержит результаты аудита системы «{systemName}» на объекте
                        «{checklist.project?.name || 'Название объекта'}». Аудит проведен с целью оценки текущего технического состояния,
                        выявления несоответствий нормативным требованиям и разработки рекомендаций по их устранению.
                    </p>
                    <p className="text-justify text-sm text-slate-700">
                        Основанием для проведения работ является Договор на оказание услуг по аудиту инженерных систем.
                        Результаты, изложенные в данном отчете, действительны на дату проведения инспекции ({new Date(checklist.createdAt).toLocaleDateString()}).
                    </p>
                </section>

                {/* 2. Нормативная база */}
                <section>
                    <div className="flex items-center gap-3 mb-4 border-b-2 border-slate-900 pb-2">
                        <span className="bg-slate-900 text-white w-6 h-6 flex items-center justify-center rounded text-sm font-bold">2</span>
                        <h2 className="text-lg font-bold uppercase tracking-wide">Нормативная база</h2>
                    </div>
                    <p className="mb-4 text-sm text-slate-600 italic">
                        Аудит проводился на соответствие требованиям следующих нормативно-технических документов (НТД), привязанных к проверенным требованиям:
                    </p>

                    {(() => {
                        const norms = new Map();
                        if (checklist.results) {
                            checklist.results.forEach((r: any) => {
                                if (r.requirement?.normSource) {
                                    const ns = r.requirement.normSource;
                                    if (!norms.has(ns.id)) norms.set(ns.id, ns);
                                }
                            });
                        }
                        const normList = Array.from(norms.values());

                        if (normList.length > 0) {
                            return (
                                <ul className="grid grid-cols-1 gap-2 text-sm">
                                    {normList.map((ns: any) => (
                                        <li key={ns.id} className="flex items-start gap-3 bg-slate-50 p-3 rounded border border-slate-100">
                                            <BookOpen className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                                            <div>
                                                <span className="font-bold block text-slate-800">{ns.code}</span>
                                                <span className="text-slate-600">{ns.title}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            );
                        }

                        return (
                            <ul className="grid grid-cols-1 gap-2 text-sm">
                                <li className="bg-slate-50 p-3 rounded border border-slate-100 text-slate-600">Технический регламент «Общие требования к пожарной безопасности» (РК)</li>
                                <li className="bg-slate-50 p-3 rounded border border-slate-100 text-slate-600">СН РК 2.02-01-2019 «Пожарная безопасность зданий и сооружений»</li>
                                <li className="bg-slate-50 p-3 rounded border border-slate-100 text-slate-600 italic text-xs mt-2">* Список сформирован автоматически (нет привязанных нормативов).</li>
                            </ul>
                        );
                    })()}
                </section>

                {/* 3. Методика */}
                <section>
                    <div className="flex items-center gap-3 mb-4 border-b-2 border-slate-900 pb-2">
                        <span className="bg-slate-900 text-white w-6 h-6 flex items-center justify-center rounded text-sm font-bold">3</span>
                        <h2 className="text-lg font-bold uppercase tracking-wide">Методика аудита</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="flex gap-4 items-start p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                            <Eye className="w-8 h-8 text-blue-600 shrink-0" />
                            <div>
                                <h4 className="font-bold text-sm mb-1">Визуальный осмотр</h4>
                                <p className="text-xs text-slate-600 leading-snug">Проверка целостности оборудования, качества монтажа, отсутствия коррозии и загрязнений.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 items-start p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                            <FileText className="w-8 h-8 text-indigo-600 shrink-0" />
                            <div>
                                <h4 className="font-bold text-sm mb-1">Анализ документации</h4>
                                <p className="text-xs text-slate-600 leading-snug">Проверка наличия проектной, исполнительной и эксплуатационной документации.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 items-start p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                            <Activity className="w-8 h-8 text-emerald-600 shrink-0" />
                            <div>
                                <h4 className="font-bold text-sm mb-1">Функциональные тесты</h4>
                                <p className="text-xs text-slate-600 leading-snug">Имитация сигналов тревоги/неисправности для проверки алгоритмов работы системы.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 items-start p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                            <Camera className="w-8 h-8 text-orange-600 shrink-0" />
                            <div>
                                <h4 className="font-bold text-sm mb-1">Спец-фотофиксация</h4>
                                <p className="text-xs text-slate-600 leading-snug">Документирование нарушений с наложением цифровых водяных знаков (GPS, Время, Пункт нормы).</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 4. Описание объекта */}
                <section>
                    <div className="flex items-center gap-3 mb-4 border-b-2 border-slate-900 pb-2">
                        <span className="bg-slate-900 text-white w-6 h-6 flex items-center justify-center rounded text-sm font-bold">4</span>
                        <h2 className="text-lg font-bold uppercase tracking-wide">Характеристика объекта</h2>
                    </div>
                    {checklist.facilityDescription ? (
                        <div className="text-justify whitespace-pre-line text-sm text-slate-700 bg-slate-50 p-6 rounded-lg border-l-4 border-slate-400">
                            {checklist.facilityDescription}
                        </div>
                    ) : (
                        <p className="italic text-slate-400 border border-dashed border-slate-300 p-4 rounded text-center text-sm">
                            [Описание объекта отсутствует. Пожалуйста, добавьте его в настройках отчета.]
                        </p>
                    )}
                </section>

                {/* 5. Заключение */}
                <section>
                    <div className="flex items-center gap-3 mb-4 border-b-2 border-slate-900 pb-2">
                        <span className="bg-slate-900 text-white w-6 h-6 flex items-center justify-center rounded text-sm font-bold">5</span>
                        <h2 className="text-lg font-bold uppercase tracking-wide">Заключение</h2>
                    </div>
                    <p className="text-justify mb-2 text-sm text-slate-700">
                        По результатам проведенного аудита выявлен ряд несоответствий требованиям нормативных документов.
                        Подробный перечень дефектов приведен в документе <b>DOC-03 «Реестр дефектов»</b>.
                        Фотоматериалы, подтверждающие нарушения, представлены в документе <b>DOC-06 «Фото-приложение»</b>.
                    </p>
                    <div className="mt-4 p-4 bg-blue-50 text-blue-900 text-sm font-medium rounded border border-blue-100">
                        Для приведения системы в работоспособное состояние и устранения рисков рекомендуется выполнить мероприятия, описанные в Плане корректирующих действий (DOC-07).
                    </div>
                </section>
            </div>

            <div className="mt-12 pt-8 border-t border-slate-300 break-inside-avoid">
                <div className="grid grid-cols-2 gap-16">
                    <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-12 border-b border-slate-300 pb-2">
                            Технический директор
                        </div>
                        <div className="text-xs text-slate-500">
                            / _________________ /
                        </div>
                    </div>
                    <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-12 border-b border-slate-300 pb-2">
                            Ведущий инженер
                        </div>
                        <div className="text-xs text-slate-500">
                            {checklist.auditorName} / _________________ /
                        </div>
                    </div>
                </div>
            </div>

            <ReportFooter />
        </div>
    );
}
