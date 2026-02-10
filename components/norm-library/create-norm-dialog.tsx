'use client';

import { useState } from 'react';
import { Plus, X, Upload } from 'lucide-react';
import { Button, Input, Label } from '@/components/ui/simple-ui';
import { createNormSource } from '@/app/actions/norm-library';

export function CreateNormDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        jurisdiction: 'KZ',
        docType: 'СН РК',
        code: '',
        title: '',
        category: 'Общее',
        publisher: '',
        editionDate: '',
    });

    const [file, setFile] = useState<File | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const data = new FormData();
            data.append('jurisdiction', formData.jurisdiction);
            data.append('docType', formData.docType);
            data.append('code', formData.code);
            data.append('title', formData.title);
            // category field not in DB yet, skipping for now
            // data.append('category', formData.category);
            data.append('publisher', formData.publisher);
            data.append('editionDate', formData.editionDate);
            data.append('status', 'DRAFT');

            if (file) {
                data.append('file', file);
            }

            const res = await createNormSource(data);

            if (res.success) {
                setIsOpen(false);
                setFormData({
                    jurisdiction: 'KZ',
                    docType: 'СН РК',
                    code: '',
                    title: '',
                    category: 'Общее',
                    publisher: '',
                    editionDate: '',
                });
                setFile(null);
            } else {
                console.error("Save error details:", res.error);
                const errorMsg = typeof res.error === 'string'
                    ? res.error
                    : JSON.stringify(res.error, null, 2);

                if (errorMsg.includes('Unique constraint')) {
                    setError(`Ошибка: Норматив с таким кодом "${formData.code}" уже существует!`);
                } else {
                    setError(errorMsg);
                }
            }
        } catch (err) {
            setError("Произошла неожиданная ошибка при отправке");
            console.error(err);
        }
        setLoading(false);
    };

    if (!isOpen) {
        return (
            <Button onClick={() => setIsOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить норматив
            </Button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#1e1e24] border border-white/10 rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] my-auto text-white">
                <div className="flex items-center justify-between p-6 border-b border-white/10 flex-none bg-[#1e1e24] rounded-t-xl z-10">
                    <h2 className="text-xl font-semibold text-white">Новый норматив</h2>
                    <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors p-1">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Юрисдикция</Label>
                                <select
                                    className="w-full flex h-10 rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.jurisdiction}
                                    onChange={(e) => setFormData({ ...formData, jurisdiction: e.target.value })}
                                >
                                    <option value="KZ">Казахстан (KZ)</option>
                                    <option value="RU">Россия (RU)</option>
                                    <option value="INT">International (INT)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Тип документа</Label>
                                <Input
                                    value={formData.docType}
                                    onChange={(e) => setFormData({ ...formData, docType: e.target.value })}
                                    placeholder="СН, ГОСТ, СП..."
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Шифр / Номер</Label>
                            <div className="relative">
                                <Input
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    placeholder="Например: СН РК 2.02-01-2019"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Название</Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Пожарная автоматика зданий и сооружений"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Раздел / Категория</Label>
                            <select
                                className="w-full flex h-10 rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="Общее">Общее</option>
                                <option value="Пожарная безопасность">Пожарная безопасность</option>
                                <option value="ОВИК">ОВИК (Отопление, вентиляция)</option>
                                <option value="ВК">ВК (Водопровод, канализация)</option>
                                <option value="Электротехника">Электротехника</option>
                                <option value="Конструктив">Конструктив</option>
                                <option value="Архитектура">Архитектура</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Издатель / Разработчик</Label>
                                <Input
                                    value={formData.publisher}
                                    onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                                    placeholder="МЧС РК, КазНИИСА и т.д."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Дата редакции</Label>
                                <Input
                                    type="date"
                                    value={formData.editionDate}
                                    onChange={(e) => setFormData({ ...formData, editionDate: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* File Upload Section */}
                        <div className="space-y-2 pt-2 border-t border-white/5">
                            <Label>Файл норматива (PDF)</Label>
                            <div className="relative">
                                <input
                                    type="file"
                                    id="norm-file-upload"
                                    accept=".pdf,.doc,.docx"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setFile(e.target.files[0]);
                                        }
                                    }}
                                />
                                <label
                                    htmlFor="norm-file-upload"
                                    className="flex flex-col items-center justify-center w-full h-24 border-2 border-white/10 border-dashed rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
                                >
                                    {file ? (
                                        <div className="flex items-center gap-2 text-blue-400">
                                            <FileText className="w-5 h-5" />
                                            <span className="text-sm font-medium truncate max-w-[200px]">{file.name}</span>
                                            <span className="text-xs text-slate-500">
                                                ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-1 text-slate-400">
                                            <Upload className="w-6 h-6 mb-1" />
                                            <span className="text-sm">Нажмите для выбора файла</span>
                                            <span className="text-[10px] text-slate-600">PDF, DOCX до 10MB</span>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded p-3 text-sm text-red-400">
                                {error}
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4 border-t border-white/10 mt-6">
                            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                                Отмена
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Сохранение...' : 'Создать'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

// Small icon helper if not imported
function FileText(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
        </svg>
    )
}
