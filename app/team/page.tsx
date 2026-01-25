import Link from "next/link";
import { ArrowLeft, Users, Shield } from "lucide-react";

export default function TeamPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900">
            {/* Header */}
            <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/"
                                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                            >
                                <ArrowLeft className="h-5 w-5" />
                                <span>Назад</span>
                            </Link>
                            <div className="h-6 w-px bg-white/20" />
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                                    <Users className="h-5 w-5 text-cyan-400" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">Team</h1>
                                    <p className="text-sm text-cyan-200">Управление командой</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="container mx-auto px-6 py-8">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-12 text-center">
                    <div className="h-20 w-20 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                        <Shield className="h-10 w-10 text-cyan-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                        Управление командой и правами
                    </h3>
                    <p className="text-gray-400 mb-6 max-w-md mx-auto">
                        Здесь будет управление пользователями, ролями (LA, FE, AN, PM) и правами доступа.
                        В базе данных уже созданы демо-пользователи.
                    </p>
                </div>
            </div>
        </div>
    );
}
