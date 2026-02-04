'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, FileText, Database, ArrowUpDown, Filter, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { DeleteNormButton } from '@/app/norm-library/delete-norm-button';

interface NormSource {
    id: string;
    code: string;
    title: string;
    docType: string;
    jurisdiction: string;
    editionDate: string | null;
    status: string;
    category: string | null;
    requirements?: [{ count: number }];
    fragments?: [{ count: number }];
}

interface NormLibraryListProps {
    initialNorms: any[];
    isAdmin: boolean;
}

export function NormLibraryList({ initialNorms, isAdmin }: NormLibraryListProps) {
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('Все');
    const [sortAsc, setSortAsc] = useState(true);

    // Categories derived from data + common ones
    const categories = useMemo(() => {
        const unique = new Set(['Все']);
        initialNorms.forEach(n => {
            if (n.category) unique.add(n.category);
        });
        return Array.from(unique);
    }, [initialNorms]);

    // Filtered and Sorted Norms
    const filteredNorms = useMemo(() => {
        let result = initialNorms.filter(norm => {
            const matchesSearch =
                norm.code.toLowerCase().includes(search.toLowerCase()) ||
                norm.title.toLowerCase().includes(search.toLowerCase());
            const matchesCategory = categoryFilter === 'Все' || norm.category === categoryFilter;
            return matchesSearch && matchesCategory;
        });

        // Alphabetical sort (by code)
        result.sort((a, b) => {
            const factor = sortAsc ? 1 : -1;
            return a.code.localeCompare(b.code) * factor;
        });

        return result;
    }, [initialNorms, search, categoryFilter, sortAsc]);

    return (
        <div className="space-y-6">
            {/* Filters Panel */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 shadow-xl">
                <div className="flex flex-col md:flex-row gap-6 items-end">
                    <div className="flex-1 space-y-2 w-full">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Поиск норматива</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Шифр или название..."
                                className="w-full pl-10 pr-4 py-2.5 bg-black/20 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                            />
                        </div>
                    </div>

                    <div className="w-full md:w-64 space-y-2">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Раздел системы</label>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={() => setSortAsc(!sortAsc)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-all group"
                    >
                        <ArrowUpDown className={`h-4 w-4 transition-transform ${!sortAsc ? 'rotate-180' : ''}`} />
                        <span className="text-sm font-medium">А-Я</span>
                    </button>
                </div>
            </div>

            {/* Results */}
            {filteredNorms.length === 0 ? (
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-12 text-center">
                    <div className="h-16 w-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                        <Filter className="h-8 w-8 text-blue-400/50" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">Ничего не найдено</h3>
                    <p className="text-gray-500 text-sm">Попробуйте изменить параметры поиска или фильтры.</p>
                </div>
            ) : (
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 border-b border-white/10">
                                <tr>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Документ</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Название</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">Метрики</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Статус</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">Действия</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredNorms.map((norm) => {
                                    const reqCount = norm.requirements?.[0]?.count || 0;
                                    const fragCount = norm.fragments?.[0]?.count || 0;

                                    return (
                                        <tr key={norm.id} className="hover:bg-white/[0.03] transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-colors">
                                                        <FileText className="h-5 w-5 text-indigo-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white text-sm">{norm.code}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[10px] text-indigo-300/70 font-mono uppercase tracking-tighter bg-indigo-500/10 px-1.5 py-0.5 rounded">
                                                                {norm.jurisdiction}
                                                            </span>
                                                            <span className="text-[10px] text-gray-500 font-medium">
                                                                {norm.category || 'Без раздела'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="max-w-md">
                                                    <p className="text-sm text-gray-300 line-clamp-2 leading-relaxed group-hover:text-white transition-colors">
                                                        {norm.title}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-1.5" title="Сформулированные требования">
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/70" />
                                                            <span className="text-sm font-bold text-emerald-400/90">{reqCount}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5" title="Ожидают обработки">
                                                            <AlertCircle className="w-3.5 h-3.5 text-amber-500/70" />
                                                            <span className="text-sm font-bold text-amber-400/90">{fragCount}</span>
                                                        </div>
                                                    </div>
                                                    <div className="w-20 h-1 bg-white/5 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-blue-500/50"
                                                            style={{ width: `${Math.min(100, (reqCount / (reqCount + fragCount || 1)) * 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${norm.status === 'ACTIVE'
                                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                        : norm.status === 'SUPERSEDED'
                                                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                    }`}>
                                                    {norm.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex items-center justify-end gap-4">
                                                    <Link
                                                        href={`/norm-library/${norm.id}`}
                                                        className="text-xs font-bold text-blue-400 hover:text-blue-300 uppercase tracking-wider"
                                                    >
                                                        Открыть
                                                    </Link>
                                                    {isAdmin && (
                                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-3">
                                                            <span className="h-4 w-px bg-white/10" />
                                                            <DeleteNormButton normId={norm.id} normCode={norm.code} />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
