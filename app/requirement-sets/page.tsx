import Link from "next/link";
import { ArrowLeft, Plus, CheckSquare } from "lucide-react";

export default function RequirementSetsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
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
                                <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                                    <CheckSquare className="h-5 w-5 text-green-400" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">Requirement Sets</h1>
                                    <p className="text-sm text-green-200">Каталог требований</p>
                                </div>
                            </div>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                            <Plus className="h-4 w-4" />
                            <span>Создать набор</span>
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
                                Система
                            </label>
                            <select className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500">
                                <option value="">Все</option>
                                <option value="APS">APS - Пожарная сигнализация</option>
                                <option value="SOUE">SOUE - Оповещение и эвакуация</option>
                                <option value="CCTV">CCTV - Видеонаблюдение</option>
                                <option value="ACS">ACS - Контроль доступа</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Юрисдикция
                            </label>
                            <select className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500">
                                <option value="">Все</option>
                                <option value="KZ">Казахстан (KZ)</option>
                                <option value="RU">Россия (RU)</option>
                                <option value="INT">Международные (INT)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Статус
                            </label>
                            <select className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500">
                                <option value="">Все</option>
                                <option value="PUBLISHED">Published</option>
                                <option value="DRAFT">Draft</option>
                                <option value="DEPRECATED">Deprecated</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Поиск
                            </label>
                            <input
                                type="text"
                                placeholder="ID или название..."
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                        <div className="text-2xl font-bold text-green-400">0</div>
                        <div className="text-sm text-gray-400">Всего наборов</div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                        <div className="text-2xl font-bold text-blue-400">0</div>
                        <div className="text-sm text-gray-400">Published</div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                        <div className="text-2xl font-bold text-yellow-400">0</div>
                        <div className="text-sm text-gray-400">Draft</div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                        <div className="text-2xl font-bold text-purple-400">0</div>
                        <div className="text-sm text-gray-400">Требований</div>
                    </div>
                </div>

                {/* Empty State */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-12 text-center">
                    <div className="h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                        <CheckSquare className="h-10 w-10 text-green-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                        Нет наборов требований
                    </h3>
                    <p className="text-gray-400 mb-6 max-w-md mx-auto">
                        Создайте первый Requirement Set для системы (APS, SOUE и т.д.).
                        Требования привязываются к нормативам из Norm Library.
                    </p>
                    <button className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                        <Plus className="h-5 w-5" />
                        <span>Создать первый набор</span>
                    </button>
                </div>

                {/* Instructions */}
                <div className="mt-8 bg-green-500/10 border border-green-500/20 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-green-300 mb-3">
                        💡 Как работают Requirement Sets
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-300">
                        <li className="flex items-start gap-2">
                            <span className="text-green-400 mt-0.5">1.</span>
                            <span>Requirement Set = набор требований по системе (например, RS-APS-KZ-1.0)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-400 mt-0.5">2.</span>
                            <span>Каждое требование имеет уникальный ID: <code className="text-green-300">REQ-APS-KZ-0042</code></span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-400 mt-0.5">3.</span>
                            <span>Требование привязано к <strong>Norm Source</strong> (документ + пункт)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-400 mt-0.5">4.</span>
                            <span>Указывается метод проверки: визуально / документы / испытания / измерения</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-400 mt-0.5">5.</span>
                            <span>Импорт/экспорт XLSX для быстрого наполнения</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-400 mt-0.5">6.</span>
                            <span>Только <strong>Published</strong> наборы можно использовать в аудитах</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
