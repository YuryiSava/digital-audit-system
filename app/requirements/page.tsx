import Link from "next/link";
import { ArrowLeft, BookOpen, Layers } from "lucide-react";
import { getRequirementSets } from "@/app/actions/requirements";
import { CreateRequirementSetDialog } from "@/components/requirements/create-set-dialog";
import { formatDate } from "@/lib/utils";

export default async function RequirementsPage() {
    const { data: sets } = await getRequirementSets();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
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
                                <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                    <BookOpen className="h-5 w-5 text-emerald-400" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">Каталоги требований</h1>
                                    <p className="text-sm text-emerald-200">Чек-листы и правила аудита</p>
                                </div>
                            </div>
                        </div>

                        <CreateRequirementSetDialog />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="container mx-auto px-6 py-8">

                {!sets || sets.length === 0 ? (
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-12 text-center">
                        <div className="h-20 w-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                            <Layers className="h-10 w-10 text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                            Каталогов пока нет
                        </h3>
                        <p className="text-gray-400 mb-6 max-w-md mx-auto">
                            Создайте первый каталог требований для начала работы (например, "Чек-лист АПС").
                        </p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sets.map((set: any) => (
                            <Link href={`/requirements/${set.id}`} key={set.id} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-emerald-500/50 transition-colors group cursor-pointer block">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                                            {set.requirementSetId}
                                        </span>
                                        <h3 className="text-lg font-bold text-white mt-2">
                                            {set.system?.name || 'Система'}
                                        </h3>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${set.status === 'PUBLISHED' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                                        }`}>
                                        {set.status}
                                    </span>
                                </div>

                                <p className="text-sm text-gray-400 mb-4 line-clamp-2 min-h-[40px]">
                                    {set.notes || 'Нет описания'}
                                </p>

                                <div className="flex items-center justify-between text-xs text-gray-500 border-t border-white/5 pt-4">
                                    <span>Версия {set.version}</span>
                                    <span>Обновлено {formatDate(set.updatedAt)}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
