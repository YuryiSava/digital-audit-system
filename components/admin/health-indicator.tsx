'use client';

import { useState, useEffect } from 'react';
import { getSystemHealth, SystemHealth } from '@/app/actions/health';
import { Activity, Database, Cloud, Brain, TriangleAlert, CircleCheck, RefreshCw } from 'lucide-react';

export function HealthIndicator() {
    const [health, setHealth] = useState<SystemHealth | null>(null);
    const [loading, setLoading] = useState(true);

    async function checkHealth() {
        setLoading(true);
        try {
            const data = await getSystemHealth();
            setHealth(data);
        } catch (err) {
            console.error('Failed to fetch health:', err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        checkHealth();
    }, []);

    if (!health && loading) return (
        <div className="animate-pulse bg-slate-900/50 rounded-xl p-4 border border-white/5 space-y-3">
            <div className="h-4 bg-slate-800 rounded w-1/2"></div>
            <div className="h-4 bg-slate-800 rounded w-full"></div>
        </div>
    );

    if (!health) return null;

    const statusColors = {
        healthy: 'text-emerald-400',
        degraded: 'text-yellow-400',
        unhealthy: 'text-red-400',
        checking: 'text-slate-400'
    };

    return (
        <div className="rounded-xl border border-white/5 bg-slate-900/50 p-4 space-y-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Статус системы
                </h3>
                <button
                    onClick={checkHealth}
                    className={`text-slate-500 hover:text-white transition-colors ${loading ? 'animate-spin' : ''}`}
                >
                    <RefreshCw className="w-3 h-3" />
                </button>
            </div>

            <div className="space-y-3">
                <StatusItem
                    label="База данных"
                    status={health.database}
                    icon={<Database className="w-3.5 h-3.5" />}
                    error={health.details?.dbError}
                />
                <StatusItem
                    label="Хранилище (S3)"
                    status={health.storage}
                    icon={<Cloud className="w-3.5 h-3.5" />}
                    error={health.details?.storageError}
                />
                <StatusItem
                    label="Интеллект (AI)"
                    status={health.ai}
                    icon={<Brain className="w-3.5 h-3.5" />}
                    error={health.details?.aiError}
                />
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] text-slate-600">
                    Обновлено: {new Date(health.timestamp).toLocaleTimeString()}
                </span>
                {health.overall === 'healthy' ? (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-medium">
                        <CircleCheck className="w-3 h-3" /> Все системы в норме
                    </span>
                ) : (
                    <span className="flex items-center gap-1 text-[10px] text-red-500 font-medium">
                        <TriangleAlert className="w-3 h-3" /> Требуется внимание
                    </span>
                )}
            </div>
        </div>
    );
}

function StatusItem({ label, status, icon, error }: { label: string, status: string, icon: any, error?: string }) {
    const dotColors: any = {
        healthy: 'bg-emerald-500',
        degraded: 'bg-yellow-500',
        unhealthy: 'bg-red-500',
        checking: 'bg-slate-500 animate-pulse'
    };

    return (
        <div className="group relative flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-400">
                {icon}
                <span>{label}</span>
            </div>
            <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${dotColors[status]}`}></span>
                {error && (
                    <div className="hidden group-hover:block absolute right-0 top-6 z-50 bg-red-950 text-red-200 text-[10px] p-2 rounded border border-red-500/30 max-w-[200px] shadow-2xl">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}
