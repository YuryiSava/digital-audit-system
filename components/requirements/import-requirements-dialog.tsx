'use client';

import { useState, useEffect } from 'react';
import { Upload, X, FileSpreadsheet } from 'lucide-react';
import { Button, Input, Label, Textarea } from '@/components/ui/simple-ui';
import { createRequirementsBatch, getNormSourcesListForSelect } from '@/app/actions/requirements';

interface ImportRequirementsDialogProps {
    requirementSetId: string;
    systemId: string; // "APS"
}

export function ImportRequirementsDialog({ requirementSetId, systemId }: ImportRequirementsDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const [norms, setNorms] = useState<any[]>([]);
    const [selectedNormId, setSelectedNormId] = useState('');
    const [csvContent, setCsvContent] = useState(''); // <-- ВОТ ОНА, ПОТЕРЯННАЯ СТРОКА!

    useEffect(() => {
        if (isOpen) {
            getNormSourcesListForSelect().then(data => {
                setNorms(data);
                if (data.length > 0 && !selectedNormId) {
                    setSelectedNormId(data[0].id);
                }
            });
        }
    }, [isOpen]);

    const handleImport = async () => {
        if (!csvContent.trim()) {
            setError("Введите данные для импорта");
            return;
        }
        if (!selectedNormId) {
            setError("Выберите нормативный документ");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const lines = csvContent.split('\n');
            const items = [];

            for (const line of lines) {
                if (!line.trim()) continue;

                let parts = line.split(';');
                if (parts.length < 2) parts = line.split('\t');
                if (parts.length < 2) {
                    const match = line.match(/^([\d\.]+)\s+(.+)$/);
                    if (match) {
                        parts = [match[1], match[2]];
                    }
                }

                if (parts.length >= 2) {
                    const clause = parts[0].trim();
                    const text = parts.slice(1).join(' ').trim();

                    if (clause && text) {
                        items.push({
                            requirementSetId,
                            systemId,
                            normSourceId: selectedNormId,
                            clause: clause.replace(/[\.;]+$/, ''),
                            requirementTextShort: text,
                            checkMethod: 'visual',
                            severityHint: 'medium'
                        });
                    }
                }
            }

            if (items.length === 0) {
                setError("Не удалось распознать строки. Используйте формат: Пункт; Текст");
                setLoading(false);
                return;
            }

            const res = await createRequirementsBatch(items);

            if (res.success) {
                setSuccessMsg(`Успешно импортировано: ${res.count} записей`);
                setCsvContent('');
                setTimeout(() => {
                    setIsOpen(false);
                    setSuccessMsg(null);
                }, 1500);
            } else {
                //@ts-ignore
                setError(res.error || "Ошибка импорта");
            }

        } catch (err: any) {
            setError(err.message || "Ошибка обработки");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <Button variant="secondary" size="sm" onClick={() => setIsOpen(true)}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Импорт CSV
            </Button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#1e1e24] border border-white/10 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] my-auto">
                <div className="flex items-center justify-between p-6 border-b border-white/10 flex-none bg-[#1e1e24] rounded-t-xl z-10">
                    <h2 className="text-xl font-semibold text-white">Массовый импорт требований</h2>
                    <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors p-1">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">

                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-200">
                        <p className="font-semibold mb-1">Как использовать:</p>
                        1. Скопируйте таблицу из Excel или результаты AI.<br />
                        2. Формат: <strong>Номер пункта; Текст требования</strong><br />
                        3. Разделитель: точка с запятой (;), Tab или пробел после номера.
                    </div>

                    <div className="space-y-2">
                        <Label>Нормативный документ (источник)</Label>
                        <select
                            className="w-full flex h-10 rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={selectedNormId}
                            onChange={(e) => setSelectedNormId(e.target.value)}
                            disabled={norms.length === 0}
                        >
                            {norms.length === 0 ? <option>!!! Сначала создайте норматив !!!</option> : null}
                            {norms.map(norm => (
                                <option key={norm.id} value={norm.id}>
                                    {norm.code} — {norm.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label>Данные (CSV / Excel)</Label>
                        <Textarea
                            value={csvContent}
                            onChange={(e) => setCsvContent(e.target.value)}
                            placeholder={`5.1; Извещатели должны быть установлены на потолке\n5.2; Расстояние до осветительных приборов не менее 0.5м`}
                            className="min-h-[200px] font-mono text-xs"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded p-3 text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    {successMsg && (
                        <div className="bg-green-500/10 border border-green-500/20 rounded p-3 text-sm text-green-400">
                            {successMsg}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-white/10 mt-6">
                        <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                            Отмена
                        </Button>
                        <Button onClick={handleImport} disabled={loading || !selectedNormId}>
                            {loading ? 'Импорт...' : 'Импортировать'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
