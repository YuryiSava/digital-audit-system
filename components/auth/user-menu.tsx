'use client'

import { useState } from 'react'
import { signOut } from '@/app/actions/auth'
import { LogOut, User, Settings, Users, Shield } from 'lucide-react'
import Link from 'next/link'

export function UserMenu({ email, fullName, role }: { email: string, fullName?: string, role?: string }) {
    const [isOpen, setIsOpen] = useState(false)

    const handleSignOut = async () => {
        await signOut()
    }

    const roleLabels: Record<string, string> = {
        admin: 'Администратор',
        pm: 'Project Manager',
        engineer: 'Инженер',
        viewer: 'Наблюдатель'
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 border-2 border-slate-800 ring-2 ring-white/10 hover:ring-white/20 transition-all flex items-center justify-center text-white font-bold"
            >
                {fullName?.charAt(0).toUpperCase() || <User className="h-5 w-5" />}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-3 w-64 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-white/5">
                            <p className="font-semibold text-white truncate">{fullName || 'Пользователь'}</p>
                            <p className="text-xs text-slate-400 truncate mb-2">{email}</p>
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 text-[10px] text-blue-400 uppercase font-bold tracking-wider">
                                <Shield className="h-3 w-3" />
                                {roleLabels[role || 'engineer']}
                            </div>
                        </div>

                        <div className="p-2">
                            <Link
                                href="/team"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors group"
                            >
                                <Users className="h-4 w-4 text-slate-500 group-hover:text-blue-400" />
                                Команда
                            </Link>
                            <Link
                                href="/settings"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors group"
                            >
                                <Settings className="h-4 w-4 text-slate-500 group-hover:text-blue-400" />
                                Настройки
                            </Link>
                        </div>

                        <div className="p-2 border-t border-white/5">
                            <button
                                onClick={handleSignOut}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors group"
                            >
                                <LogOut className="h-4 w-4" />
                                Выйти
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
