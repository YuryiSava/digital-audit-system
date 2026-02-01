'use client';

import { useState } from 'react';
import { useOfflineSync } from '@/hooks/use-offline-sync';
import { RefreshCw, CheckCircle, CloudOff, Loader2, DownloadCloud } from 'lucide-react';

interface SyncButtonProps {
    projectId?: string;
}

export function SyncButton({ projectId }: SyncButtonProps) {
    const { isOnline, isSyncing, hydrateProject, processSyncQueue } = useOfflineSync();
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleSync = async () => {
        if (!isOnline) {
            alert('Синхронизация невозможна без интернета');
            return;
        }

        setStatus('idle');

        if (projectId) {
            const res = await hydrateProject(projectId);
            if (res.success) {
                setStatus('success');
                setTimeout(() => setStatus('idle'), 3000);
            } else {
                setStatus('error');
            }
        } else {
            await processSyncQueue();
            setStatus('success');
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    return (
        <button
            onClick={handleSync}
            disabled={isSyncing}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                status === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    'bg-white/5 border border-white/10 text-slate-300'
                }`}
        >
            {isSyncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : status === 'success' ? (
                <CheckCircle className="h-4 w-4" />
            ) : !isOnline ? (
                <CloudOff className="h-4 w-4 text-amber-500" />
            ) : (
                <DownloadCloud className="h-4 w-4" />
            )}

            {isSyncing ? 'Синхронизация...' :
                status === 'success' ? 'Готово!' :
                    status === 'error' ? 'Ошибка' :
                        projectId ? 'Скачать проект офлайн' : 'Синхронизировать'}
        </button>
    );
}
