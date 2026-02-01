'use client'

import { useState } from 'react'
import { updateUserRole } from '@/app/actions/team'
import { Shield, User, Eye, Briefcase, Check, ChevronDown } from 'lucide-react'

const roles = [
    { id: 'admin', label: 'Admin', icon: Shield, color: 'text-red-400', bg: 'bg-red-500/10' },
    { id: 'pm', label: 'Project Manager', icon: Briefcase, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { id: 'engineer', label: 'Engineer', icon: User, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { id: 'viewer', label: 'Viewer', icon: Eye, color: 'text-slate-400', bg: 'bg-slate-500/10' },
]

export function RoleSelector({ userId, currentRole }: { userId: string, currentRole: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const activeRole = roles.find(r => r.id === currentRole) || roles[2]

    const handleRoleUpdate = async (newRole: string) => {
        if (newRole === currentRole) return

        setLoading(true)
        const result = await updateUserRole(userId, newRole)
        setLoading(false)

        if (result.success) {
            setIsOpen(false)
        } else {
            alert('Ошибка при обновлении роли: ' + result.error)
        }
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={loading}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/5 ${activeRole.bg} transition-all hover:bg-white/10`}
            >
                <activeRole.icon className={`h-4 w-4 ${activeRole.color}`} />
                <span className={`text-sm font-medium ${activeRole.color}`}>{activeRole.label}</span>
                <ChevronDown className="h-4 w-4 text-slate-500" />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="p-2 space-y-1">
                            {roles.map((role) => (
                                <button
                                    key={role.id}
                                    onClick={() => handleRoleUpdate(role.id)}
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <role.icon className={`h-4 w-4 ${role.color}`} />
                                        <span className="text-sm text-slate-300 group-hover:text-white">{role.label}</span>
                                    </div>
                                    {currentRole === role.id && (
                                        <Check className="h-4 w-4 text-emerald-500" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
