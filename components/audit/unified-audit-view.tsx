'use client';

import { useState, useMemo } from 'react';
import { AuditExecutionList } from './audit-execution-list';
import { Layers, Filter } from 'lucide-react';

interface UnifiedAuditViewProps {
    results: any[];
    projectId: string;
}

// System definitions with their identifying tags
const SYSTEM_CONFIG = [
    { id: 'APS', name: 'АПС (Сигнализация)', tags: ['APS', 'АПС', 'сигнализация', 'извещатели', 'ПОЖАРНАЯ АВТОМАТИКА', 'АВТОМАТИКА'] },
    { id: 'SOUE', name: 'СОУЭ (Оповещение)', tags: ['SOUE', 'СОУЭ', 'оповещение', 'громкоговорители', 'ЗВУКОВОЙ СИГНАЛ'] },
    { id: 'AGPT', name: 'АГПТ (Газовое)', tags: ['AGPT', 'АГПТ', 'газовое', 'модули', 'ОГНЕТУШАЩИЕ ВЕЩЕСТВА'] },
    { id: 'APPT', name: 'АППТ (Порошковое)', tags: ['APPT', 'АППТ', 'порошковое'] },
    { id: 'AVPT', name: 'АВПТ (Водяное)', tags: ['AVPT', 'АВПТ', 'водяное', 'спринклеры', 'дренчеры'] },
    { id: 'FIRE_WATER', name: 'ВПВ (Водопровод)', tags: ['FIRE_WATER', 'ВПВ', 'водопровод', 'краны'] },
    { id: 'CCTV', name: 'ВН (Видеонаблюдение)', tags: ['CCTV', 'ВН', 'видеонаблюдение', 'камеры'] },
    { id: 'ACS', name: 'СКУД (Доступ)', tags: ['ACS', 'СКУД', 'доступ', 'турникеты'] },
    { id: 'VENT', name: 'ДУ (Вентиляция)', tags: ['DU', 'ДУ', 'дымоудаление', 'клапаны'] },
];

export function UnifiedAuditView({ results: initialResults, projectId }: UnifiedAuditViewProps) {
    const [results, setResults] = useState(initialResults);
    const [activeTab, setActiveTab] = useState('ALL');

    // 1. Group results by System Tags
    // A single result can appear in multiple system buckets if it has multiple tags
    const { systemBuckets, activeSystems } = useMemo(() => {
        const buckets: Record<string, any[]> = {
            'ALL': results,
            'OTHER': []
        };

        // Initialize explicit buckets
        SYSTEM_CONFIG.forEach(sys => {
            buckets[sys.id] = [];
        });

        results.forEach(r => {
            let assigned = false;

            // Check tags (located in requirement object)
            const tags = r.requirement?.tags;
            if (tags && Array.isArray(tags)) {
                tags.forEach((tag: string) => {
                    const normalizedTag = tag.toUpperCase();
                    // Find which system this tag belongs to
                    const matchingSystem = SYSTEM_CONFIG.find(sys =>
                        sys.tags.some(t => t.toUpperCase() === normalizedTag) ||
                        sys.id === normalizedTag
                    );

                    if (matchingSystem) {
                        buckets[matchingSystem.id].push(r);
                        assigned = true;
                    }
                });
            }

            // Fallback: Use requirementSet.systemId if no tags matched
            if (!assigned) {
                const sysId = r.systemId; // From backend join
                const matchingSystem = SYSTEM_CONFIG.find(sys => sys.id === sysId);
                if (matchingSystem) {
                    buckets[matchingSystem.id].push(r);
                    assigned = true;
                }
            }

            // If still not assigned, put in Other
            if (!assigned) {
                buckets['OTHER'].push(r);
            }
        });

        // Determine which tabs to show (only those with items)
        const availableSys = SYSTEM_CONFIG.filter(sys => buckets[sys.id].length > 0);

        return { systemBuckets: buckets, activeSystems: availableSys };
    }, [results]);


    // 2. Filter results based on active tab
    const filteredResults = systemBuckets[activeTab] || [];

    // 3. Stats helper
    const getStats = (tabId: string) => {
        const subset = systemBuckets[tabId] || [];
        const total = subset.length;
        const done = subset.filter((r: any) => r.status !== 'NOT_CHECKED').length;
        return { total, done };
    };

    return (
        <div className="space-y-6">
            {/* System Tabs */}
            <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
                <button
                    onClick={() => setActiveTab('ALL')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all border ${activeTab === 'ALL'
                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                        }`}
                >
                    <Layers className="w-4 h-4" />
                    <span className="font-medium">Все системы</span>
                    <span className="text-xs opacity-60 bg-black/20 px-2 py-0.5 rounded-full">
                        {getStats('ALL').done}/{getStats('ALL').total}
                    </span>
                </button>

                {activeSystems.map(sys => (
                    <button
                        key={sys.id}
                        onClick={() => setActiveTab(sys.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all border ${activeTab === sys.id
                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                            }`}
                    >
                        <span className="font-medium">{sys.name}</span>
                        <span className="text-xs opacity-60 bg-black/20 px-2 py-0.5 rounded-full">
                            {getStats(sys.id).done}/{getStats(sys.id).total}
                        </span>
                    </button>
                ))}

                {systemBuckets['OTHER'].length > 0 && (
                    <button
                        onClick={() => setActiveTab('OTHER')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all border ${activeTab === 'OTHER'
                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                            }`}
                    >
                        <span className="font-medium">Общие / Другое</span>
                        <span className="text-xs opacity-60 bg-black/20 px-2 py-0.5 rounded-full">
                            {getStats('OTHER').done}/{getStats('OTHER').total}
                        </span>
                    </button>
                )}
            </div>

            {/* Active Filters Summary */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">
                    Отображено: <span className="text-white font-medium">{filteredResults.length}</span> требований
                </div>
            </div>

            {/* The List */}
            <div className="bg-black/20 rounded-xl border border-white/5 p-1 min-h-[500px]">
                {filteredResults.length > 0 ? (
                    <AuditExecutionList
                        results={filteredResults}
                        onResultsChange={(newSubset) => {
                            // Merge updates back into main list
                            setResults(prev => prev.map(p => {
                                const updated = newSubset.find(u => u.id === p.id);
                                return updated ? updated : p;
                            }));
                        }}
                        checklistId="unified" // Virtual ID
                        projectId={projectId}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                        <Filter className="w-12 h-12 mb-4 opacity-20" />
                        <p>Нет требований в этой категории</p>
                    </div>
                )}
            </div>
        </div>
    );
}
