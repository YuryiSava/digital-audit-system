'use client';

import { useState } from 'react';
import { Check, X, AlertTriangle, Minus, MessageSquare, Camera, Image, ChevronDown, ChevronUp, Calculator, Eye, FileText, Activity, Ruler, Wifi, WifiOff, CloudOff, RefreshCw } from 'lucide-react';
import { Button, Input, Textarea } from '@/components/ui/simple-ui';
import { saveAuditResult } from '@/app/actions/audit';
import { supabase } from '@/lib/supabaseClient';
import { useOfflineSync } from '@/hooks/use-offline-sync';

interface AuditRequirement {
    id: string;
    clause: string;
    requirementTextShort: string;
    checkMethod: string;
    severityHint?: string;
    isMultipleHint?: boolean;
    normSource?: {
        code: string;
        title: string;
    };
}

interface AuditResult {
    id: string;
    requirement: AuditRequirement;
    status: string; // NOT_CHECKED, OK, VIOLATION, WARNING, NA
    comment?: string;
    photos?: string[];
    isMultiple?: boolean;
    totalCount?: number;
    failCount?: number;
    inspectionMethod?: string;
}

export interface AuditExecutionListProps {
    results: AuditResult[];
    onResultsChange: (results: AuditResult[]) => void;
    checklistId: string;
    projectId: string;
}

export function AuditExecutionList({ results, onResultsChange, checklistId, projectId }: AuditExecutionListProps) {
    // Offline sync hook
    const { isOnline, isSyncing, updateResult, savePhoto, processSyncQueue } = useOfflineSync();

    const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
    const [tempComment, setTempComment] = useState('');
    const [uploadingId, setUploadingId] = useState<string | null>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, itemId: string) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploadingId(itemId);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${itemId}-${Math.random()}.${fileExt}`;
            const filePath = `${checklistId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('audit-evidence')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('audit-evidence')
                .getPublicUrl(filePath);

            const item = results.find(r => r.id === itemId);
            const currentPhotos = item?.photos || [];
            const newPhotos = [...currentPhotos, publicUrl];

            // setResults(prev => prev.map(r =>
            //    r.id === itemId ? { ...r, photos: newPhotos } : r
            // ));
            onResultsChange(results.map(r => r.id === itemId ? { ...r, photos: newPhotos } : r));

            await saveAuditResult(itemId, item?.status || 'NOT_CHECKED', item?.comment, newPhotos);

        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Ошибка загрузки изображения');
        } finally {
            setUploadingId(null);
        }
    };

    const handleDeletePhoto = async (itemId: string, photoUrl: string) => {
        if (!confirm('Удалить это фото?')) return;

        const item = results.find(r => r.id === itemId);
        const newPhotos = (item?.photos || []).filter(p => p !== photoUrl);

        onResultsChange(results.map(r => r.id === itemId ? { ...r, photos: newPhotos } : r));

        await saveAuditResult(itemId, item?.status || 'NOT_CHECKED', item?.comment, newPhotos);
    };

    const updateStatus = async (id: string, newStatus: string) => {
        // 1. Оптимистичное обновление UI
        onResultsChange(results.map(r => r.id === id ? { ...r, status: newStatus } : r));

        // 2. Offline-first save (queues if offline)
        const item = results.find(r => r.id === id);
        await updateResult(id, newStatus, item?.comment, item?.photos);
    };

    const handleCommentSave = async (id: string) => {
        onResultsChange(results.map(r => r.id === id ? { ...r, comment: tempComment } : r));
        const item = results.find(r => r.id === id);
        await updateResult(id, item?.status || 'NOT_CHECKED', tempComment, item?.photos);
        setActiveCommentId(null);
    };

    const openComment = (id: string, currentComment?: string) => {
        setActiveCommentId(activeCommentId === id ? null : id);
        setTempComment(currentComment || '');
    };

    const updateQuantitativeData = async (id: string, field: string, value: any) => {
        const item = results.find(r => r.id === id);
        if (!item) return;

        // Валидация: Дефекты не могут превышать общее количество
        if (field === 'failCount' && item.totalCount !== undefined && value > item.totalCount) {
            value = item.totalCount;
        }
        if (field === 'totalCount' && item.failCount !== undefined && value < item.failCount) {
            // Если уменьшаем общее количество ниже текущих дефектов, подтягиваем дефекты
            onResultsChange(results.map(r => r.id === id ? { ...r, totalCount: value, failCount: value } : r));
        }

        const updatedResults = results.map(r =>
            r.id === id ? { ...r, [field]: value } : r
        );
        onResultsChange(updatedResults);

        const updatedItem = updatedResults.find(r => r.id === id);
        await saveAuditResult(id, updatedItem?.status || 'NOT_CHECKED', updatedItem?.comment, updatedItem?.photos, {
            isMultiple: updatedItem?.isMultiple,
            totalCount: updatedItem?.totalCount,
            failCount: updatedItem?.failCount,
            inspectionMethod: updatedItem?.inspectionMethod
        });
    };

    // Группировка или просто список? Пока список.
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
                <div
                    key={item.id}
                    className={`bg-white/5 border rounded-xl p-4 transition-all ${item.status === 'OK' ? 'border-green-500/30 bg-green-500/5' :
                        item.status === 'VIOLATION' ? 'border-red-500/30 bg-red-500/5' :
                            item.status === 'WARNING' ? 'border-yellow-500/30 bg-yellow-500/5' :
                                'border-white/10 hover:border-white/20'
                        }`}
                >
                    <div className="flex flex-col md:flex-row gap-4 justify-between">
                        {/* Text & Badges */}
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="font-mono text-emerald-400 font-bold bg-emerald-950/30 px-2 py-0.5 rounded text-sm">
                                    {item.requirement.clause}
                                </span>
                                <span className="text-[10px] text-gray-500 uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded border border-white/5 flex items-center gap-1.5">
                                    {item.requirement.checkMethod === 'measurement' && <Ruler className="w-3 h-3 text-blue-400" />}
                                    {item.requirement.checkMethod === 'visual' && <Eye className="w-3 h-3 text-emerald-400" />}
                                    {item.requirement.checkMethod === 'documentation' && <FileText className="w-3 h-3 text-amber-400" />}
                                    {item.requirement.checkMethod === 'testing' && <Activity className="w-3 h-3 text-red-400" />}
                                    {item.requirement.checkMethod}
                                </span>
                            </div>

                            {/* Norm Source */}
                            {item.requirement.normSource && (
                                <div className="text-xs text-blue-400 mb-2 flex items-center gap-2">
                                    <span className="font-mono bg-blue-950/30 px-2 py-0.5 rounded">
                                        {item.requirement.normSource.code}
                                    </span>
                                    <span className="text-gray-500">
                                        {item.requirement.normSource.title}
                                    </span>
                                </div>
                            )}

                            <p className="text-gray-200 text-sm leading-relaxed mb-3">
                                {item.requirement.requirementTextShort}
                            </p>

                            {item.comment && activeCommentId !== item.id && (
                                <div className="bg-black/20 p-2 rounded text-sm text-gray-300 flex gap-2 items-start mt-2">
                                    <MessageSquare className="h-4 w-4 mt-0.5 opacity-50" />
                                    <span>{item.comment}</span>
                                </div>
                            )}

                            {item.photos && item.photos.length > 0 && (
                                <div className="flex gap-2 mt-2 flex-wrap">
                                    {item.photos.map((photo, idx) => (
                                        <div key={idx} className="relative group w-16 h-16">
                                            <a href={photo} target="_blank" rel="noopener noreferrer" className="block w-full h-full rounded overflow-hidden border border-white/10 hover:border-white/30 transition-colors">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={photo} alt="Evidence" className="w-full h-full object-cover" />
                                            </a>
                                            <button
                                                onClick={() => handleDeletePhoto(item.id, photo)}
                                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Удалить"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Quantitative Controls */}
                            <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${item.isMultiple ? 'bg-blue-600 border-blue-500' : 'border-white/20 group-hover:border-white/40'}`}>
                                            {item.isMultiple && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={item.isMultiple || false}
                                            onChange={(e) => updateQuantitativeData(item.id, 'isMultiple', e.target.checked)}
                                        />
                                        <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors underline decoration-dotted underline-offset-4">Множественный объект</span>
                                        {item.requirement.isMultipleHint && !item.isMultiple && (
                                            <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse flex items-center gap-1">
                                                <Calculator className="w-2.5 h-2.5" /> AI: Рекомендуется массовая проверка
                                            </span>
                                        )}
                                    </label>
                                </div>

                                {item.isMultiple && (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in slide-in-from-top-1">
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between ml-1">
                                                <label className="text-[10px] text-slate-500 uppercase tracking-wider">Осмотрено (всего)</label>
                                                {!item.totalCount && <span className="text-[9px] text-amber-500 font-bold animate-pulse">! Пусто</span>}
                                            </div>
                                            <Input
                                                type="number"
                                                min="0"
                                                className={`h-9 bg-black/40 text-sm ${!item.totalCount ? 'border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.1)]' : 'border-white/10'}`}
                                                placeholder="Напр: 150"
                                                value={item.totalCount || ''}
                                                onChange={(e) => updateQuantitativeData(item.id, 'totalCount', parseInt(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-slate-500 uppercase tracking-wider ml-1">Дефектов выявлено</label>
                                            <Input
                                                type="number"
                                                min="0"
                                                max={item.totalCount || 999999}
                                                className={`h-9 bg-black/40 text-sm border-white/10 ${item.failCount && item.failCount > 0 ? 'text-red-400 border-red-500/30' : ''}`}
                                                placeholder="Напр: 5"
                                                value={item.failCount || ''}
                                                onChange={(e) => updateQuantitativeData(item.id, 'failCount', parseInt(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-slate-500 uppercase tracking-wider ml-1">Метод проверки</label>
                                            <select
                                                className="w-full h-9 rounded-md bg-black/40 text-sm border border-white/10 px-2 text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all appearance-none"
                                                value={item.inspectionMethod || 'VISUAL'}
                                                onChange={(e) => updateQuantitativeData(item.id, 'inspectionMethod', e.target.value)}
                                            >
                                                <option value="VISUAL">Визуальный обход</option>
                                                <option value="ADDRESSABLE">Адресная система</option>
                                                <option value="TESTING">Функциональные тесты</option>
                                                <option value="MEASUREMENT">Инструм. замеры</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 min-w-[140px]">
                            <div className="flex bg-black/30 rounded-lg p-1 gap-1">
                                <button
                                    onClick={() => updateStatus(item.id, 'OK')}
                                    className={`flex-1 p-2 rounded flex justify-center hover:bg-white/10 transition-colors ${item.status === 'OK' ? 'bg-green-600/80 text-white' : 'text-gray-400'}`}
                                    title="Соответствует"
                                >
                                    <Check className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={() => updateStatus(item.id, 'VIOLATION')}
                                    className={`flex-1 p-2 rounded flex justify-center hover:bg-white/10 transition-colors ${item.status === 'VIOLATION' ? 'bg-red-600/80 text-white' : 'text-gray-400'}`}
                                    title="Нарушение"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={() => updateStatus(item.id, 'WARNING')}
                                    className={`flex-1 p-2 rounded flex justify-center hover:bg-white/10 transition-colors ${item.status === 'WARNING' ? 'bg-yellow-600/80 text-white' : 'text-gray-400'}`}
                                    title="Замечание"
                                >
                                    <AlertTriangle className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={() => updateStatus(item.id, 'NA')}
                                    className={`flex-1 p-2 rounded flex justify-center hover:bg-white/10 transition-colors ${item.status === 'NA' ? 'bg-gray-600/80 text-white' : 'text-gray-400'}`}
                                    title="Не применимо"
                                >
                                    <Minus className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="flex gap-2 relative">
                                {item.status !== 'NOT_CHECKED' && item.status !== 'OK' && item.status !== 'NA' && item.requirement.checkMethod === 'visual' && (!item.photos || item.photos.length === 0) && (
                                    <div className="absolute -top-8 right-0 bg-red-500 text-[9px] font-bold text-white px-2 py-1 rounded animate-bounce shadow-lg shadow-red-500/20 whitespace-nowrap z-10 uppercase">
                                        Нужно фото
                                    </div>
                                )}
                                <button
                                    onClick={() => openComment(item.id, item.comment)}
                                    className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border text-xs font-medium transition-colors ${activeCommentId === item.id ? 'bg-white/10 border-white/20 text-white' : 'border-white/5 bg-white/5 text-gray-400 hover:bg-white/10'
                                        } ${(item.status === 'VIOLATION' || item.status === 'WARNING') && !item.comment ? 'border-red-500/50' : ''}`}
                                >
                                    <MessageSquare className="h-3 w-3" />
                                    {item.comment ? 'Изм.' : 'Комм.'}
                                </button>
                                {/* Camera Button */}
                                <label
                                    className={`flex-1 flex items-center justify-center p-2 rounded-lg border border-white/5 bg-white/5 text-gray-400 hover:bg-white/10 text-xs font-medium cursor-pointer transition-colors ${uploadingId === item.id ? 'opacity-50 pointer-events-none' : ''} ${item.requirement.checkMethod === 'visual' && (item.status === 'VIOLATION' || item.status === 'WARNING') && (!item.photos || item.photos.length === 0) ? 'bg-red-500/10 border-red-500/30' : ''}`}
                                    title="Сделать фото"
                                >
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        className="hidden"
                                        onChange={(e) => handleFileUpload(e, item.id)}
                                        disabled={uploadingId === item.id}
                                    />
                                    <Camera className="h-4 w-4" />
                                </label>
                                {/* Gallery Button */}
                                <label
                                    className={`flex-1 flex items-center justify-center p-2 rounded-lg border border-white/5 bg-white/5 text-gray-400 hover:bg-white/10 text-xs font-medium cursor-pointer transition-colors ${uploadingId === item.id ? 'opacity-50 pointer-events-none' : ''}`}
                                    title="Из галереи"
                                >
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleFileUpload(e, item.id)}
                                        disabled={uploadingId === item.id}
                                    />
                                    <Image className="h-4 w-4" />
                                </label>

                            </div>
                        </div>
                    </div>

                    {/* Comment Input Area */}
                    {activeCommentId === item.id && (
                        <div className="mt-3 pt-3 border-t border-white/5 animate-in fade-in slide-in-from-top-2">
                            <Textarea
                                value={tempComment}
                                onChange={(e) => setTempComment(e.target.value)}
                                placeholder="Описание нарушения или замечания..."
                                className="min-h-[80px] mb-2 bg-black/40"
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <Button size="sm" variant="ghost" onClick={() => setActiveCommentId(null)}>Отмена</Button>
                                <Button size="sm" onClick={() => handleCommentSave(item.id)}>Сохранить</Button>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
