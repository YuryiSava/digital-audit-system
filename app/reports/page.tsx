import Link from "next/link";
import { ArrowLeft, FileSpreadsheet, Download } from "lucide-react";

export default function ReportsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900">
            {/* Header */}
            <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/"
                                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                            >
                                <ArrowLeft className="h-5 w-5" />
                                <span>Назад</span>
                            </Link>
                            <div className="h-6 w-px bg-white/20" />
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                                    <FileSpreadsheet className="h-5 w-5 text-orange-400" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">Reports</h1>
                                    <p className="text-sm text-orange-200">Генерация отчетов</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="container mx-auto px-6 py-8">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-12 text-center">
                    <div className="h-20 w-20 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
                        <Download className="h-10 w-10 text-orange-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                        Модуль отчетов в разработке
                    </h3>
                    <p className="text-gray-400 mb-6 max-w-md mx-auto">
                        Здесь будет генерация пакета документов DOC-01...DOC-08 (PDF/XLSX) и ZIP архивов.
                        <br />Модуль будет реализован на Этапе 7.
                    </p>
                </div>
            </div>
        </div>
    );
}
