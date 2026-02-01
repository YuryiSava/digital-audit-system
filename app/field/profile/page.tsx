import Link from "next/link";
import {
    User,
    ArrowLeft,
    LogOut,
    Shield,
    Smartphone,
    Download,
    LayoutDashboard,
    ClipboardCheck,
    Search,
    Settings
} from "lucide-react";
import { getCurrentUser } from "@/app/actions/team";
import { signOut } from "@/app/actions/auth";

export default async function FieldProfilePage() {
    const currentUser = await getCurrentUser();

    async function handleSignOut() {
        'use server';
        await signOut();
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-24">
            {/* Header */}
            <header className="p-4 flex items-center gap-3 border-b border-white/5 bg-slate-900/50 backdrop-blur-md">
                <Link href="/field" className="text-slate-400">
                    <ArrowLeft className="h-6 w-6" />
                </Link>
                <h1 className="text-lg font-bold">Профиль инженера</h1>
            </header>

            <main className="p-6 space-y-8">
                {/* User Info */}
                <div className="flex flex-col items-center text-center">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 border-4 border-slate-900 shadow-2xl flex items-center justify-center text-3xl font-bold mb-4">
                        {currentUser?.profile?.full_name?.charAt(0) || <User className="h-10 w-10 text-white" />}
                    </div>
                    <h2 className="text-xl font-bold">{currentUser?.profile?.full_name || 'Инженер'}</h2>
                    <p className="text-sm text-slate-500">{currentUser?.email}</p>
                    <div className="mt-4 px-4 py-1 bg-blue-500/10 rounded-full text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                        <Shield className="h-3 w-3" />
                        {currentUser?.profile?.role || 'Engineer'}
                    </div>
                </div>

                {/* Settings Links */}
                <div className="space-y-3">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-2">Настройки приложения</h3>

                    <div className="bg-slate-900 border border-white/5 rounded-3xl overflow-hidden">
                        <button className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors border-b border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                                    <Smartphone className="h-5 w-5" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-sm">Оффлайн доступ</p>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold">Управление кэшем</p>
                                </div>
                            </div>
                            <div className="h-6 w-11 bg-slate-800 rounded-full relative">
                                <div className="absolute right-1 top-1 h-4 w-4 bg-blue-500 rounded-full" />
                            </div>
                        </button>

                        <button className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                                    <Download className="h-5 w-5" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-sm">Обновить библиотеку</p>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold">Синхронизация СН РК</p>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Auth Actions */}
                <form action={handleSignOut}>
                    <button className="w-full flex items-center justify-center gap-3 p-5 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold active:bg-red-500/20 transition-all">
                        <LogOut className="h-5 w-5" />
                        Выйти из аккаунта
                    </button>
                </form>

                <p className="text-center text-[10px] text-slate-600 uppercase font-bold tracking-widest">
                    Digital Audit System v0.3.5 <br />
                    Built for Field Engineering
                </p>
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-xl border-t border-white/10 px-6 py-3 flex items-center justify-between pointer-events-auto">
                <Link href="/field" className="flex flex-col items-center gap-1 text-slate-500">
                    <LayoutDashboard className="h-6 w-6" />
                    <span className="text-[10px] font-bold">Главная</span>
                </Link>
                <Link href="/field/audit" className="flex flex-col items-center gap-1 text-slate-500">
                    <LocalAudit className="h-6 w-6" />
                    <span className="text-[10px] font-bold">Аудит</span>
                </Link>
                <Link href="/field/search" className="flex flex-col items-center gap-1 text-slate-500">
                    <Search className="h-6 w-6" />
                    <span className="text-[10px] font-bold">Поиск</span>
                </Link>
                <Link href="/field/profile" className="flex flex-col items-center gap-1 text-blue-500">
                    <Settings className="h-6 w-6" />
                    <span className="text-[10px] font-bold">Профиль</span>
                </Link>
            </nav>
        </div>
    );
}

// Icons for Nav consistency
function LocalAudit(props: any) { return <Shield {...props} /> }
