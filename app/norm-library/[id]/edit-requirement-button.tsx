'use client';

import { useState } from 'react';
import { Pencil, X, Save, Loader2 } from 'lucide-react';
import { updateRequirement } from '@/app/actions/requirements';
import { getSystemsList } from '@/app/actions/systems';

interface EditRequirementButtonProps {
    requirement: {
        id: string;
        clause: string;
        systemId: string;
        requirementTextShort?: string;
        requirementTextFull?: string;
        checkMethod?: string;
        mustCheck?: boolean;
        tags?: string[];
    };
}

export function EditRequirementButton({ requirement }: EditRequirementButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [systems, setSystems] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        clause: requirement.clause || '',
        systemId: requirement.systemId || '',
        requirementTextShort: requirement.requirementTextShort || '',
        requirementTextFull: requirement.requirementTextFull || '',
        checkMethod: requirement.checkMethod || 'visual',
        mustCheck: requirement.mustCheck || false,
        tags: requirement.tags?.join(', ') || ''
    });

    const handleOpen = async () => {
        setIsOpen(true);
        // Load systems
        const systemsList = await getSystemsList();
        setSystems(systemsList);
    };

    const handleSave = async () => {
        setSaving(true);

        try {
            const result = await updateRequirement(requirement.id, {
                clause: formData.clause,
                systemId: formData.systemId,
                requirementTextShort: formData.requirementTextShort,
                requirementTextFull: formData.requirementTextFull,
                checkMethod: formData.checkMethod as any,
                mustCheck: formData.mustCheck,
                tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
            });

            if (result.success) {
                alert('✅ Требование обновлено!');
                setIsOpen(false);
                window.location.reload();
            } else {
                alert(`❌ Ошибка: ${result.error}`);
            }
        } catch (error: any) {
            alert(`❌ Ошибка: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={handleOpen}
                className="text-blue-400 hover:text-blue-300 transition-colors"
                title="Редактировать требование"
            >
                <Pencil className="h-4 w-4" />
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-3xl text-white max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-slate-800 sticky top-0 bg-slate-900">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Pencil className="w-4 h-4 text-blue-400" />
                        Редактирование требования
                    </h3>
                    <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <div className="p-6 space-y-4">

                    {/* Row 1: Clause & System */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                                Пункт документа
                            </label>
                            <input
                                type="text"
                                value={formData.clause}
                                onChange={e => setFormData({ ...formData, clause: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="5.2.1"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                                Система
                            </label>
                            <select
                                value={formData.systemId}
                                onChange={e => setFormData({ ...formData, systemId: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                {systems.map(sys => (
                                    <option key={sys.id} value={sys.systemId}>
                                        {sys.systemId} - {sys.nameRu || sys.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Row 2: Short Text */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                            Краткое описание
                        </label>
                        <textarea
                            value={formData.requirementTextShort}
                            onChange={e => setFormData({ ...formData, requirementTextShort: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            rows={3}
                            placeholder="Краткая формулировка требования..."
                        />
                    </div>

                    {/* Row 3: Full Text */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                            Полный текст (опционально)
                        </label>
                        <textarea
                            value={formData.requirementTextFull}
                            onChange={e => setFormData({ ...formData, requirementTextFull: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            rows={4}
                            placeholder="Полная формулировка из документа..."
                        />
                    </div>

                    {/* Row 4: Method & Must Check */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                                Метод проверки
                            </label>
                            <select
                                value={formData.checkMethod}
                                onChange={e => setFormData({ ...formData, checkMethod: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="visual">Визуальный осмотр</option>
                                <option value="document">Проверка документации</option>
                                <option value="test">Функциональное тестирование</option>
                                <option value="measurement">Измерения</option>
                                <option value="log">Анализ журналов</option>
                            </select>
                        </div>

                        <div className="flex items-center">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.mustCheck}
                                    onChange={e => setFormData({ ...formData, mustCheck: e.target.checked })}
                                    className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-slate-300">Обязательная проверка</span>
                            </label>
                        </div>
                    </div>

                    {/* Row 5: Tags */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                            Теги (через запятую)
                        </label>
                        <input
                            type="text"
                            value={formData.tags}
                            onChange={e => setFormData({ ...formData, tags: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="АПС, электропитание, резерв"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Для cross-system требований добавьте коды систем: APS, SOUE, FIRE_POWER и т.д.
                        </p>
                    </div>


                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800 flex justify-end gap-2 bg-slate-950/30 rounded-b-xl">
                    <button
                        onClick={() => setIsOpen(false)}
                        className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                        disabled={saving}
                    >
                        Отмена
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-medium flex items-center gap-2 shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? 'Сохранение...' : 'Сохранить'}
                    </button>
                </div>
            </div>
        </div>
    );
}
