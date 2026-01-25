'use client';

import { useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { uploadFileToNorm } from '@/app/actions/norm-library';

export function UploadFileButton({ normId }: { normId: string }) {
    const [uploading, setUploading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const result = await uploadFileToNorm(normId, formData);

            if (result.success) {
                alert('Файл успешно загружен!');
                window.location.reload();
            } else {
                alert(`Ошибка: ${result.error}`);
            }
        } catch (error: any) {
            alert(`Ошибка загрузки: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    return (
        <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg cursor-pointer transition-colors disabled:opacity-50">
            {uploading ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Загрузка...
                </>
            ) : (
                <>
                    <Upload className="h-4 w-4" />
                    Загрузить PDF
                </>
            )}
            <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                disabled={uploading}
                className="hidden"
            />
        </label>
    );
}
