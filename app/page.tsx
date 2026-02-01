import Link from "next/link";
import {
    LayoutDashboard,
    ClipboardList,
    BookOpen,
    Users,
    Plus,
    Search,
    ArrowRight,
    TrendingUp,
    Clock,
    CheckCircle
} from "lucide-react";
import { getDashboardStats } from "@/app/actions/dashboard";
import { getCurrentUser } from "@/app/actions/team";
import { UserMenu } from "@/components/auth/user-menu";
import { HealthIndicator } from "@/components/admin/health-indicator";
import { NotificationBell } from "@/components/notifications/notification-bell";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const statsResult = await getDashboardStats();
    const currentUser = await getCurrentUser();

    // Fallback data
    const stats = statsResult?.stats || { totalProjects: 0, activeAudits: 0, completedAudits: 0 };
    const recentProjects = statsResult?.recentProjects || [];

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200">
            {/* Navigation */}
            <nav className="border-b border-white/5 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <LayoutDashboard className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-xl tracking-tight text-white">Digital Audit</span>
                        </div>
                        <div className="flex items-center gap-8">
                            <div className="hidden md:flex items-center gap-6">
                                <Link href="/projects" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Проекты</Link>
                                <Link href="/norm-library" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Библиотека норм</Link>
                                {currentUser?.profile?.role === 'admin' && (
                                    <Link href="/team" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Команда</Link>
                                )}
                            </div>
                            <div className="flex items-center gap-4">
                                {currentUser?.profile?.role === 'admin' && <NotificationBell />}
                                <UserMenu
                                    email={currentUser?.email || ''}
                                    fullName={currentUser?.profile?.full_name || ''}
                                    role={currentUser?.profile?.role || ''}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <header className="mb-10">
                    <h1 className="text-3xl font-bold text-white mb-2">Панель управления</h1>
                    <p className="text-slate-400">Обзор текущего состояния аудитов и быстрый доступ к задачам.</p>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-slate-900/50 border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <ClipboardList className="w-16 h-16" />
                        </div>
                        <div className="relative">
                            <p className="text-sm font-medium text-slate-400 mb-1">Активные проекты</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold text-white">{stats?.totalProjects || 0}</span>
                                <span className="text-sm text-blue-400 flex items-center gap-0.5">
                                    <TrendingUp className="w-3 h-3" /> +2 на этой неделе
                                </span>
                            </div>
                            <div className="mt-4 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 w-2/3"></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <Clock className="w-16 h-16 text-yellow-500" />
                        </div>
                        <div className="relative">
                            <p className="text-sm font-medium text-slate-400 mb-1">Аудитов в работе</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold text-white">{stats?.activeAudits || 0}</span>
                            </div>
                            <p className="mt-2 text-xs text-yellow-500/80">Требуют внимания</p>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <CheckCircle className="w-16 h-16 text-emerald-500" />
                        </div>
                        <div className="relative">
                            <p className="text-sm font-medium text-slate-400 mb-1">Завершено проверок</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold text-white">{stats?.completedAudits || 0}</span>
                            </div>
                            <p className="mt-2 text-xs text-emerald-500/80">Всего за все время</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Recent Content */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Clock className="w-5 h-5 text-blue-400" />
                                Недавняя активность
                            </h2>
                            <Link href="/projects" className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 group">
                                Все проекты
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>

                        <div className="grid gap-4">
                            {recentProjects?.map((project: any) => (
                                <Link
                                    key={project.id}
                                    href={`/projects/${project.id}`}
                                    className="group bg-slate-900/30 border border-white/5 p-5 rounded-2xl hover:bg-slate-800/50 transition-all flex items-center justify-between"
                                >
                                    <div>
                                        <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">{project.name}</h3>
                                        <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                                            <span>{project.location || 'Локация не указана'}</span>
                                            <span>•</span>
                                            <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right hidden sm:block">
                                            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">{project.status}</div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
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
                                    <div className="font-semibold text-white">Библиотека</div>
                                    <div className="text-xs text-slate-500">Справочник СП и ГОСТ</div>
                                </div>
                            </Link>

                            {currentUser?.profile?.role === 'admin' && (
                                <Link href="/team" className="group flex items-center gap-4 rounded-xl border border-white/5 bg-slate-900/50 p-4 text-slate-300 hover:bg-slate-800 transition-all">
                                    <div className="rounded-lg bg-slate-800 p-2 text-slate-400 group-hover:text-white group-hover:bg-slate-700 transition-colors">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-white">Команда</div>
                                        <div className="text-xs text-slate-500">Управление доступом</div>
                                    </div>
                                </Link>
                            )}
                        </div>

                        {/* System Health Monitor */}
                        {currentUser?.profile?.role === 'admin' && (
                            <div className="mt-6">
                                <HealthIndicator />
                            </div>
                        )}

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
