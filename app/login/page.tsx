import { ShieldCheck, Mail, Lock, ArrowRight, UserPlus } from "lucide-react";
import { login, signup } from "@/app/actions/auth";

export default function LoginPage({
    searchParams,
}: {
    searchParams: { message: string, mode?: string };
}) {
    const isSignUp = searchParams.mode === 'signup';

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-gradient-to-tr from-blue-600 to-emerald-500 p-4 rounded-2xl shadow-xl shadow-blue-500/20 mb-4 animate-in fade-in zoom-in duration-700">
                        <ShieldCheck className="h-10 w-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Digital Audit</h1>
                    <p className="text-slate-400 mt-2">Система мобильного и технического аудита</p>
                </div>

                {/* Glass Card */}
                <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    {/* Top Accent Line */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

                    <h2 className="text-xl font-semibold text-white mb-6">
                        {isSignUp ? "Регистрация" : "Вход в систему"}
                    </h2>

                    <form className="space-y-5">
                        {isSignUp && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-400 ml-1">ФИО</label>
                                <div className="relative group">
                                    <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                    <input
                                        name="fullName"
                                        type="text"
                                        required
                                        placeholder="Иван Иванов"
                                        className="w-full bg-slate-950/50 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-400 ml-1">Email-адрес</label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="name@company.com"
                                    className="w-full bg-slate-950/50 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-400 ml-1">Пароль</label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    className="w-full bg-slate-950/50 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                                />
                            </div>
                        </div>

                        {searchParams.message && (
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-shake">
                                {searchParams.message}
                            </div>
                        )}

                        <button
                            formAction={isSignUp ? signup : login}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
                        >
                            {isSignUp ? "Создать аккаунт" : "Войти"}
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-white/5 text-center">
                        <p className="text-slate-400 text-sm">
                            {isSignUp ? (
                                <>
                                    Уже есть аккаунт?{" "}
                                    <a href="/login" className="text-blue-400 hover:text-blue-300 font-medium">Войти</a>
                                </>
                            ) : (
                                <>
                                    Нет аккаунта?{" "}
                                    <a href="/login?mode=signup" className="text-blue-400 hover:text-blue-300 font-medium">Зарегистрироваться</a>
                                </>
                            )}
                        </p>
                    </div>
                </div>

                {/* Footer Info */}
                <p className="text-center text-slate-500 text-xs mt-8">
                    &copy; 2026 Digital Audit System. Все права защищены.<br />
                    Использование системы подразумевает согласие с правилами.
                </p>
            </div>
        </div>
    );
}
