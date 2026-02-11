import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex h-screen flex-col items-center justify-center bg-slate-900 text-white">
            <h2 className="text-4xl font-bold mb-4">404</h2>
            <p className="text-xl mb-8">Страница не найдена</p>
            <Link
                href="/"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
                Вернуться на главную
            </Link>
        </div>
    );
}
