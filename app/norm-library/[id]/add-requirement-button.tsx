'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
import { addRequirement } from '@/app/actions/requirements';
import { useRouter } from 'next/navigation';

export function AddRequirementButton({
    normId,
    requirementSetId
}: {
    normId: string;
    requirementSetId?: string;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);

        const data = {
            normSourceId: normId,
            requirementSetId: requirementSetId || formData.get('requirementSetId') as string,
            systemId: formData.get('systemId') as string,
            clause: formData.get('clause') as string,
            requirementTextShort: formData.get('requirementTextShort') as string,
            requirementTextFull: formData.get('requirementTextFull') as string || undefined,
            checkMethod: formData.get('checkMethod') as string,
            mustCheck: formData.get('mustCheck') === 'on',
            tags: (formData.get('tags') as string || '').split(',').map(t => t.trim()).filter(Boolean)
        };

        const result = await addRequirement(data);

        if (result.success) {
            setIsOpen(false);
            router.refresh();
            (e.target as HTMLFormElement).reset();
        } else {
            alert(`Ошибка: ${result.error}`);
        }

        setIsSubmitting(false);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg transition-colors text-sm font-medium"
            >
                <Plus className="h-4 w-4" />
                Добавить требование
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">Добавить требование вручную</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Система *
                                    </label>
                                    <select
                                        name="systemId"
                                        required
                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="APS">APS - Автоматическая пожарная сигнализация</option>
                                        <option value="SOUE">SOUE - Система оповещения и управления эвакуацией</option>
                                        <option value="CCTV">CCTV - Видеонаблюдение</option>
                                        <option value="ACS">ACS - Контроль доступа</option>
                                        <option value="OS">OS - Охранная сигнализация</option>
                                        <option value="SCS">SCS - Структурированная кабельная система</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Пункт *
                                    </label>
                                    <input
                                        type="text"
                                        name="clause"
                                        required
                                        placeholder="5.2.1"
                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Краткое описание *
                                </label>
                                <input
                                    type="text"
                                    name="requirementTextShort"
                                    required
                                    placeholder="Краткая формулировка требования"
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Полное описание
                                </label>
                                <textarea
                                    name="requirementTextFull"
                                    rows={3}
                                    placeholder="Полный текст требования (опционально)"
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Метод проверки *
                                    </label>
                                    <select
                                        name="checkMethod"
                                        required
                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="visual">Визуальный осмотр</option>
                                        <option value="document">Проверка документации</option>
                                        <option value="test">Функциональное тестирование</option>
                                        <option value="measurement">Измерения</option>
                                        <option value="log">Анализ журналов</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Теги (через запятую)
                                    </label>
                                    <input
                                        type="text"
                                        name="tags"
                                        placeholder="автономный, АПС, техобслуживание"
                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="mustCheck"
                                    id="mustCheck"
                                    className="rounded border-white/10 bg-black/30 text-blue-500 focus:ring-2 focus:ring-blue-500"
                                />
                                <label htmlFor="mustCheck" className="text-sm text-gray-300">
                                    Обязательно проверять
                                </label>
                            </div>

                            {!requirementSetId && (
                                <input type="hidden" name="requirementSetId" value="fb6192a9-c88a-4d09-93b1-9e6ddf9dfec5" />
                            )}

                            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors"
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white rounded-lg transition-colors flex items-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>⏳ Добавление...</>
                                    ) : (
                                        <>
                                            <Plus className="h-4 w-4" />
                                            Добавить
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
