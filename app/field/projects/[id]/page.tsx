import Link from "next/link";
import { ArrowLeft, MapPin, Calendar, CheckSquare, AlertTriangle, ChevronRight, Clock } from "lucide-react";
import { getProjectById } from "@/app/actions/projects";
import { getProjectChecklists } from "@/app/actions/audit";
import { SyncButton } from "@/components/field/sync-button";
import { formatDate } from "@/lib/utils";

export const dynamic = 'force-dynamic';

export default async function FieldProjectDetails({ params }: { params: { id: string } }) {
    const { data: project } = await getProjectById(params.id);
    const { data: checklists } = await getProjectChecklists(params.id);

    if (!project) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
                <p>Проект не найден</p>
            </div>
        );
    }

    // Calculate generic stats
    const totalChecklists = checklists?.length || 0;
    const completedChecklists = checklists?.filter((c: any) => c.status === 'COMPLETED').length || 0;
    const inProgressChecklists = checklists?.filter((c: any) => c.status === 'IN_PROGRESS').length || 0;

    // Calculate total defects/violations from all checklists
    const riskCount = checklists?.reduce((total: number, checklist: any) => {
        const violations = checklist.results?.filter((r: any) => r.status === 'VIOLATION').length || 0;
        return total + violations;
    }, 0) || 0;

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
                            <span className="text-2xl font-bold text-white">{completedChecklists}/{totalChecklists}</span>
                            <span className="text-[10px] text-slate-500 font-medium uppercase mt-1">Систем проверено</span>
                        </div>
                        <div className="bg-slate-950 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                            <span className="text-2xl font-bold text-amber-400">{riskCount}</span>
                            <span className="text-[10px] text-slate-500 font-medium uppercase mt-1">Дефектов</span>
                        </div>
                    </div>
                </div>

                {/* Checklists List */}
                <div>
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1">
                        Разделы аудита
                    </h2>

                    {!checklists || checklists.length === 0 ? (
                        <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-white/10">
                            <p className="text-slate-500 mb-2">Нет назначенных разделов</p>
                            <p className="text-xs text-slate-600">Попросите менеджера добавить чек-листы в проект</p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {checklists.map((checklist: any) => (
                                <Link
                                    key={checklist.id}
                                    href={`/field/checklist/${checklist.id}`}
                                    className="bg-slate-900 border border-white/5 rounded-2xl p-4 active:scale-[0.98] active:bg-slate-800 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Status Icon */}
                                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border ${checklist.status === 'COMPLETED'
                                            ? 'bg-green-500/10 border-green-500/20 text-green-500'
                                            : checklist.status === 'IN_PROGRESS'
                                                ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                                : 'bg-slate-800 border-white/5 text-slate-500'
                                            }`}>
                                            {checklist.status === 'COMPLETED' ? (
                                                <CheckSquare className="h-6 w-6" />
                                            ) : checklist.status === 'IN_PROGRESS' ? (
                                                <Clock className="h-6 w-6" />
                                            ) : (
                                                <div className="text-lg font-bold">
                                                    {(checklist.requirementSet?.name || checklist.requirementSet?.system?.name)?.[0] || 'N'}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-bold text-slate-200 text-base truncate pr-2">
                                                    {checklist.requirementSet?.name || checklist.requirementSet?.system?.name || 'Без названия'}
                                                </h3>
                                                <ChevronRight className="h-5 w-5 text-slate-600" />
                                            </div>
                                            <p className="text-xs text-slate-500 truncate mt-0.5">
                                                {checklist.requirementSet?.notes || 'Версия ' + (checklist.requirementSet?.version || '1.0')}
                                            </p>

                                            {/* Mini Progress Bar if needed, or status text */}
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${checklist.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' :
                                                    checklist.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-400' :
                                                        'bg-slate-800 text-slate-500'
                                                    }`}>
                                                    {checklist.status === 'PENDING' ? 'Не начато' :
                                                        checklist.status === 'IN_PROGRESS' ? 'В процессе' :
                                                            checklist.status === 'COMPLETED' ? 'Готово' : checklist.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
}
