import { useState, memo } from 'react';
import { Check, X, AlertTriangle, Minus, MessageSquare, Camera, Image, Ruler, Eye, FileText, Activity, Calculator, Link as LinkIcon } from 'lucide-react';
import { Button, Input, Textarea } from '@/components/ui/simple-ui';
import { supabase } from '@/lib/supabaseClient';
import { DefectAddForm } from './defect-add-form';
import { updateRequirement } from '@/app/actions/requirements';

interface DefectItem {
    id: string;
    description: string;
    location: string;
    photos: string[];
    videoLink?: string;
}

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
    tags?: string[];
    typical_faults?: string[];
}

export interface AuditResult {
    id: string;
    requirement: AuditRequirement;
    status: string;
    comment?: string;
    photos?: string[];
    isMultiple?: boolean;
    totalCount?: number;
    failCount?: number;
    inspectionMethod?: string;
    defect_items?: DefectItem[];
    videoLink?: string;
}

interface AuditResultItemProps {
    item: AuditResult;
    onUpdate: (updatedItem: AuditResult) => void;
    checklistId: string;
}

function AuditResultItemComponent({ item, onUpdate, checklistId }: AuditResultItemProps) {
    const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
    const [tempComment, setTempComment] = useState('');
    const [uploading, setUploading] = useState(false);
    const [isAddingDefect, setIsAddingDefect] = useState(false);

    const handleAddFault = (faultText: string) => {
        const currentComment = tempComment.trim();
        const separator = currentComment.length > 0 ? ', ' : '';
        setTempComment(currentComment + separator + faultText);
    };

    const handleCreateCustomFault = async () => {
        const newFault = prompt("Введите типовую неисправность для этого требования:");
        if (!newFault || !newFault.trim()) return;

        const trimmedFault = newFault.trim();
        const updatedRequirement = {
            ...item.requirement,
            typical_faults: [...(item.requirement.typical_faults || []), trimmedFault]
        };

        // Notify parent about requirement update (optimistic)
        onUpdate({ ...item, requirement: updatedRequirement });

        // Server update
        await updateRequirement(item.requirement.id, {
            typical_faults: updatedRequirement.typical_faults
        });
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${item.id}-${Math.random()}.${fileExt}`;
            const targetChecklistId = (item as any)?.checklistId || checklistId;
            const filePath = `${targetChecklistId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('audit-evidence')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('audit-evidence')
                .getPublicUrl(filePath);

            const currentPhotos = item.photos || [];
            const newPhotos = [...currentPhotos, publicUrl];

            onUpdate({ ...item, photos: newPhotos });
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Ошибка загрузки изображения');
        } finally {
            setUploading(false);
        }
    };

    const handleDeletePhoto = async (photoUrl: string) => {
        if (!confirm('Удалить это фото?')) return;
        const newPhotos = (item.photos || []).filter(p => p !== photoUrl);
        onUpdate({ ...item, photos: newPhotos });
    };

    const updateStatus = (newStatus: string) => {
        onUpdate({ ...item, status: newStatus });
    };

    const handleMainVideoLink = () => {
        const newLink = prompt("Ссылка на видео (YouTube, Google Drive...):", item.videoLink || '');
        if (newLink === null) return; // Cancelled
        onUpdate({ ...item, videoLink: newLink.trim() || undefined });
    };

    const handleCommentSave = () => {
        onUpdate({ ...item, comment: tempComment });
        setActiveCommentId(null);
    };

    const openComment = () => {
        setActiveCommentId(activeCommentId === item.id ? null : item.id);
        setTempComment(item.comment || '');
    };

    const updateQuantitativeData = (field: string, value: any) => {
        let newItem = { ...item, [field]: value };
        if (field === 'failCount' && newItem.totalCount !== undefined && value > newItem.totalCount) {
            newItem.failCount = newItem.totalCount;
        }
        if (field === 'totalCount' && newItem.failCount !== undefined && value < newItem.failCount) {
            newItem.totalCount = value;
            newItem.failCount = value;
        }
        onUpdate(newItem);
    };

    const handleSaveDefect = (description: string, location: string, videoLink?: string) => {
        const newDefectItem: DefectItem = {
            id: crypto.randomUUID(),
            description,
            location,
            photos: [],
            videoLink
        };
        const updatedDefects = [...(item.defect_items || []), newDefectItem];
        const newFailCount = updatedDefects.length;

        onUpdate({
            ...item,
            defect_items: updatedDefects,
            failCount: newFailCount
        });
        setIsAddingDefect(false);
    };

    const handleRemoveDefect = (defectId: string) => {
        if (!confirm('Удалить этот дефект?')) return;
        const updatedDefects = (item.defect_items || []).filter(d => d.id !== defectId);
        const newFailCount = updatedDefects.length;
        onUpdate({
            ...item,
            defect_items: updatedDefects,
            failCount: newFailCount
        });
    };

    const handleDefectFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, defectId: string) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${item.id}_defect_${defectId}_${Math.random()}.${fileExt}`;
            const targetChecklistId = (item as any)?.checklistId || checklistId;
            const filePath = `${targetChecklistId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('audit-evidence')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('audit-evidence')
                .getPublicUrl(filePath);

            const updatedDefects = (item.defect_items || []).map(d => {
                if (d.id === defectId) {
                    return { ...d, photos: [...(d.photos || []), publicUrl] };
                }
                return d;
            });

            onUpdate({ ...item, defect_items: updatedDefects });
        } catch (error) {
            console.error('Error uploading defect image:', error);
            alert('Ошибка загрузки изображения дефекта');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteDefectPhoto = (defectId: string, photoUrl: string) => {
        if (!confirm('Удалить фото дефекта?')) return;
        const updatedDefects = (item.defect_items || []).map(d => {
            if (d.id === defectId) {
                return { ...d, photos: (d.photos || []).filter(p => p !== photoUrl) };
            }
            return d;
        });
        onUpdate({ ...item, defect_items: updatedDefects });
    };

    const handleDefectVideoLink = (defectId: string, currentLink?: string) => {
        const newLink = prompt("Ссылка на видео (YouTube, Google Drive...):", currentLink || '');
        if (newLink === null) return; // Cancelled

        const updatedDefects = (item.defect_items || []).map(d => {
            if (d.id === defectId) {
                return { ...d, videoLink: newLink.trim() || undefined };
            }
            return d;
        });
        onUpdate({ ...item, defect_items: updatedDefects });
    };

    return (
        <div className={`bg-white/5 border rounded-xl p-4 transition-all ${item.status === 'OK' ? 'border-green-500/30 bg-green-500/5' :
            item.status === 'VIOLATION' ? 'border-red-500/30 bg-red-500/5' :
                item.status === 'WARNING' ? 'border-yellow-500/30 bg-yellow-500/5' :
                    'border-white/10 hover:border-white/20'
            }`}>
            <div className="flex flex-col md:flex-row gap-4 justify-between">
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
                        {item.requirement.tags && item.requirement.tags.length > 0 && item.requirement.tags.map((tag, i) => (
                            <span key={i} className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                                {tag}
                            </span>
                        ))}
                    </div>

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
                        {item.videoLink && (
                            <a
                                href={item.videoLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 inline-flex items-center gap-1 text-[10px] bg-blue-900/50 px-1.5 py-0.5 rounded text-blue-300 hover:text-blue-200 hover:bg-blue-800/50 transition-colors align-middle"
                            >
                                <Eye className="w-3 h-3" /> Видео
                            </a>
                        )}
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
                                        <img src={photo} alt="Evidence" className="w-full h-full object-cover" />
                                    </a>
                                    <button
                                        onClick={() => handleDeletePhoto(photo)}
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
                                    onChange={(e) => updateQuantitativeData('isMultiple', e.target.checked)}
                                />
                                <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors underline decoration-dotted underline-offset-4">Множественный объект</span>
                                {item.requirement.isMultipleHint && !item.isMultiple && (
                                    <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse flex items-center gap-1">
                                        <Calculator className="w-2.5 h-2.5" /> AI: Рекомендуется массовая проверка
                                    </span>
                                )}
                            </label>
                        </div>

                        {item.isMultiple && (<>
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
                                        onChange={(e) => updateQuantitativeData('totalCount', parseInt(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-500 uppercase tracking-wider ml-1">Дефектов выявлено</label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            min="0"
                                            readOnly={true}
                                            className={`h-9 bg-black/40 text-sm border-white/10 ${item.failCount && item.failCount > 0 ? 'text-red-400 border-red-500/30' : ''}`}
                                            placeholder="Авто"
                                            value={item.failCount || 0}
                                        />
                                        <div className="absolute right-2 top-2.5 text-[9px] text-slate-500">АВТО</div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-500 uppercase tracking-wider ml-1">Метод проверки</label>
                                    <select
                                        className="w-full h-9 rounded-md bg-black/40 text-sm border border-white/10 px-2 text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all appearance-none"
                                        value={item.inspectionMethod || 'VISUAL'}
                                        onChange={(e) => updateQuantitativeData('inspectionMethod', e.target.value)}
                                    >
                                        <option value="VISUAL">Визуальный обход</option>
                                        <option value="ADDRESSABLE">Адресная система</option>
                                        <option value="TESTING">Функциональные тесты</option>
                                        <option value="MEASUREMENT">Инструм. замеры</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-3 border-t border-white/5 pt-3">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Список дефектов</h4>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-6 text-[10px] border-dashed border-slate-600 hover:border-blue-500 hover:text-blue-400"
                                        onClick={() => setIsAddingDefect(true)}
                                    >
                                        + Добавить дефект
                                    </Button>
                                </div>

                                <div className="space-y-2 mb-3">
                                    {item.defect_items?.map((defect, idx) => (
                                        <div key={defect.id} className="bg-black/20 rounded p-2 text-sm flex flex-col gap-2 group">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="font-medium text-red-200">
                                                        {idx + 1}. {defect.description}
                                                        {defect.videoLink && (
                                                            <a
                                                                href={defect.videoLink}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="ml-2 inline-flex items-center gap-1 text-[10px] bg-red-900/50 px-1.5 py-0.5 rounded text-red-300 hover:text-red-200 hover:bg-red-800/50 transition-colors"
                                                            >
                                                                <Eye className="w-3 h-3" /> Видео
                                                            </a>
                                                        )}
                                                    </div>
                                                    {defect.location && <div className="text-xs text-slate-500">{defect.location}</div>}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <label className={`p-1 rounded bg-white/5 hover:bg-white/10 cursor-pointer text-slate-400 hover:text-slate-200 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`} title="Добавить фото к дефекту">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={(e) => handleDefectFileUpload(e, defect.id)}
                                                            disabled={uploading}
                                                        />
                                                        <Camera className="w-3.5 h-3.5" />
                                                    </label>
                                                    <button
                                                        onClick={() => handleDefectVideoLink(defect.id, defect.videoLink)}
                                                        className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
                                                        title="Добавить/Изменить ссылку на видео"
                                                    >
                                                        <LinkIcon className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemoveDefect(defect.id)}
                                                        className="text-slate-600 hover:text-red-500 px-2 transition-colors"
                                                        title="Удалить дефект"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>

                                            {defect.photos && defect.photos.length > 0 && (
                                                <div className="flex gap-2 flex-wrap mt-1 pl-4 border-l-2 border-white/5">
                                                    {defect.photos.map((photo, pIdx) => (
                                                        <div key={pIdx} className="relative group/photo w-12 h-12">
                                                            <a href={photo} target="_blank" rel="noopener noreferrer" className="block w-full h-full rounded overflow-hidden border border-white/10 hover:border-white/30 transition-colors">
                                                                <img src={photo} alt="Defect Evidence" className="w-full h-full object-cover" />
                                                            </a>
                                                            <button
                                                                onClick={() => handleDeleteDefectPhoto(defect.id, photo)}
                                                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/photo:opacity-100 transition-opacity"
                                                                title="Удалить фото"
                                                            >
                                                                <X className="h-2.5 w-2.5" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {(!item.defect_items || item.defect_items.length === 0) && (
                                        <div className="text-xs text-slate-600 italic text-center py-2">Нет добавленных дефектов</div>
                                    )}
                                </div>
                                {isAddingDefect && (
                                    <DefectAddForm
                                        onSave={handleSaveDefect}
                                        onCancel={() => setIsAddingDefect(false)}
                                    />
                                )}
                            </div>
                        </>)}
                    </div>
                </div>

                <div className="flex flex-col gap-2 min-w-[140px]">
                    <div className="flex bg-black/30 rounded-lg p-1 gap-1">
                        <button
                            onClick={() => updateStatus('OK')}
                            className={`flex-1 p-2 rounded flex justify-center hover:bg-white/10 transition-colors ${item.status === 'OK' ? 'bg-green-600/80 text-white' : 'text-gray-400'}`}
                            title="Соответствует"
                        >
                            <Check className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => updateStatus('VIOLATION')}
                            className={`flex-1 p-2 rounded flex justify-center hover:bg-white/10 transition-colors ${item.status === 'VIOLATION' ? 'bg-red-600/80 text-white' : 'text-gray-400'}`}
                            title="Нарушение"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => updateStatus('WARNING')}
                            className={`flex-1 p-2 rounded flex justify-center hover:bg-white/10 transition-colors ${item.status === 'WARNING' ? 'bg-yellow-600/80 text-white' : 'text-gray-400'}`}
                            title="Замечание"
                        >
                            <AlertTriangle className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => updateStatus('NA')}
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
                            onClick={openComment}
                            className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border text-xs font-medium transition-colors ${activeCommentId === item.id ? 'bg-white/10 border-white/20 text-white' : 'border-white/5 bg-white/5 text-gray-400 hover:bg-white/10'
                                } ${(item.status === 'VIOLATION' || item.status === 'WARNING') && !item.comment ? 'border-red-500/50' : ''}`}
                        >
                            <MessageSquare className="h-3 w-3" />
                            {item.comment ? 'Изм.' : 'Комм.'}
                        </button>
                        <label
                            className={`flex-1 flex items-center justify-center p-2 rounded-lg border border-white/5 bg-white/5 text-gray-400 hover:bg-white/10 text-xs font-medium cursor-pointer transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''} ${item.requirement.checkMethod === 'visual' && (item.status === 'VIOLATION' || item.status === 'WARNING') && (!item.photos || item.photos.length === 0) ? 'bg-red-500/10 border-red-500/30' : ''}`}
                            title="Сделать фото"
                        >
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={handleFileUpload}
                                disabled={uploading}
                            />
                            <Camera className="h-4 w-4" />
                        </label>
                        <label
                            className={`flex-1 flex items-center justify-center p-2 rounded-lg border border-white/5 bg-white/5 text-gray-400 hover:bg-white/10 text-xs font-medium cursor-pointer transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                            title="Из галереи"
                        >
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileUpload}
                                disabled={uploading}
                            />
                            <Image className="h-4 w-4" />
                        </label>
                        <button
                            onClick={handleMainVideoLink}
                            className={`flex-1 flex items-center justify-center p-2 rounded-lg border border-white/5 bg-white/5 text-gray-400 hover:bg-white/10 text-xs font-medium transition-colors ${item.videoLink ? 'border-blue-500/50 text-blue-400' : ''}`}
                            title="Ссылка на видео"
                        >
                            <LinkIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {activeCommentId === item.id && (
                <div className="mt-3 pt-3 border-t border-white/5 animate-in fade-in slide-in-from-top-2">
                    <div className="flex flex-wrap gap-2 mb-3">
                        {item.requirement.typical_faults?.map((fault, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleAddFault(fault)}
                                className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-300 border border-red-500/20 hover:bg-red-500/20 active:bg-red-500/30 transition-colors"
                            >
                                {fault}
                            </button>
                        ))}
                        <button
                            onClick={handleCreateCustomFault}
                            className="text-xs px-2 py-1 rounded bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 transition-colors"
                            title="Добавить свою типовую неисправность"
                        >
                            + Своя
                        </button>
                    </div>

                    <Textarea
                        value={tempComment}
                        onChange={(e) => setTempComment(e.target.value)}
                        placeholder="Описание нарушения или замечания..."
                        className="min-h-[80px] mb-2 bg-black/40"
                        autoFocus
                    />
                    <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setActiveCommentId(null)}>Отмена</Button>
                        <Button size="sm" onClick={handleCommentSave}>Сохранить</Button>
                    </div>
                </div>
            )}
        </div>
    );
}

export const AuditResultItem = memo(AuditResultItemComponent);
