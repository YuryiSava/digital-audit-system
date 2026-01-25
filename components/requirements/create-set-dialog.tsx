'use client';

import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { Button, Input, Label } from '@/components/ui/simple-ui';
import { createRequirementSet, getSystemsList } from '@/app/actions/requirements';

export function CreateRequirementSetDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [systems, setSystems] = useState<any[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        systemId: '',
        jurisdiction: 'KZ',
        version: '1.0',
        notes: ''
    });

    // Загрузка справочника систем при открытии
    useEffect(() => {
        if (isOpen && systems.length === 0) {
            getSystemsList().then(data => {
                setSystems(data);
                if (data.length > 0) {
                    // Используем systemId (код), так как FK в базе по нему!
                    setFormData(prev => ({ ...prev, systemId: data[0].systemId }));
                }
            });
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const res = await createRequirementSet({
            // @ts-ignore
            jurisdiction: formData.jurisdiction,
            systemId: formData.systemId,
            version: formData.version,
            notes: formData.notes,
            status: 'DRAFT'
        });

        if (res.success) {
            setIsOpen(false);
            setFormData({
                systemId: systems[0]?.systemId || '',
                jurisdiction: 'KZ',
                version: '1.0',
                notes: ''
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
                Создать каталог требований
            </Button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#1e1e24] border border-white/10 rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh] my-auto">
                <div className="flex items-center justify-between p-6 border-b border-white/10 flex-none bg-[#1e1e24] rounded-t-xl z-10">
                    <h2 className="text-xl font-semibold text-white">Новый каталог требований</h2>
                    <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors p-1">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    <form onSubmit={handleSubmit} className="space-y-4">

                        <div className="space-y-2">
                            <Label>Система (раздел)</Label>
                            <select
                                className="w-full flex h-10 rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.systemId}
                                onChange={(e) => setFormData({ ...formData, systemId: e.target.value })}
                            >
                                {systems.map(sys => (
                                    <option key={sys.id} value={sys.systemId}>
                                        {sys.name} ({sys.systemId})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Юрисдикция</Label>
                                <select
                                    className="w-full flex h-10 rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.jurisdiction}
                                    onChange={(e) => setFormData({ ...formData, jurisdiction: e.target.value })}
                                >
                                    <option value="KZ">Казахстан (KZ)</option>
                                    <option value="RU">Россия (RU)</option>
                                    <option value="INT">International (INT)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Версия</Label>
                                <Input
                                    value={formData.version}
                                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                                    placeholder="1.0"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Примечание</Label>
                            <Input
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Например: Базовый чек-лист для АПС 2024"
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
                                {loading ? 'Создать' : 'Создать'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
