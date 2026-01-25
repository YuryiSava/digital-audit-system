'use client';

import { useState } from 'react';
import { Check, X, AlertTriangle, Minus, MessageSquare, Camera, ChevronDown, ChevronUp } from 'lucide-react';
import { Button, Input, Textarea } from '@/components/ui/simple-ui';
import { saveAuditResult } from '@/app/actions/audit';
import { supabase } from '@/lib/supabaseClient';

interface AuditResult {
    id: string;
    requirement: {
        id: string;
        clause: string;
        requirementTextShort: string;
        checkMethod: string;
        severityHint?: string;
    };
    status: string; // NOT_CHECKED, OK, VIOLATION, WARNING, NA
    comment?: string;
    photos?: string[];
}

export interface AuditExecutionListProps {
    results: AuditResult[];
    onResultsChange: (results: AuditResult[]) => void;
    checklistId: string;
}

export function AuditExecutionList({ results, onResultsChange, checklistId }: AuditExecutionListProps) {
    // const [results, setResults] = useState(initialResults); // Removed internal state
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
        // 1. Оптимистичное обновление
        onResultsChange(results.map(r => r.id === id ? { ...r, status: newStatus } : r));

        // 2. Отправка на сервер
        const res = await saveAuditResult(id, newStatus);
        if (!res.success) {
            // Откат, если ошибка (редкий кейс, но можно обработать)
            alert('Ошибка сохранения');
        }
    };

    const handleCommentSave = async (id: string) => {
        onResultsChange(results.map(r => r.id === id ? { ...r, comment: tempComment } : r));
        await saveAuditResult(id, results.find(r => r.id === id)?.status || 'NOT_CHECKED', tempComment);
        setActiveCommentId(null);
    };

    const openComment = (id: string, currentComment?: string) => {
        setActiveCommentId(activeCommentId === id ? null : id);
        setTempComment(currentComment || '');
    };

    // Группировка или просто список? Пока список.
    return (
        <div className="space-y-4">
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
                                <span className="text-xs text-gray-500 uppercase tracking-wider">
                                    {item.requirement.checkMethod}
                                </span>
                            </div>
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

                            <div className="flex gap-2">
                                <button
                                    onClick={() => openComment(item.id, item.comment)}
                                    className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border text-xs font-medium transition-colors ${activeCommentId === item.id ? 'bg-white/10 border-white/20 text-white' : 'border-white/5 bg-white/5 text-gray-400 hover:bg-white/10'
                                        }`}
                                >
                                    <MessageSquare className="h-3 w-3" />
                                    {item.comment ? 'Изм.' : 'Комм.'}
                                </button>
                                <label
                                    className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border border-white/5 bg-white/5 text-gray-400 hover:bg-white/10 text-xs font-medium cursor-pointer transition-colors ${uploadingId === item.id ? 'opacity-50 pointer-events-none' : ''}`}
                                    title="Прикрепить фото"
                                >
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleFileUpload(e, item.id)}
                                        disabled={uploadingId === item.id}
                                    />
                                    <Camera className="h-3 w-3" />
                                    {uploadingId === item.id ? '...' : 'Фото'}
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
