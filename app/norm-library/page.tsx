import Link from "next/link";
import { ArrowLeft, Database, FileText } from "lucide-react";
import { getNormSources } from "@/app/actions/norm-library";
import { CreateNormDialog } from "@/components/norm-library/create-norm-dialog";
import { DeleteNormButton } from "./delete-norm-button";
import { formatDate } from "@/lib/utils";
import { getCurrentUser } from "@/app/actions/team";

// Server Component
export default async function NormLibraryPage() {
    // Fetch data
    const [{ data: norms }, currentUser] = await Promise.all([
        getNormSources(),
        getCurrentUser()
    ]);

    const isAdmin = currentUser?.profile?.role === 'admin';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
            {/* Header */}
            <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-10">
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
                                <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                    <Database className="h-5 w-5 text-blue-400" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">Norm Library</h1>
                                    <p className="text-sm text-blue-200">Нормативная библиотека</p>
                                </div>
                            </div>
                        </div>

                        {/* Action Button */}
                        {isAdmin && <CreateNormDialog />}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="container mx-auto px-6 py-8">

                {/* Filters Panel - TODO: Make functional */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-6">
                    <div className="grid md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Юрисдикция</label>
                            <select className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">Все</option>
                                <option value="KZ">Казахстан (KZ)</option>
                                <option value="RU">Россия (RU)</option>
                                <option value="INT">Международные (INT)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Поиск</label>
                            <input
                                type="text"
                                placeholder="Код или название..."
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Results List */}
                {!norms || norms.length === 0 ? (
                    // Empty State
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-12 text-center">
                        <div className="h-20 w-20 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                            <Database className="h-10 w-10 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                            Нормативная библиотека пуста
                        </h3>
                        <p className="text-gray-400 mb-6 max-w-md mx-auto">
                            Начните с добавления нормативных документов.
                        </p>
                    </div>
                ) : (
                    // Table View
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 border-b border-white/10">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Код / Тип</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Название</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Юрисдикция</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Дата редакции</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Статус</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Действия</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {norms.map((norm) => (
                                    <tr key={norm.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded bg-blue-500/10 flex items-center justify-center">
                                                    <FileText className="h-4 w-4 text-blue-400" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white">{norm.code}</p>
                                                    <p className="text-xs text-gray-400">{norm.docType}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-200 line-clamp-2" title={norm.title}>
                                                {norm.title}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-white/10 text-gray-300">
                                                {norm.jurisdiction}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-400">{formatDate(norm.editionDate)}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${norm.status === 'ACTIVE'
                                                ? 'bg-green-500/10 text-green-400'
                                                : norm.status === 'SUPERSEDED'
                                                    ? 'bg-red-500/10 text-red-400'
                                                    : 'bg-yellow-500/10 text-yellow-400'
                                                }`}>
                                                {norm.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Link href={`/norm-library/${norm.id}`} className="text-sm text-blue-400 hover:text-blue-300">
                                                    Открыть
                                                </Link>
                                                {isAdmin && (
                                                    <>
                                                        <span className="text-gray-600">|</span>
                                                        <DeleteNormButton normId={norm.id} normCode={norm.code} />
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
