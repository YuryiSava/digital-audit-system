import Link from "next/link";
import {
    LayoutDashboard,
    ClipboardCheck,
    Clock,
    Settings,
    Search,
    Plus,
    User,
    Shield
} from "lucide-react";
import { getProjects } from "@/app/actions/projects";
import { getCurrentUser } from "@/app/actions/team";
import { SyncButton } from "@/components/field/sync-button";

export const dynamic = 'force-dynamic';

export default async function FieldDashboard() {
    const { data: projects } = await getProjects();
    const currentUser = await getCurrentUser();

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-24">
            {/* Mobile Header */}
            <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-white/5 px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                        <Shield className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold leading-tight">Field App</h1>
                        <p className="text-[10px] text-blue-400 uppercase font-bold tracking-widest">Engineer Workspace</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <SyncButton />
                    <div className="h-10 w-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden">
                        {currentUser?.profile?.full_name?.charAt(0) || <User className="h-5 w-5 text-slate-400" />}
                    </div>
                </div>
            </header>

            <main className="p-4 space-y-6">
                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Поиск проектов или систем..."
                        className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                    />
                </div>

                {/* Quick Info Card */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-5 shadow-xl shadow-blue-500/20 relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-blue-100 text-sm font-medium mb-1">Привет, {currentUser?.profile?.full_name?.split(' ')[0] || 'Инженер'}!</h2>
                        <p className="text-2xl font-bold mb-4">У вас {projects?.length || 0} активных проектов</p>
                        <Link href="/field/audit" className="inline-flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-xl text-sm font-bold active:scale-95 transition-all">
                            <Plus className="h-4 w-4" />
                            Начать новый аудит
                        </Link>
                    </div>
                    <div className="absolute -right-4 -bottom-4 opacity-20 transform rotate-12">
                        <ClipboardCheck className="h-32 w-32" />
                    </div>
                </div>

                {/* Projects Section */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <LayoutDashboard className="h-5 w-5 text-slate-400" />
                            Мои проекты
                        </h3>
                        <Link href="/field/projects" className="text-xs text-blue-400 font-bold uppercase tracking-wider">Все</Link>
                    </div>

                    <div className="grid gap-3">
                        {projects?.map((project: any) => (
                            <Link key={project.id} href={`/field/projects/${project.id}`}>
                                <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 active:bg-slate-800 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-1">{project.name}</h4>
                                        <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-bold uppercase">
                                            {project.status === 'IN_PROGRESS' ? 'В работе' : 'План'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-3 line-clamp-1">{project.address || 'Адрес не указан'}</p>
                                    <div className="flex items-center gap-3">
                                        <div className="flex -space-x-2">
                                            {[1, 2].map(i => (
                                                <div key={i} className="h-6 w-6 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[8px] font-bold">
                                                    U{i}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="ml-auto flex items-center gap-1.5 text-slate-500 text-xs">
                                            <Clock className="h-3 w-3" />
                                            <span>3ч назад</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </main>

            {/* Bottom Tab Bar */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-xl border-t border-white/10 px-6 py-3 flex items-center justify-between pointer-events-auto shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                <Link href="/field" className="flex flex-col items-center gap-1 text-blue-500">
                    <LayoutDashboard className="h-6 w-6" />
                    <span className="text-[10px] font-bold">Главная</span>
                </Link>
                <Link href="/field/audit" className="flex flex-col items-center gap-1 text-slate-500">
                    <ClipboardCheck className="h-6 w-6" />
                    <span className="text-[10px] font-bold">Аудит</span>
                </Link>
                <Link href="/field/search" className="flex flex-col items-center gap-1 text-slate-500">
                    <Search className="h-6 w-6" />
                    <span className="text-[10px] font-bold">Поиск</span>
                </Link>
                <Link href="/field/profile" className="flex flex-col items-center gap-1 text-slate-500">
                    <Settings className="h-6 w-6" />
                    <span className="text-[10px] font-bold">Настройки</span>
                </Link>
            </nav>
        </div>
    );
}
