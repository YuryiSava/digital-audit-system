import Link from "next/link";
import { ArrowLeft, MapPin, Calendar, CheckSquare, AlertTriangle, ChevronRight, Clock } from "lucide-react";
import { getProjectById } from "@/app/actions/projects";
import { getProjectFullExecutionData } from "@/app/actions/audit";
import { SyncButton } from "@/components/field/sync-button";
import { formatDate } from "@/lib/utils";
import { UnifiedAuditView } from "@/components/audit/unified-audit-view";

export const dynamic = 'force-dynamic';

export default async function FieldProjectDetails({ params }: { params: { id: string } }) {
    // Fetch full unified data
    const { success, error, project, results } = await getProjectFullExecutionData(params.id);

    if (!success || !project) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
                <p>Проект не найден или ошибка загрузки: {error}</p>
            </div>
        );
    }

    // Calculate stats
    const totalItems = results?.length || 0;
    const completedItems = results?.filter((r: any) => r.status !== 'NOT_CHECKED').length || 0;
    const violationCount = results?.filter((r: any) => r.status === 'VIOLATION').length || 0;

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-6">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-white/5 px-4 py-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Link href="/field" className="p-2 -ml-2 rounded-full active:bg-white/10 transition-colors shrink-0">
                        <ArrowLeft className="h-6 w-6 text-slate-300" />
                    </Link>
                    <h1 className="text-base md:text-lg font-bold leading-tight break-all flex-1 min-w-0 pr-2">{project.name}</h1>
                </div>
                <SyncButton projectId={project.id} />
            </header>

            <main className="p-4 space-y-6">

                {/* Info Card */}
                <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 space-y-4">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            {project.address && (
                                <div className="flex items-center gap-2 text-slate-400 text-sm">
                                    <MapPin className="h-4 w-4 shrink-0" />
                                    <span>{project.address}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-slate-400 text-sm">
                                <Calendar className="h-4 w-4 shrink-0" />
                                <span>{formatDate(project.startDate)}</span>
                            </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${project.status === 'IN_PROGRESS'
                            ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                            }`}>
                            {project.status === 'IN_PROGRESS' ? 'В работе' : project.status}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
                        <div className="bg-slate-950 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                            <span className="text-2xl font-bold text-white">{completedItems}/{totalItems}</span>
                            <span className="text-[10px] text-slate-500 font-medium uppercase mt-1">Прогресс</span>
                        </div>
                        <div className="bg-slate-950 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                            <span className="text-2xl font-bold text-amber-400">{violationCount}</span>
                            <span className="text-[10px] text-slate-500 font-medium uppercase mt-1">Дефекты</span>
                        </div>
                    </div>
                </div>

                {/* Unified Audit View */}
                <div>
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1">
                        Ход аудита
                    </h2>
                    <UnifiedAuditView results={results || []} projectId={project.id} />
                </div>

            </main>
        </div>
    );
}
