'use client';

import { useState } from 'react';
import { Layers } from 'lucide-react';
import RawFragmentsTab from './RawFragmentsTab';
import { AddRequirementButton } from './add-requirement-button';
import { UniversalParseButton } from './universal-parse-button';
import { EditRequirementButton } from './edit-requirement-button';
import { DeleteRequirementButton } from './delete-requirement-button';
import { PublishRequirementSetButton } from './publish-requirement-set-button';

export default function TabsView({ normId, norm }: { normId: string; norm: any }) {
    const [activeTab, setActiveTab] = useState<'requirements' | 'fragments'>('requirements');

    return (
        <div className="bg-white/10 border border-white/10 rounded-xl min-h-[500px]">
            {/* Tabs Header */}
            <div className="border-b border-white/10 bg-black/20">
                <div className="flex items-center justify-between p-6 pb-0">
                    <div className="flex gap-4">
                        <button
                            onClick={() => setActiveTab('requirements')}
                            className={`pb-4 px-2 ${activeTab === 'requirements'
                                ? 'border-b-2 border-purple-400 text-white font-semibold'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Требования и Разделы
                        </button>
                        <button
                            onClick={() => setActiveTab('fragments')}
                            className={`pb-4 px-2 ${activeTab === 'fragments'
                                ? 'border-b-2 border-purple-400 text-white font-semibold'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            RAW Фрагменты
                        </button>
                    </div>
                    <div className="flex items-center gap-3 pb-4">
                        <PublishRequirementSetButton
                            normId={normId}
                            requirementSetId={norm.requirementSet?.requirementSetId}
                            requirementSetDbId={norm.requirementSet?.id}
                            currentStatus={norm.requirementSet?.status}
                            requirementsCount={norm.requirements?.length || 0}
                        />
                        <AddRequirementButton normId={normId} />
                        <UniversalParseButton normId={normId} />
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === 'requirements' && (
                    <div className="p-6">
                        {norm.requirements && norm.requirements.length > 0 ? (
                            <div className="space-y-4">
                                {norm.requirements.map((req: any) => (
                                    <div key={req.id} className="bg-black/20 p-4 rounded border border-white/5 hover:border-white/10 transition-colors">
                                        <div className="flex justify-between mb-2">
                                            <span className="font-mono font-bold text-blue-300 text-sm align-middle flex items-center gap-2">
                                                {req.clause}
                                                {req.severityHint === 'CRITICAL' && <span className="text-[9px] bg-red-500 text-white px-1 py-0.5 rounded uppercase font-bold tracking-wider">Critical</span>}
                                                {req.severityHint === 'HIGH' && <span className="text-[9px] bg-orange-500 text-white px-1 py-0.5 rounded uppercase font-bold tracking-wider">High</span>}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                {req.mustCheck && <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">Обязательно</span>}
                                                <EditRequirementButton requirement={req} />
                                                <DeleteRequirementButton requirementId={req.id} normId={normId} />
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-300 mb-3">{req.requirementTextShort}</p>

                                        <div className="flex flex-wrap gap-2 items-center text-xs text-gray-400">
                                            <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded border border-white/5">
                                                <span className="text-slate-500">Method:</span>
                                                <span className={`font-medium ${req.checkMethod === 'measurement' ? 'text-purple-400' : 'text-blue-400'}`}>
                                                    {req.checkMethod || 'visual'}
                                                </span>
                                            </div>

                                            {req.tags && req.tags.map((tag: string) => (
                                                <span key={tag} className="bg-slate-700 px-2 py-1 rounded text-slate-300 text-[10px]">#{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 border border-dashed border-white/10 rounded-lg">
                                <Layers className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                                <p className="text-gray-400 mb-2">Требования не извлечены</p>
                                <p className="text-sm text-gray-600 max-w-sm mx-auto">
                                    Система пока не обработала этот документ. Нажмите "Запустить парсинг", чтобы извлечь требования автоматически.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'fragments' && (
                    <RawFragmentsTab normSourceId={normId} />
                )}
            </div>
        </div>
    );
}
