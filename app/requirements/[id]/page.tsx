import Link from "next/link";
import { ArrowLeft, BookOpen, Clock, FileText, Settings, AlertTriangle } from "lucide-react";
import { getRequirementSetById } from "@/app/actions/requirements";
import { CreateRequirementDialog } from "@/components/requirements/create-requirement-dialog";
import { ImportRequirementsDialog } from "@/components/requirements/import-requirements-dialog";
import { RequirementsList } from "@/components/requirements/requirements-list";
import { formatDate } from "@/lib/utils";

export default async function RequirementSetDetailPage({ params }: { params: { id: string } }) {
    const { data: set, error } = await getRequirementSetById(params.id);

    if (error || !set) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Каталог не найден</h1>
                    <Link href="/requirements" className="text-emerald-400 hover:underline">Вернуться к списку</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
            {/* Header */}
            <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-10">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/requirements"
                                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                            >
                                <ArrowLeft className="h-5 w-5" />
                                <span className="hidden sm:inline">Каталоги</span>
                            </Link>
                            <div className="h-6 w-px bg-white/20" />
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-lg font-bold text-white">{set.system?.name} v{set.version}</h1>
                                    <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                                        {set.requirementSetId}
                                    </span>
                                </div>
                                <p className="text-xs text-emerald-200/70 truncate max-w-[300px]">{set.notes || 'Без описания'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <ImportRequirementsDialog requirementSetId={set.id} systemId={set.systemId} />
                            <CreateRequirementDialog requirementSetId={set.id} systemId={set.systemId} />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="container mx-auto px-6 py-8">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
                    Список требований
                    <span className="bg-white/10 text-gray-300 text-xs px-2 py-1 rounded-full">
                        {set.requirements?.length || 0}
                    </span>
                </h2>

                <RequirementsList
                    initialRequirements={set.requirements || []}
                    setId={set.id}
                />
            </div>
        </div>
    );
}
