'use client';

import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useOfflineSync } from '@/hooks/use-offline-sync';
import { AuditResult, AuditResultItem } from './audit-result-item';

export interface AuditExecutionListProps {
    results: AuditResult[];
    onResultsChange: (results: AuditResult[]) => void;
    checklistId: string;
    projectId: string;
}

export function AuditExecutionList({ results, onResultsChange, checklistId, projectId }: AuditExecutionListProps) {
    // Offline sync hook
    const { isOnline, isSyncing, updateResult, processSyncQueue } = useOfflineSync();

    const handleUpdateItem = async (updatedItem: AuditResult) => {
        // 1. Optimistic update of the list
        onResultsChange(results.map(r => r.id === updatedItem.id ? updatedItem : r));

        // 2. Persist to DB (via offline sync logic)
        await updateResult(
            updatedItem.id,
            updatedItem.status,
            updatedItem.comment,
            updatedItem.photos,
            {
                isMultiple: updatedItem.isMultiple,
                totalCount: updatedItem.totalCount,
                failCount: updatedItem.failCount,
                inspectionMethod: updatedItem.inspectionMethod,
                defect_items: updatedItem.defect_items
            }
        );
    };

    return (
        <div className="space-y-4">
            {/* Connection Status Indicator */}
            <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg ${isOnline ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                <div className="flex items-center gap-2 text-sm">
                    {isOnline ? (
                        <>
                            <Wifi className="h-4 w-4" />
                            <span className="font-medium">Онлайн</span>
                            {isSyncing && <span className="text-xs ml-2">Синхронизация...</span>}
                        </>
                    ) : (
                        <>
                            <WifiOff className="h-4 w-4" />
                            <span className="font-medium">Офлайн режим</span>
                            <span className="text-xs ml-2">Данные сохранятся локально</span>
                        </>
                    )}
                </div>

                {/* Manual Sync Button */}
                {isOnline && (
                    <button
                        type="button"
                        onClick={() => processSyncQueue()}
                        disabled={isSyncing}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all min-h-[36px] ${isSyncing
                            ? 'bg-green-200 text-green-600 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
                            }`}
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>{isSyncing ? 'Синхронизация...' : 'Синхронизировать'}</span>
                    </button>
                )}
            </div>

            {results.map((item) => (
                <AuditResultItem
                    key={item.id}
                    item={item}
                    onUpdate={handleUpdateItem}
                    checklistId={checklistId}
                />
            ))}
        </div>
    );
}

