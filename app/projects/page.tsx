import Link from "next/link";
import { ArrowLeft, Briefcase, MapPin, Calendar, Building2 } from "lucide-react";
import { getProjects } from "@/app/actions/projects";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { formatDate } from "@/lib/utils";

export default async function ProjectsPage() {
    const { data: projects } = await getProjects();

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
                                <span>Главная</span>
                            </Link>
                            <div className="h-6 w-px bg-white/20" />
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                    <Briefcase className="h-5 w-5 text-blue-400" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">Проекты аудита</h1>
                                    <p className="text-sm text-blue-200">Управление объектами</p>
                                </div>
                            </div>
                        </div>

                        <CreateProjectDialog />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="container mx-auto px-6 py-8">

                {!projects || projects.length === 0 ? (
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-12 text-center">
                        <div className="h-20 w-20 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                            <Building2 className="h-10 w-10 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                            Проектов пока нет
                        </h3>
                        <p className="text-gray-400 mb-6 max-w-md mx-auto">
                            Создайте первый проект, чтобы начать проводить аудиты объектов.
                        </p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map((project: any) => (
                            <Link href={`/projects/${project.id}`} key={project.id} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-blue-500/50 transition-colors group cursor-pointer block">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                                            {project.name}
                                        </h3>
                                        {project.customer && (
                                            <p className="text-sm text-gray-400 mt-1">{project.customer}</p>
                                        )}
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${project.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                                        }`}>
                                        {project.status === 'PLANNING' ? 'Планирование' :
                                            project.status === 'IN_PROGRESS' ? 'В работе' : project.status}
                                    </span>
                                </div>

                                <div className="space-y-2 mb-4">
                                    {project.address && (
                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                            <MapPin className="h-4 w-4 text-gray-500" />
                                            <span>{project.address}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        <Calendar className="h-4 w-4 text-gray-500" />
                                        <span>Начат: {formatDate(project.startDate)}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end text-xs text-gray-500 border-t border-white/5 pt-4">
                                    <span>Обновлено {formatDate(project.updatedAt)}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
