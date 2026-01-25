'use client';

import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { Button, Input, Label, Textarea } from '@/components/ui/simple-ui';
import { createRequirement, getNormSourcesListForSelect } from '@/app/actions/requirements';

interface CreateRequirementDialogProps {
    requirementSetId: string;
    systemId: string; // "APS"
}

export function CreateRequirementDialog({ requirementSetId, systemId }: CreateRequirementDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [norms, setNorms] = useState<any[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        normSourceId: '',
        clause: '',
        requirementTextShort: '',
        checkMethod: 'visual',
        severityHint: 'medium'
    });

    useEffect(() => {
        if (isOpen && norms.length === 0) {
            getNormSourcesListForSelect().then(data => {
                setNorms(data);
                if (data.length > 0) {
                    setFormData(prev => ({ ...prev, normSourceId: data[0].id }));
                }
            });
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const res = await createRequirement({
            requirementSetId,
            systemId,
            normSourceId: formData.normSourceId,
            clause: formData.clause,
            requirementTextShort: formData.requirementTextShort,
            checkMethod: formData.checkMethod,
            severityHint: formData.severityHint
        });

        if (res.success) {
            setIsOpen(false);
            setFormData({
                normSourceId: norms[0]?.id || '',
                clause: '',
                requirementTextShort: '',
                checkMethod: 'visual',
                severityHint: 'medium'
            });
        } else {
            // @ts-ignore
            setError(typeof res.error === 'string' ? res.error : 'Ошибка сохранения');
        }
        setLoading(false);
    };

    if (!isOpen) {
        return (
            <Button size="sm" onClick={() => setIsOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить требование
            </Button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#1e1e24] border border-white/10 rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh] my-auto">
                <div className="flex items-center justify-between p-6 border-b border-white/10 flex-none bg-[#1e1e24] rounded-t-xl z-10">
                    <h2 className="text-xl font-semibold text-white">Новое требование</h2>
                    <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors p-1">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    <form onSubmit={handleSubmit} className="space-y-4">

                        <div className="space-y-2">
                            <Label>Нормативный документ</Label>
                            <select
                                className="w-full flex h-10 rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.normSourceId}
                                onChange={(e) => setFormData({ ...formData, normSourceId: e.target.value })}
                            >
                                {norms.length === 0 && <option>Загрузка...</option>}
                                {norms.map(norm => (
                                    <option key={norm.id} value={norm.id}>
                                        {norm.code} — {norm.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2 col-span-1">
                                <Label>Пункт (Clause)</Label>
                                <Input
                                    value={formData.clause}
                                    onChange={(e) => setFormData({ ...formData, clause: e.target.value })}
                                    placeholder="5.1.2"
                                    required
                                />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label>Метод проверки</Label>
                                <select
                                    className="w-full flex h-10 rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.checkMethod}
                                    onChange={(e) => setFormData({ ...formData, checkMethod: e.target.value })}
                                >
                                    <option value="visual">Визуальный осмотр</option>
                                    <option value="document">Проверка документации</option>
                                    <option value="test">Функциональный тест</option>
                                    <option value="measurement">Инструментальный замер</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Текст требования (кратко)</Label>
                            <Textarea
                                value={formData.requirementTextShort}
                                onChange={(e) => setFormData({ ...formData, requirementTextShort: e.target.value })}
                                placeholder="Дымовые извещатели должны быть установлены на расстоянии не менее..."
                                required
                                className="min-h-[100px]"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded p-3 text-sm text-red-400">
                                {error}
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4 border-t border-white/10 mt-6">
                            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                                Отмена
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Добавить' : 'Добавить'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
