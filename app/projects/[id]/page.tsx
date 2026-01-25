import Link from "next/link";
import { ArrowLeft, Building2, MapPin, Calendar, ClipboardCheck, ArrowRight } from "lucide-react";
import { getProjectById } from "@/app/actions/projects";
import { getProjectChecklists } from "@/app/actions/audit";
import { AddChecklistDialog } from "@/components/audit/add-checklist-dialog";
import { formatDate } from "@/lib/utils";

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
    const { data: project, error } = await getProjectById(params.id);
    const { data: checklists } = await getProjectChecklists(params.id);

    if (error || !project) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Проект не найден</h1>
                    <Link href="/projects" className="text-blue-400 hover:underline">Вернуться к списку</Link>
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
                                href="/projects"
                                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                            >
                                <ArrowLeft className="h-5 w-5" />
                                <span>Проекты</span>
                            </Link>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${project.status === 'COMPLETED' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                                }`}>
                                {project.status === 'PLANNING' ? 'Планирование' : project.status}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="container mx-auto px-6 py-8">

                {/* Project Info Card */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-8 mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">{project.name}</h1>
                            {project.address && (
                                <div className="flex items-center gap-2 text-gray-400 mb-4">
                                    <MapPin className="h-4 w-4" />
                                    <span>{project.address}</span>
                                </div>
                            )}
                            {project.description && (
                                <p className="text-gray-400 max-w-2xl">{project.description}</p>
                            )}
                        </div>

                        <div className="flex flex-col gap-2 text-sm text-gray-500 min-w-[200px] border-l border-white/10 pl-6">
                            <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                <span>{project.customer || 'Заказчик не указан'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>Старт: {formatDate(project.startDate)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Audit Sections */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">Разделы аудита</h2>
                    <AddChecklistDialog projectId={project.id} />
                </div>

                {!checklists || checklists.length === 0 ? (
                    <div className="bg-white/5 border border-dashed border-white/20 rounded-xl p-12 text-center">
                        <div className="h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
                            <ClipboardCheck className="h-8 w-8 text-slate-500" />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-1">Аудит еще не начат</h3>
                        <p className="text-gray-400 text-sm">Добавьте первый раздел (например, АПС), чтобы начать проверку.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {checklists.map((checklist: any) => (
                            <Link
                                key={checklist.id}
                                href={`/audit/${checklist.id}`}
                                className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 hover:border-blue-500/30 transition-all flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                                        {checklist.requirementSet?.system?.name?.[0] || 'A'}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                                            {checklist.requirementSet?.system?.name || 'Система'}
                                        </h3>
                                        <div className="text-sm text-gray-500 flex items-center gap-2">
                                            <span>Версия {checklist.requirementSet?.version}</span>
                                            <span className="w-1 h-1 bg-gray-600 rounded-full" />
                                            <span>ID: {checklist.requirementSet?.requirementSetId}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${checklist.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                                            checklist.status === 'IN_PROGRESS' ? 'bg-yellow-500/20 text-yellow-400' :
                                                'bg-gray-700 text-gray-300'
                                        }`}>
                                        {checklist.status === 'PENDING' ? 'Ожидает' : checklist.status}
                                    </span>
                                    <ArrowRight className="h-5 w-5 text-gray-600 group-hover:text-white transition-colors" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}
