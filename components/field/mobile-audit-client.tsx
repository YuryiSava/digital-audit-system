'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/dexie';
import Link from "next/link";
import { useState } from 'react';
import {
    ArrowLeft,
    Filter,
    Search,
    LayoutDashboard,
    Settings,
    Shield,
    Loader2,
    CloudOff,
    CheckCircle2,
    XCircle,
    MinusCircle
} from "lucide-react";
import { AuditItemCard } from "@/components/field/audit-item-card";
import { useOfflineSync } from '@/hooks/use-offline-sync';

export function MobileAuditClient({ checklistId }: { checklistId: string }) {
    const { isOnline } = useOfflineSync();
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'ALL' | 'OK' | 'DEFECT' | 'NOT_CHECKED'>('ALL');

    // Live query from Dexie
    const checklist = useLiveQuery(() => db.checklists.get(checklistId), [checklistId]);
    const results = useLiveQuery(async () => {
        let query = db.auditResults.where('checklistId').equals(checklistId);

        let items = await query.toArray();

        if (searchTerm) {
            const lowSearch = searchTerm.toLowerCase();
            items = items.filter(i =>
                i.requirementContent.toLowerCase().includes(lowSearch) ||
                i.requirementClause.toLowerCase().includes(lowSearch)
            );
        }

        if (filter !== 'ALL') {
            items = items.filter(i => i.status === filter);
        }

        return items;
    }, [checklistId, searchTerm, filter]);

    const allResults = useLiveQuery(() => db.auditResults.where('checklistId').equals(checklistId).toArray(), [checklistId]);

    if (!checklist || !allResults) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-10 text-center">
                <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
                <p className="text-slate-400 font-medium">Синхронизация данных...</p>
                <p className="text-[10px] text-slate-600 mt-2 uppercase font-bold tracking-widest">Digital Audit System</p>
            </div>
        );
    }

    const stats = {
        total: allResults.length,
        ok: allResults.filter(r => r.status === 'OK').length,
        defects: allResults.filter(r => r.status === 'DEFECT').length,
        pending: allResults.filter(r => r.status === 'NOT_CHECKED').length,
    };

    const progress = stats.total > 0 ? Math.round(((stats.total - stats.pending) / stats.total) * 100) : 0;

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-24">
            <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-xl border-b border-white/5 shadow-lg">
                <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href={`/field/projects/${checklist.projectId}`} className="text-slate-400">
                            <ArrowLeft className="h-6 w-6" />
                        </Link>
                        <div>
                            <h1 className="text-sm font-bold truncate max-w-[180px]">{checklist.name}</h1>
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{checklist.systemName}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-blue-400">{progress}%</p>
                            {!isOnline && <CloudOff className="h-3 w-3 text-amber-500 inline ml-1" />}
                        </div>
                        <div className="h-8 w-8 rounded-full border-2 border-slate-800 flex items-center justify-center relative">
                            <svg className="h-full w-full -rotate-90">
                                <circle cx="16" cy="16" r="14" fill="transparent" stroke="currentColor" strokeWidth="2" className="text-slate-800" />
                                <circle cx="16" cy="16" r="14" fill="transparent" stroke="currentColor" strokeWidth="2" strokeDasharray={88} strokeDashoffset={88 - (88 * progress) / 100} className="text-blue-500 transition-all duration-500" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="px-4 py-3 space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Поиск по тексту или пункту..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        <button
                            onClick={() => setFilter('ALL')}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all shrink-0 ${filter === 'ALL' ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-500 border border-white/5'}`}
                        >
                            Все
                        </button>
                        <button
                            onClick={() => setFilter('OK')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all shrink-0 ${filter === 'OK' ? 'bg-emerald-600 text-white' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/10'}`}
                        >
                            <CheckCircle2 className="h-3 w-3" />
                            Норма ({stats.ok})
                        </button>
                        <button
                            onClick={() => setFilter('DEFECT')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all shrink-0 ${filter === 'DEFECT' ? 'bg-red-600 text-white' : 'bg-red-500/10 text-red-500 border border-red-500/10'}`}
                        >
                            <XCircle className="h-3 w-3" />
                            Дефекты ({stats.defects})
                        </button>
                        <button
                            onClick={() => setFilter('NOT_CHECKED')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all shrink-0 ${filter === 'NOT_CHECKED' ? 'bg-slate-600 text-white' : 'bg-white/10 text-slate-400 border border-white/5'}`}
                        >
                            <MinusCircle className="h-3 w-3" />
                            Осталось ({stats.pending})
                        </button>
                    </div>
                </div>
            </header>

            <main className="p-4 space-y-4">
                {results && results.length > 0 ? (
                    results.map((result) => (
                        <AuditItemCard
                            key={result.id}
                            result={{
                                ...result,
                                requirement: {
                                    content: result.requirementContent,
                                    clause: result.requirementClause
                                }
                            }}
                            projectId={checklist.projectId}
                            projectTitle={checklist.projectName || checklist.name}
                        />
                    ))
                ) : (
                    <div className="py-20 text-center space-y-3">
                        <Search className="h-10 w-10 text-slate-800 mx-auto" />
                        <p className="text-slate-500 text-sm">Ничего не найдено</p>
                    </div>
                )}
            </main>

            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-xl border-t border-white/10 px-6 py-3 flex items-center justify-between pointer-events-auto">
                <Link href="/field" className="flex flex-col items-center gap-1 text-slate-500">
                    <LayoutDashboard className="h-6 w-6" />
                    <span className="text-[10px] font-bold">Главная</span>
                </Link>
                <Link href="/field/audit" className="flex flex-col items-center gap-1 text-blue-500">
                    <LocalAudit className="h-6 w-6" />
                    <span className="text-[10px] font-bold">Аудит</span>
                </Link>
                <Link href="/field/search" className="flex flex-col items-center gap-1 text-slate-500">
                    <Search className="h-6 w-6" />
                    <span className="text-[10px] font-bold">Поиск</span>
                </Link>
                <Link href="/field/profile" className="flex flex-col items-center gap-1 text-slate-500">
                    <Settings className="h-6 w-6" />
                    <span className="text-[10px] font-bold">Профиль</span>
                </Link>
            </nav>
        </div>
    );
}

function LocalAudit(props: any) { return <Shield {...props} /> }
