'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Search,
    ArrowLeft,
    FileText,
    Database,
    ChevronRight,
    Loader2
} from "lucide-react";
import { searchRequirements } from "@/app/actions/search";

export default function FieldSearchPage() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length >= 2) {
                setLoading(true);
                const res = await searchRequirements(query);
                if (res.success) setResults(res.data || []);
                setLoading(false);
            } else {
                setResults([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-24">
            {/* Sticky Header */}
            <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-xl border-b border-white/5 p-4">
                <div className="flex items-center gap-3 mb-4">
                    <Link href="/field" className="text-slate-400">
                        <ArrowLeft className="h-6 w-6" />
                    </Link>
                    <h1 className="text-lg font-bold">Умный поиск</h1>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Шифр или текст требования..."
                        className="w-full bg-slate-800 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        autoFocus
                    />
                    {loading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                        </div>
                    )}
                </div>
            </header>

            <main className="p-4">
                {results.length > 0 ? (
                    <div className="space-y-3">
                        {results.map((req) => (
                            <div key={req.id} className="bg-slate-900 border border-white/5 rounded-2xl p-4 active:bg-slate-800 transition-colors">
                                <div className="flex items-start gap-3 mb-2">
                                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                                        <FileText className="h-4 w-4 text-blue-400" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 uppercase tracking-wider">
                                                {req.normSource?.code}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">
                                                п. {req.clause}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-200 leading-relaxed line-clamp-3">
                                            {req.content}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                                    <span className="text-[10px] text-slate-500 truncate max-w-[200px]">
                                        {req.normSource?.title}
                                    </span>
                                    <button className="text-blue-400 text-xs font-bold flex items-center gap-1">
                                        Детали <ChevronRight className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : query.length >= 2 && !loading ? (
                    <div className="text-center py-20">
                        <Database className="h-12 w-12 text-slate-800 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">Ничего не найдено</p>
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <Search className="h-12 w-12 text-slate-800 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">Введите минимум 2 символа<br />для начала поиска</p>
                    </div>
                )}
            </main>
        </div>
    );
}
