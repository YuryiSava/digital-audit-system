'use client';

import { useState, useEffect } from 'react';
import { Plus, X, CheckSquare } from 'lucide-react';
import { Button, Label } from '@/components/ui/simple-ui';
import { getRequirementSets } from '@/app/actions/requirements';
import { createAuditChecklist } from '@/app/actions/audit';

interface AddChecklistDialogProps {
    projectId: string;
}

export function AddChecklistDialog({ projectId }: AddChecklistDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [sets, setSets] = useState<any[]>([]);
    const [selectedSetId, setSelectedSetId] = useState('');

    useEffect(() => {
        if (isOpen && sets.length === 0) {
            getRequirementSets().then(res => {
                if (res.success && res.data) {
                    setSets(res.data);
                    if (res.data.length > 0) {
                        setSelectedSetId(res.data[0].id);
                    }
                }
            });
        }
    }, [isOpen]);

    const handleSubmit = async () => {
        if (!selectedSetId) return;

        setLoading(true);
        setError(null);

        const res = await createAuditChecklist(projectId, selectedSetId);

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
                        <Label>Каталог требований</Label>
                        <div className="space-y-2">
                            {sets.map(set => (
                                <div
                                    key={set.id}
                                    onClick={() => setSelectedSetId(set.id)}
                                    className={`p-4 rounded-lg border cursor-pointer transition-all flex items-center gap-3 ${selectedSetId === set.id
                                        ? 'bg-blue-500/20 border-blue-500 text-white'
                                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                        }`}
                                >
                                    <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${selectedSetId === set.id ? 'border-blue-400 bg-blue-400' : 'border-gray-500'
                                        }`}>
                                        {selectedSetId === set.id && <CheckSquare className="h-3 w-3 text-white" />}
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm">
                                            {set.name || `${set.system?.name || 'Система'} v${set.version}`}
                                        </div>
                                        <div className="text-xs opacity-70">{set.notes || 'Без описания'}</div>
                                    </div>
                                </div>
                            ))}

                            {sets.length === 0 && (
                                <div className="text-gray-500 text-sm text-center py-4">
                                    Нет доступных каталогов. Создайте их в разделе "Каталоги требований".
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
                        <Button onClick={handleSubmit} disabled={loading || sets.length === 0}>
                            {loading ? 'Создание...' : 'Добавить'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
