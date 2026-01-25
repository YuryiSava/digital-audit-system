import Link from "next/link";
import {
    LayoutDashboard,
    Plus,
    FolderOpen,
    CheckCircle2,
    Clock,
    ArrowRight,
    Search,
    ShieldCheck
} from "lucide-react";
import { getDashboardStats } from "@/app/actions/dashboard";

export const dynamic = 'force-dynamic';

export default async function Home() {
    const { stats, recentProjects } = await getDashboardStats();

    return (
        <div className="min-h-screen bg-slate-950 text-white selection:bg-blue-500/30">

            {/* Navbar / Header */}
            <header className="border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-gradient-to-tr from-blue-600 to-emerald-500 p-2 rounded-lg">
                            <ShieldCheck className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-bold text-lg tracking-tight">Digital Audit</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
                        <Link href="/projects" className="hover:text-white transition-colors">Проекты</Link>
                        <Link href="/norm-library" className="hover:text-white transition-colors">Библиотека норм</Link>
                        {/* <Link href="#" className="hover:text-white transition-colors">Настройки</Link> */}
                    </nav>
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 border-2 border-slate-800 ring-2 ring-white/10" />
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">

                {/* Welcome Section */}
                <div className="mb-10">
                    <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-slate-400 mb-2">
                        Панель управления
                    </h1>
                    <p className="text-slate-400">
                        Обзор текущего состояния аудитов и быстрый доступ к задачам.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <StatCard
                        label="Активные проекты"
                        value={stats?.totalProjects || 0}
                        icon={<FolderOpen className="w-6 h-6 text-blue-400" />}
                        trend="+2 на этой неделе"
                        color="blue"
                    />
                    <StatCard
                        label="Аудитов в работе"
                        value={stats?.activeAudits || 0}
                        icon={<Clock className="w-6 h-6 text-yellow-400" />}
                        trend="Требуют внимания"
                        color="yellow"
                    />
                    <StatCard
                        label="Завершено проверок"
                        value={stats?.completedAudits || 0}
                        icon={<CheckCircle2 className="w-6 h-6 text-emerald-400" />}
                        trend="Всего за все время"
                        color="emerald"
                    />
                </div>

                {/* Actions & Recent */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Content Area: Recent Audits */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Clock className="w-5 h-5 text-slate-500" />
                                Недавняя активность
                            </h2>
                            <Link href="/projects" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                Все проекты <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>

                        <div className="flex flex-col gap-4">
                            {recentProjects && recentProjects.length > 0 ? (
                                recentProjects.map((project: any) => (
                                    <Link key={project.id} href={`/projects/${project.id}`}>
                                        <div className="group relative overflow-hidden rounded-xl border border-white/5 bg-slate-900/50 p-4 transition-all hover:bg-slate-800/80 hover:border-white/10 hover:shadow-2xl hover:shadow-blue-500/5">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-medium text-white group-hover:text-blue-400 transition-colors">
                                                        {project.name}
                                                    </h3>
                                                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                                                        <span>{project.address || 'Адрес не указан'}</span>
                                                        <span className="w-1 h-1 bg-slate-700 rounded-full" />
                                                        <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <div className="bg-slate-800 px-3 py-1 rounded-full text-xs font-medium text-slate-300 border border-white/5">
                                                    {project.status}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="text-center py-12 rounded-xl border border-dashed border-white/10 bg-slate-900/30">
                                    <p className="text-slate-500 mb-4">Активности пока нет</p>
                                    <Link href="/projects" className="text-blue-400 hover:underline">
                                        Создать первый проект
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar: Quick Actions */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold">Быстрые действия</h2>

                        <div className="grid gap-4">
                            <Link href="/projects" className="group flex items-center gap-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white shadow-lg shadow-blue-500/20 active:scale-[98%] transition-all hover:brightness-110">
                                <div className="rounded-lg bg-white/20 p-2 text-white">
                                    <Plus className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-semibold">Новый аудит</div>
                                    <div className="text-xs text-blue-100 opacity-80">Создать проект и чек-лист</div>
                                </div>
                                <ArrowRight className="w-5 h-5 ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                            </Link>

                            <Link href="/norm-library" className="group flex items-center gap-4 rounded-xl border border-white/5 bg-slate-900/50 p-4 text-slate-300 hover:bg-slate-800 transition-all">
                                <div className="rounded-lg bg-slate-800 p-2 text-slate-400 group-hover:text-white group-hover:bg-slate-700 transition-colors">
                                    <Search className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-semibold text-white">Поиск норм</div>
                                    <div className="text-xs text-slate-500">Справочник СП и ГОСТ</div>
                                </div>
                            </Link>
                        </div>

                        {/* Mini Tip */}
                        <div className="rounded-xl bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border border-purple-500/20 p-5 mt-6">
                            <h4 className="font-semibold text-purple-200 mb-2 text-sm">Совет дня</h4>
                            <p className="text-xs text-purple-300/70 leading-relaxed">
                                Для повышения качества отчетов не забывайте добавлять фотофиксацию даже для статуса "Норма", если узел критически важен.
                            </p>
                        </div>
                    </div>

                </div>

            </main>
        </div>
    );
}

function StatCard({ label, value, icon, trend, color }: any) {
    const colorClasses: any = {
        blue: "from-blue-500/20 to-blue-600/5 border-blue-500/20",
        yellow: "from-yellow-500/20 to-yellow-600/5 border-yellow-500/20",
        emerald: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/20",
    };

    return (
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br border p-6 ${colorClasses[color] || colorClasses.blue}`}>
            <div className="relative z-10 flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-400 mb-1">{label}</p>
                    <h3 className="text-3xl font-bold text-white tracking-tight">{value}</h3>
                </div>
                <div className={`rounded-xl bg-white/5 p-3 backdrop-blur-sm border border-white/10`}>
                    {icon}
                </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                <span className={`${color === 'blue' ? 'text-blue-400' : color === 'yellow' ? 'text-yellow-400' : 'text-emerald-400'} font-medium`}>
                    {trend}
                </span>
            </div>

            {/* Background Glow */}
            <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full blur-2xl opacity-20 bg-${color}-500`} />
        </div>
    );
}
