'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button, Input, Label, Textarea } from '@/components/ui/simple-ui';
import { createProject } from '@/app/actions/projects';

export function CreateProjectDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        customer: '',
        description: '',
        startDate: new Date().toISOString().split('T')[0]
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const res = await createProject({
            name: formData.name,
            address: formData.address,
            customer: formData.customer,
            description: formData.description,
            startDate: formData.startDate,
            status: 'PLANNING'
        });

        if (res.success) {
            setIsOpen(false);
            setFormData({
                name: '',
                address: '',
                customer: '',
                description: '',
                startDate: new Date().toISOString().split('T')[0]
            });
        } else {
            // @ts-ignore
            setError(typeof res.error === 'string' ? res.error : 'Ошибка валидации');
        }
        setLoading(false);
    };

    if (!isOpen) {
        return (
            <Button onClick={() => setIsOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Создать проект
            </Button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#1e1e24] border border-white/10 rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh] my-auto">
                <div className="flex items-center justify-between p-6 border-b border-white/10 flex-none bg-[#1e1e24] rounded-t-xl z-10">
                    <h2 className="text-xl font-semibold text-white">Новый проект аудита</h2>
                    <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors p-1">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    <form onSubmit={handleSubmit} className="space-y-4">

                        <div className="space-y-2">
                            <Label>Название объекта</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="БЦ Нурлы-Тау, Блок А"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Адрес</Label>
                            <Input
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="г. Алматы, пр. Аль-Фараби, 19"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Заказчик</Label>
                                <Input
                                    value={formData.customer}
                                    onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                                    placeholder="ТОО 'Вектор'"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Дата начала</Label>
                                <Input
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Описание / Примечания</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Дополнительная информация о проекте..."
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
                                {loading ? 'Создать...' : 'Создать проект'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
