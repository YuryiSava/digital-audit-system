'use client';

import { Sparkles, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { parseAllNorms } from '@/app/actions/external-parser';

export function ParseAllButton() {
    const [isParsing, setIsParsing] = useState(false);
    const [progress, setProgress] = useState('');

    const handleParseAll = async () => {
        if (!confirm('Запустить парсинг ВСЕХ нормативов с PDF файлами? Это может занять несколько минут.')) {
            return;
        }

        setIsParsing(true);
        setProgress('Запуск пакетной обработки...');

        try {
            const result = await parseAllNorms();

            if (result.success) {
                alert(`✅ Успех!\n\nОбработано: ${result.processed}\nУспешно: ${result.successful}\nОшибок: ${result.failed}`);
                window.location.reload();
            } else {
                alert(`❌ Ошибка: ${result.error}`);
            }
        } catch (error: any) {
            alert(`❌ Ошибка: ${error.message}`);
        } finally {
            setIsParsing(false);
            setProgress('');
        }
    };

    return (
        <button
            onClick={handleParseAll}
            disabled={isParsing}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 disabled:bg-purple-600/10 text-purple-400 disabled:text-purple-500 rounded-lg transition-colors text-sm font-medium disabled:cursor-not-allowed"
            title="Пакетная обработка всех нормативов с PDF файлами"
        >
            {isParsing ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {progress || 'Обработка...'}
                </>
            ) : (
                <>
                    <Sparkles className="h-4 w-4" />
                    Парсинг всех нормативов
                </>
            )}
        </button>
    );
}
