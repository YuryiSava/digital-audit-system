'use client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html>
            <body className="bg-slate-900 text-white flex items-center justify-center h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Критическая ошибка!</h2>
                    <p className="mb-8">Произошла ошибка на уровне приложения.</p>
                    <button
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
                        onClick={() => reset()}
                    >
                        Попробовать снова
                    </button>
                </div>
            </body>
        </html>
    );
}
