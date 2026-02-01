import Link from "next/link";
import {
    ArrowLeft,
    ClipboardCheck,
    Shield,
    LayoutDashboard,
    Search,
    Settings,
    ChevronRight,
    Clock
} from "lucide-react";
import { getProjects } from "@/app/actions/projects";

export const dynamic = 'force-dynamic';

export default async function FieldAuditListPage() {
    const { data: projects } = await getProjects();

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-24">
            {/* Header */}
            <header className="p-4 flex items-center justify-between border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <Link href="/field" className="text-slate-400">
                        <ArrowLeft className="h-6 w-6" />
                    </Link>
                    <h1 className="text-lg font-bold">Выбор аудита</h1>
                </div>
            </header>

            <main className="p-4 space-y-6">
                <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                        <ClipboardCheck className="h-6 w-6" />
                    </div>
                    <p className="text-xs text-blue-100 leading-snug">
                        Выберите проект для продолжения работы с чек-листами.
                    </p>
                </div>

                <div className="space-y-3">
                    {projects && projects.length > 0 ? (
                        projects.map((project: any) => (
                            <Link key={project.id} href={`/field/projects/${project.id}`}>
                                <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 flex items-center justify-between active:bg-slate-800 transition-colors">
                                    <div className="flex items-center gap-4 truncate">
                                        <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                                            <Shield className="h-5 w-5" />
                                        </div>
                                        <div className="truncate">
                                            <h4 className="font-bold text-slate-100 truncate">{project.name}</h4>
                                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase">
                                                <Clock className="h-3 w-3" />
                                                <span>Обновлен {new Date(project.updatedAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-slate-700 shrink-0" />
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="text-center py-12 bg-slate-900/50 border border-dashed border-white/10 rounded-3xl">
                            <ClipboardCheck className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-slate-300">Проекты не найдены</h3>
                            <p className="text-xs text-slate-500 max-w-[200px] mx-auto mt-2 mb-6">
                                Похоже, у вас нет назначенных проектов или база данных пуста.
                            </p>
                            <Link href="/" className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-bold active:scale-95 transition-all">
                                На главную
                            </Link>
                        </div>
                    )}
                </div>
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-xl border-t border-white/10 px-6 py-3 flex items-center justify-between pointer-events-auto">
                <Link href="/field" className="flex flex-col items-center gap-1 text-slate-500">
                    <LayoutDashboard className="h-6 w-6" />
                    <span className="text-[10px] font-bold">Главная</span>
                </Link>
                <Link href="/field/audit" className="flex flex-col items-center gap-1 text-blue-500">
                    <ClipboardCheck className="h-6 w-6" />
                    <span className="text-[10px] font-bold">Аудит</span>
                </Link>
                <Link href="/field/search" className="flex flex-col items-center gap-1 text-slate-500">
                    <Search className="h-6 w-6" />
                    <span className="text-[10px] font-bold">Поиск</span>
                </Link>
                <Link href="/field/profile" className="flex flex-col items-center gap-1 text-slate-500">
                    <Settings className="h-6 w-6" />
                    <span className="text-[10px] font-bold">Профиль</span>
                </Link>
            </nav>
        </div>
    );
}
