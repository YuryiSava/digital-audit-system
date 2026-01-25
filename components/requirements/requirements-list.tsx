'use client';

import { useState, useMemo } from 'react';
import { Search, Settings, AlertTriangle, Trash2, Filter, AlertCircle } from 'lucide-react';
import { Input, Button } from '@/components/ui/simple-ui';
import { deleteRequirement } from '@/app/actions/requirements';

interface Requirement {
    id: string;
    requirementId: string;
    clause: string;
    requirementTextShort: string;
    checkMethod: string;
    severityHint?: string;
    requirementSetId: string;
}

interface RequirementsListProps {
    initialRequirements: Requirement[];
    setId: string;
}

export function RequirementsList({ initialRequirements, setId }: RequirementsListProps) {
    const [search, setSearch] = useState('');
    const [methodFilter, setMethodFilter] = useState<string>('all');
    const [requirements, setRequirements] = useState(initialRequirements);

    const filteredRequirements = useMemo(() => {
        return requirements.filter(req => {
            const matchesSearch =
                req.clause.toLowerCase().includes(search.toLowerCase()) ||
                req.requirementTextShort.toLowerCase().includes(search.toLowerCase()) ||
                req.requirementId.toLowerCase().includes(search.toLowerCase());

            const matchesMethod = methodFilter === 'all' || req.checkMethod === methodFilter;

            return matchesSearch && matchesMethod;
        });
    }, [requirements, search, methodFilter]);

    const handleDelete = async (id: string) => {
        if (confirm('Вы уверены, что хотите удалить это требование?')) {
            const res = await deleteRequirement(id, setId);
            // Оптимистичное обновление или перезагрузка страницы
            // Для простоты здесь можно просто обновить локальный стейт, но Server Action делает revalidatePath
            // Поэтому лучше просто позволить Next.js обновить данные, но для мгновенности уберем из списка
            if (res.success) {
                setRequirements(prev => prev.filter(r => r.id !== id));
            }
        }
    };

    if (initialRequirements.length === 0) {
        return (
            <div className="bg-white/5 border border-dashed border-white/20 rounded-xl p-12 text-center mt-6">
                <div className="h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
                    <Filter className="h-8 w-8 text-slate-500" />
                </div>
                <h3 className="text-lg font-medium text-white mb-1">Список пуст</h3>
                <p className="text-gray-400 text-sm">Импортируйте требования из CSV или добавьте вручную.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 mt-6">
            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Поиск по пункту, тексту или коду..."
                        className="pl-9 bg-black/40 border-white/10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        className="h-10 rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={methodFilter}
                        onChange={(e) => setMethodFilter(e.target.value)}
                    >
                        <option value="all">Все методы</option>
                        <option value="visual">Визуальный</option>
                        <option value="document">Документальный</option>
                        <option value="test">Тест</option>
                        <option value="measurement">Замер</option>
                    </select>
                </div>
            </div>

            {/* Results Stats */}
            <div className="flex justify-between items-center text-xs text-gray-500 px-1">
                <span>Найдено: {filteredRequirements.length} из {requirements.length}</span>
            </div>

            {/* List */}
            <div className="space-y-3">
                {filteredRequirements.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        <Search className="h-10 w-10 mx-auto mb-2 opacity-20" />
                        <p>Ничего не найдено по запросу "{search}"</p>
                    </div>
                ) : (
                    filteredRequirements.map((req) => (
                        <div key={req.id} className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-emerald-500/30 transition-all flex flex-col md:flex-row gap-4 group relative">

                            {/* Delete Button (Visible on hover) */}
                            <button
                                onClick={() => handleDelete(req.id)}
                                className="absolute top-2 right-2 p-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Удалить"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>

                            {/* Левая часть: Код и пункт */}
                            <div className="md:w-32 flex-shrink-0">
                                <div className="text-emerald-400 font-mono text-sm font-bold flex items-center gap-2">
                                    {req.requirementId}
                                </div>
                                <div className="text-gray-500 text-xs mt-1 font-mono bg-white/5 inline-block px-1.5 py-0.5 rounded">
                                    п. {req.clause}
                                </div>
                            </div>

                            {/* Основная часть: Текст */}
                            <div className="flex-1 pr-8">
                                <p className="text-gray-200 text-sm leading-relaxed">
                                    {req.requirementTextShort}
                                </p>
                            </div>

                            {/* Правая часть: Мета */}
                            <div className="md:w-32 flex flex-row md:flex-col gap-2 md:items-end justify-between md:justify-start text-xs text-gray-400 border-t md:border-t-0 md:border-l border-white/5 pt-3 md:pt-0 md:pl-4 mt-2 md:mt-0 flex-shrink-0">
                                <div className="flex items-center gap-1.5" title="Метод проверки">
                                    <Settings className="h-3 w-3" />
                                    <span>{req.checkMethod}</span>
                                </div>
                                {req.severityHint && (
                                    <div className="flex items-center gap-1.5 text-yellow-500/80" title="Важность">
                                        <AlertTriangle className="h-3 w-3" />
                                        <span>{req.severityHint}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
