'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="flex h-screen flex-col items-center justify-center bg-slate-900 text-white">
            <h2 className="text-2xl font-bold mb-4">Что-то пошло не так!</h2>
            <p className="text-slate-400 mb-8 max-w-md text-center">
                Произошла ошибка при загрузке страницы. Попробуйте обновить ее.
            </p>
            <div className="flex gap-4">
                <button
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    onClick={
                        // Attempt to recover by trying to re-render the segment
                        () => reset()
                    }
                >
                    Попробовать снова
                </button>
                <a
                    href="/"
                    className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                >
                    На главную
                </a>
            </div>
        </div>
    );
}
