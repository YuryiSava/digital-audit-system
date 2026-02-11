'use client';

import { useState, useEffect } from 'react';
import { Plus, X, CheckSquare } from 'lucide-react';
import { Button, Label } from '@/components/ui/simple-ui';
import { getAvailableSystems } from '@/app/actions/pre-audit';
import { createSystemChecklist } from '@/app/actions/audit';

interface AddChecklistDialogProps {
    projectId: string;
}

export function AddChecklistDialog({ projectId }: AddChecklistDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [systems, setSystems] = useState<any[]>([]);
    const [selectedSystemId, setSelectedSystemId] = useState('');

    useEffect(() => {
        if (isOpen && systems.length === 0) {
            getAvailableSystems().then(res => {
                if (res.success && res.systems) {
                    setSystems(res.systems);
                    if (res.systems.length > 0) {
                        setSelectedSystemId(res.systems[0].systemId);
                    }
                }
            });
        }
    }, [isOpen]);

    const handleSubmit = async () => {
        if (!selectedSystemId) return;

        setLoading(true);
        setError(null);

        const res = await createSystemChecklist(projectId, selectedSystemId);

        if (res.success) {
            setIsOpen(false);
        } else {
            //@ts-ignore
            setError(res.error || "Ошибка создания");
        }
        setLoading(false);
    };

    if (!isOpen) {
        return (
            <Button onClick={() => setIsOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить раздел аудита
            </Button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#1e1e24] border border-white/10 rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh] my-auto">
                <div className="flex items-center justify-between p-6 border-b border-white/10 flex-none bg-[#1e1e24] rounded-t-xl z-10">
                    <h2 className="text-xl font-semibold text-white">Выбор раздела аудита</h2>
                    <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors p-1">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">

                    <div className="space-y-2">
                        <Label>Выберите систему</Label>
                        <div className="space-y-2">
                            {systems.map(sys => (
                                <div
                                    key={sys.id}
                                    onClick={() => setSelectedSystemId(sys.systemId)}
                                    className={`p-4 rounded-lg border cursor-pointer transition-all flex items-center gap-3 ${selectedSystemId === sys.systemId
                                        ? 'bg-blue-500/20 border-blue-500 text-white'
                                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                        }`}
                                >
                                    <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${selectedSystemId === sys.systemId ? 'border-blue-400 bg-blue-400' : 'border-gray-500'
                                        }`}>
                                        {selectedSystemId === sys.systemId && <CheckSquare className="h-3 w-3 text-white" />}
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm">
                                            {sys.name} ({sys.systemId})
                                        </div>
                                        <div className="text-xs opacity-70">{sys.nameRu || 'Без названия'}</div>
                                    </div>
                                </div>
                            ))}

                            {systems.length === 0 && (
                                <div className="text-gray-500 text-sm text-center py-4">
                                    Нет доступных систем.
                                </div>
                            )}
                        </div>
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
                        <Button onClick={handleSubmit} disabled={loading || systems.length === 0}>
                            {loading ? 'Создание...' : 'Добавить'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
