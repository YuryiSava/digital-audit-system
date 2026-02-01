'use client';

import { useState } from 'react';
import { useOfflineSync } from '@/hooks/use-offline-sync';
import {
    CheckCircle2,
    XCircle,
    MinusCircle,
    Camera,
    MessageSquare,
    ChevronDown,
    ChevronUp,
    Loader2,
    CloudOff,
    Cloud
} from 'lucide-react';

import { CameraModal } from './camera-modal';

interface AuditItemCardProps {
    result: any;
    projectId: string;
    projectTitle: string;
}

export function AuditItemCard({ result, projectId, projectTitle }: AuditItemCardProps) {
    const { updateResult, savePhoto, isOnline } = useOfflineSync();
    const [status, setStatus] = useState(result.status);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [comment, setComment] = useState(result.comment || '');
    const [isCommenting, setIsCommenting] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);

    const handlePhotoCapture = async (blob: Blob) => {
        setLoading(true);
        await savePhoto(result.id, projectId, blob);
        setLoading(false);
    };

    const handleStatusUpdate = async (newStatus: string) => {
        if (newStatus === status) return;

        setLoading(true);
        setStatus(newStatus); // Optimistic update
        await updateResult(result.id, newStatus, comment || undefined);
        setLoading(false);
    };

    const handleCommentSave = async () => {
        setLoading(true);
        await updateResult(result.id, status, comment);
        setLoading(false);
        setIsCommenting(false);
    };

    const statusStyles: Record<string, string> = {
        'OK': 'border-emerald-500/50 bg-emerald-500/5 text-emerald-400',
        'DEFECT': 'border-red-500/50 bg-red-500/5 text-red-400',
        'NA': 'border-slate-500/50 bg-slate-500/5 text-slate-400',
        'NOT_CHECKED': 'border-white/5 bg-slate-900/50 text-slate-500'
    };

    return (
        <div className={`relative rounded-2xl border transition-all duration-300 overflow-hidden ${statusStyles[status] || statusStyles.NOT_CHECKED}`}>
            <div className="p-4">
                <div className="flex justify-between items-start gap-4 mb-3">
                    <div className="flex-1" onClick={() => setExpanded(!expanded)}>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-white uppercase tracking-wider">
                                {result.requirement?.clause}
                            </span>
                            {expanded ? <ChevronUp className="h-3 w-3 opacity-50" /> : <ChevronDown className="h-3 w-3 opacity-50" />}
                            {!isOnline && <CloudOff className="h-3 w-3 text-amber-500 ml-auto" />}
                        </div>
                        <p className={`text-sm font-medium leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
                            {result.requirement?.content}
                        </p>
                    </div>
                </div>

                {/* Mobile Action Buttons */}
                <div className="grid grid-cols-3 gap-2 mt-4">
                    <button
                        onClick={() => handleStatusUpdate('OK')}
                        className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${status === 'OK' ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20' : 'bg-white/5 border-white/5 text-slate-400'}`}
                    >
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="text-[10px] font-bold uppercase">Норма</span>
                    </button>
                    <button
                        onClick={() => handleStatusUpdate('DEFECT')}
                        className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${status === 'DEFECT' ? 'bg-red-500 border-red-400 text-white shadow-lg shadow-red-500/20' : 'bg-white/5 border-white/5 text-slate-400'}`}
                    >
                        <XCircle className="h-5 w-5" />
                        <span className="text-[10px] font-bold uppercase">Дефект</span>
                    </button>
                    <button
                        onClick={() => handleStatusUpdate('NA')}
                        className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${status === 'NA' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white/5 border-white/5 text-slate-400'}`}
                    >
                        <MinusCircle className="h-5 w-5" />
                        <span className="text-[10px] font-bold uppercase">Н/П</span>
                    </button>
                </div>

                {/* Context Actions */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                    <button
                        className="flex-[1.5] flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 text-xs font-bold text-slate-300 active:bg-white/10 transition-all border border-white/5"
                        onClick={() => setIsCommenting(!isCommenting)}
                    >
                        <MessageSquare className="h-4 w-4 text-blue-400" />
                        {comment ? 'Заметка' : 'Заметка'}
                    </button>

                    <div className="flex-[2] flex gap-1">
                        <button
                            onClick={() => setIsCameraOpen(true)}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600/10 text-xs font-bold text-blue-400 active:bg-blue-600/20 transition-all border border-blue-500/20"
                        >
                            <Camera className="h-4 w-4" />
                            Снимок
                        </button>

                        <label className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 text-xs font-bold text-slate-300 active:bg-white/10 transition-all border border-white/5 cursor-pointer">
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handlePhotoCapture(file);
                                }}
                            />
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                            Файл
                        </label>
                    </div>
                </div>

                {/* Photo Previews */}
                {result.photos && result.photos.length > 0 && (
                    <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                        {result.photos.map((url: string, idx: number) => (
                            <div key={idx} className="h-16 w-16 rounded-lg bg-slate-800 border border-white/5 overflow-hidden shrink-0">
                                <img src={url} className="h-full w-full object-cover" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Comment Editor */}
                {isCommenting && (
                    <div className="mt-3 space-y-2 animate-in slide-in-from-top-2 duration-200">
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Опишите дефект или примечание..."
                            className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            rows={3}
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleCommentSave}
                                className="flex-1 py-2 bg-blue-600 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-2"
                                disabled={loading}
                            >
                                {loading && <Loader2 className="h-3 w-3 animate-spin" />}
                                Сохранить
                            </button>
                            <button
                                onClick={() => setIsCommenting(false)}
                                className="px-4 py-2 bg-white/5 rounded-lg text-xs font-bold text-slate-400"
                            >
                                Отмена
                            </button>
                        </div>
                    </div>
                )}
            </div>
            {loading && <div className="absolute top-2 right-2"><Loader2 className="h-3 w-3 animate-spin opacity-30" /></div>}

            <CameraModal
                isOpen={isCameraOpen}
                onClose={() => setIsCameraOpen(false)}
                onCapture={handlePhotoCapture}
                metadata={{
                    normReference: result.requirement?.clause,
                    projectTitle: projectTitle
                }}
            />
        </div>
    );
}
