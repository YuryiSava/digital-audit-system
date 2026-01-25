import Link from "next/link";
import { ArrowLeft, Plus, FileText } from "lucide-react";

export default function AuditsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
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
                                <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                    <FileText className="h-5 w-5 text-purple-400" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">Audits</h1>
                                    <p className="text-sm text-purple-200">Управление аудитами</p>
                                </div>
                            </div>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                            <Plus className="h-4 w-4" />
                            <span>Создать аудит</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="container mx-auto px-6 py-8">
                {/* Filters */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-6">
                    <div className="grid md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Статус
                            </label>
                            <select className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                                <option value="">Все</option>
                                <option value="DRAFT">Draft</option>
                                <option value="PRE_AUDIT">Pre-Audit</option>
                                <option value="FIELD">Field</option>
                                <option value="REVIEW">Review</option>
                                <option value="QC">QC</option>
                                <option value="COMPLETED">Completed</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Системы
                            </label>
                            <select className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                                <option value="">Все</option>
                                <option value="APS">APS</option>
                                <option value="SOUE">SOUE</option>
                                <option value="CCTV">CCTV</option>
                                <option value="ACS">ACS</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Период
                            </label>
                            <select className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                                <option value="">Все время</option>
                                <option value="week">Эта неделя</option>
                                <option value="month">Этот месяц</option>
                                <option value="quarter">Этот квартал</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Поиск
                            </label>
                            <input
                                type="text"
                                placeholder="Объект или ID..."
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid md:grid-cols-5 gap-4 mb-6">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                        <div className="text-2xl font-bold text-purple-400">0</div>
                        <div className="text-sm text-gray-400">Всего</div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                        <div className="text-2xl font-bold text-yellow-400">0</div>
                        <div className="text-sm text-gray-400">Pre-Audit</div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                        <div className="text-2xl font-bold text-blue-400">0</div>
                        <div className="text-sm text-gray-400">Field</div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                        <div className="text-2xl font-bold text-orange-400">0</div>
                        <div className="text-sm text-gray-400">Review</div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                        <div className="text-2xl font-bold text-green-400">0</div>
                        <div className="text-sm text-gray-400">Completed</div>
                    </div>
                </div>

                {/* Empty State */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-12 text-center">
                    <div className="h-20 w-20 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                        <FileText className="h-10 w-10 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                        Нет аудитов
                    </h3>
                    <p className="text-gray-400 mb-6 max-w-md mx-auto">
                        Создайте первый аудит. Процесс: Pre-Audit → Field → Review → QC → Reports
                    </p>
                    <button className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                        <Plus className="h-5 w-5" />
                        <span>Создать первый аудит</span>
                    </button>
                </div>

                {/* Workflow Info */}
                <div className="mt-8 bg-purple-500/10 border border-purple-500/20 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-purple-300 mb-4">
                        🔄 Жизненный цикл аудита
                    </h4>
                    <div className="grid md:grid-cols-5 gap-4">
                        <div className="bg-white/5 rounded-lg p-4">
                            <div className="text-2xl mb-2">1️⃣</div>
                            <h5 className="font-semibold text-white mb-1">Pre-Audit</h5>
                            <p className="text-xs text-gray-400">
                                Scope, нормы, требования, freeze baseline
                            </p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-4">
                            <div className="text-2xl mb-2">2️⃣</div>
                            <h5 className="font-semibold text-white mb-1">Field</h5>
                            <p className="text-xs text-gray-400">
                                Чек-листы, дефекты, фото, протоколы
                            </p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-4">
                            <div className="text-2xl mb-2">3️⃣</div>
                            <h5 className="font-semibold text-white mb-1">Review</h5>
                            <p className="text-xs text-gray-400">
                                Severity, requirement_id, финализация
                            </p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-4">
                            <div className="text-2xl mb-2">4️⃣</div>
                            <h5 className="font-semibold text-white mb-1">QC</h5>
                            <p className="text-xs text-gray-400">
                                Контроль качества, валидация
                            </p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-4">
                            <div className="text-2xl mb-2">5️⃣</div>
                            <h5 className="font-semibold text-white mb-1">Reports</h5>
                            <p className="text-xs text-gray-400">
                                DOC-01...DOC-08, ZIP экспорт
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
