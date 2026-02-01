'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Save, Loader2, FileText, LayoutTemplate, PenTool, Sparkles } from 'lucide-react';
import { Button, Input, Label, Textarea } from '@/components/ui/simple-ui';
import { updateChecklistDetails } from '@/app/actions/audit';
import { generateAuditReportContent } from '@/app/actions/report-generation';
import { uploadEvidence } from '@/app/actions/storage';

interface ReportSettingsModalProps {
    checklist: any;
    isOpen: boolean;
    onClose: () => void;
}

export function ReportSettingsModal({ checklist, isOpen, onClose }: ReportSettingsModalProps) {
    const [mounted, setMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Settings State
    const [logoUrl, setLogoUrl] = useState('');
    const [facilityDesc, setFacilityDesc] = useState('');
    const [contractNum, setContractNum] = useState('');
    const [auditorName, setAuditorName] = useState('');
    const [auditorTitle, setAuditorTitle] = useState('');

    // Content State
    const [summary, setSummary] = useState('');
    const [risks, setRisks] = useState('');
    const [recommendations, setRecommendations] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize state when checklist changes
    useEffect(() => {
        if (checklist) {
            setLogoUrl(checklist.companyLogoUrl || '');
            setFacilityDesc(checklist.facilityDescription || '');
            setContractNum(checklist.contractNumber || '');
            setAuditorName(checklist.auditorName || '');
            setAuditorTitle(checklist.auditorTitle || '');

            setSummary(checklist.summary || '');
            setRisks(checklist.risks || '');
            setRecommendations(checklist.recommendations || '');
        }
    }, [checklist]);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setIsLoading(true);
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `logos/${fileName}`;

        try {
            const res = await uploadEvidence(file, filePath);

            if (!res.success) throw new Error(res.error);

            setLogoUrl(res.publicUrl!);
        } catch (error: any) {
            console.error('Error uploading logo:', error);
            alert('Ошибка при загрузке логотипа: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!checklist?.id) return;
        setIsLoading(true);
        try {
            const res = await updateChecklistDetails(checklist.id, {
                companyLogoUrl: logoUrl,
                facilityDescription: facilityDesc,
                contractNumber: contractNum,
                auditorName: auditorName,
                auditorTitle: auditorTitle,
                summary: summary,
                risks: risks,
                recommendations: recommendations
            });

            if (!res.success) throw new Error(res.error);

            onClose();
            window.location.reload();
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Не удалось сохранить настройки');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateAI = async () => {
        if (!checklist?.id) return;
        setIsLoading(true);
        try {
            const res = await generateAuditReportContent(checklist.id);
            if (res.success && res.data) {
                if (res.data.summary) setSummary(res.data.summary);
                if (res.data.risks) setRisks(res.data.risks);
                if (res.data.recommendations) setRecommendations(res.data.recommendations);
                alert('✨ Отчет успешно сгенерирован ИИ! Пожалуйста, проверьте текст.');
            } else {
                alert('Не удалось сгенерировать отчет: ' + (res.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('AI Gen Error:', error);
            alert('Ошибка генерации: ' + (error as any).message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl text-white max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 text-blue-400">
                            <LayoutTemplate className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Настройки отчета</h2>
                            <p className="text-xs text-slate-400">Редактирование параметров и содержания</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

                    {/* SECTION 1: DESIGN & AUTHORS */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                            <PenTool className="w-4 h-4 text-emerald-400" />
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Оформление и Авторы</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Logo Column */}
                            <div className="space-y-4">
                                <Label>Логотип компании</Label>
                                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center gap-4">
                                    <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-slate-700 relative group">
                                        {logoUrl ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                                        ) : (
                                            <span className="text-slate-400 text-xs text-center p-2">Логотип не загружен</span>
                                        )}
                                    </div>
                                    <div className="w-full">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            ref={fileInputRef}
                                            onChange={handleFileUpload}
                                        />
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isLoading}
                                            className="w-full text-xs"
                                        >
                                            {isLoading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Upload className="w-3 h-3 mr-2" />}
                                            Загрузить
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Info Column */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Номер договора</Label>
                                    <Input
                                        value={contractNum}
                                        onChange={(e) => setContractNum(e.target.value)}
                                        placeholder="№ 123/24-А"
                                        className="bg-slate-950 border-slate-800"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>ФИО Аудитора</Label>
                                    <Input
                                        value={auditorName}
                                        onChange={(e) => setAuditorName(e.target.value)}
                                        placeholder="Иванов И.И."
                                        className="bg-slate-950 border-slate-800"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Должность</Label>
                                    <Input
                                        value={auditorTitle}
                                        onChange={(e) => setAuditorTitle(e.target.value)}
                                        placeholder="Инженер"
                                        className="bg-slate-950 border-slate-800"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* SECTION 2: CONTENT */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-400" />
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Содержание отчета (DOC-01)</h3>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleGenerateAI}
                                disabled={isLoading}
                                className="h-7 text-xs border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
                            >
                                {isLoading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Sparkles className="w-3 h-3 mr-2" />}
                                Автозаполнение AI
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-blue-200">Заключение аудитора (Summary)</Label>
                                <p className="text-xs text-slate-500 mb-1">Краткое резюме о состоянии системы. Будет отображено в начале отчета.</p>
                                <Textarea
                                    className="min-h-[100px] bg-slate-950 border-slate-800 font-sans"
                                    value={summary}
                                    onChange={(e) => setSummary(e.target.value)}
                                    placeholder="Система находится в удовлетворительном состоянии..."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-red-300">Критические риски</Label>
                                    <p className="text-xs text-slate-500 mb-1">Перечислите главные угрозы (каждый с новой строки).</p>
                                    <Textarea
                                        className="min-h-[120px] bg-slate-950 border-slate-800 text-sm"
                                        value={risks}
                                        onChange={(e) => setRisks(e.target.value)}
                                        placeholder="- Риск отказа системы оповещения&#10;- Отсутствие резервного питания"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-emerald-300">Рекомендации</Label>
                                    <p className="text-xs text-slate-500 mb-1">Основные шаги для устранения проблем.</p>
                                    <Textarea
                                        className="min-h-[120px] bg-slate-950 border-slate-800 text-sm"
                                        value={recommendations}
                                        onChange={(e) => setRecommendations(e.target.value)}
                                        placeholder="- Провести ТО системы&#10;- Заменить аккумуляторы"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* SECTION 3: TECH DESCRIPTION */}
                    <section className="space-y-4">
                        <div className="space-y-2">
                            <Label>Описание объекта (для DOC-02 Technical)</Label>
                            <Textarea
                                className="min-h-[100px] bg-slate-950 border-slate-800"
                                value={facilityDesc}
                                onChange={(e) => setFacilityDesc(e.target.value)}
                                placeholder="Характеристика здания, этажность, тип конструкции..."
                            />
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-900/50 shrink-0 backdrop-blur-md">
                    <Button variant="ghost" onClick={onClose} disabled={isLoading} className="hover:bg-slate-800 text-slate-300">
                        Отмена
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading} className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Сохранить настройки
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
}
