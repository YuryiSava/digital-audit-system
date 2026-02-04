'use client';

import { useState } from 'react';
import { Edit2 } from 'lucide-react';
import { updateNormMetadata } from '@/app/actions/norm-library';

interface EditNormMetadataButtonProps {
    normId: string;
    currentData: {
        docType: string;
        jurisdiction: string;
        category: string | null;
        editionDate: string | null;
        publisher: string | null;
        status: string;
        title: string;
    };
}

export function EditNormMetadataButton({ normId, currentData }: EditNormMetadataButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        docType: currentData.docType,
        jurisdiction: currentData.jurisdiction,
        category: currentData.category || 'Общее',
        editionDate: currentData.editionDate || '',
        publisher: currentData.publisher || '',
        status: currentData.status,
        title: currentData.title
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const result = await updateNormMetadata(normId, formData);

        if (result.success) {
            setIsOpen(false);
            window.location.reload();
        } else {
            alert('Ошибка: ' + result.error);
        }
        setLoading(false);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="p-2 hover:bg-white/10 rounded text-blue-400 transition-colors"
                title="Редактировать"
            >
                <Edit2 className="h-4 w-4" />
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-slate-900 border border-white/10 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto my-8">
                        <h3 className="text-xl font-bold text-white mb-4">Редактировать метаданные</h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Название</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Тип документа</label>
                                <input
                                    type="text"
                                    value={formData.docType}
                                    onChange={(e) => setFormData({ ...formData, docType: e.target.value })}
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white"
                                    placeholder="ГОСТ, СП, СНиП..."
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Юрисдикция</label>
                                <select
                                    value={formData.jurisdiction}
                                    onChange={(e) => setFormData({ ...formData, jurisdiction: e.target.value })}
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white"
                                >
                                    <option value="KZ">Казахстан (KZ)</option>
                                    <option value="RU">Россия (RU)</option>
                                    <option value="INT">Международные (INT)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Раздел системы</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white"
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

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Дата редакции</label>
                                <input
                                    type="date"
                                    value={formData.editionDate}
                                    onChange={(e) => setFormData({ ...formData, editionDate: e.target.value })}
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Издатель</label>
                                <input
                                    type="text"
                                    value={formData.publisher}
                                    onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white"
                                    placeholder="Название организации"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Статус</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white"
                                >
                                    <option value="DRAFT">DRAFT (Черновик)</option>
                                    <option value="ACTIVE">ACTIVE (Действует)</option>
                                    <option value="SUPERSEDED">SUPERSEDED (Утратил силу)</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:bg-blue-600/50"
                                >
                                    {loading ? 'Сохранение...' : 'Сохранить'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded font-medium"
                                >
                                    Отмена
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
