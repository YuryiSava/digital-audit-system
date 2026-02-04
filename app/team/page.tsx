import Link from "next/link";
import { ArrowLeft, Users, Shield, User, Mail, Calendar, Settings2 } from "lucide-react";
import { getTeamMembers, getCurrentUser } from "@/app/actions/team";
import { RoleSelector } from "@/components/team/role-selector";
import { EditProfileDialog } from "@/components/team/edit-profile-dialog";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export const dynamic = 'force-dynamic';

export default async function TeamPage() {
    const { data: members, error } = await getTeamMembers();
    const currentUser = await getCurrentUser();

    return (
        <div className="min-h-screen bg-slate-950 text-white selection:bg-blue-500/30">
            {/* Header */}
            <header className="border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="p-2 rounded-lg hover:bg-white/5 transition-colors text-slate-400 hover:text-white"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div className="h-6 w-px bg-white/10" />
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-blue-600/20 flex items-center justify-center">
                                <Users className="h-5 w-5 text-blue-400" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight">Команда</h1>
                                <p className="text-xs text-slate-400">Управление пользователями и ролями</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-6 py-8">
                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
                        <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Всего участников</p>
                        <p className="text-2xl font-bold">{members?.length || 0}</p>
                    </div>
                    {/* More stats can be added here */}
                </div>

                {/* Team Table */}
                <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.02]">
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Участник</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Роль</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Проекты</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Регистрация</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Действия</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {members && members.length > 0 ? (
                                    members.map((member: any) => (
                                        <tr key={member.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 border border-white/10 flex items-center justify-center text-slate-300 font-bold">
                                                        {member.full_name?.charAt(0) || <User className="h-5 w-5" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                                                            {member.full_name || 'Без имени'}
                                                            {currentUser?.id === member.id && (
                                                                <span className="ml-2 px-1.5 py-0.5 rounded-md bg-blue-500/10 text-[10px] text-blue-400 uppercase font-bold">Вы</span>
                                                            )}
                                                        </p>
                                                        <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                                                            <Mail className="h-3 w-3" />
                                                            {member.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <RoleSelector userId={member.id} currentRole={member.role} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                                                    {member.assignments && member.assignments.length > 0 ? (
                                                        member.assignments.map((a: any, idx: number) => (
                                                            <span key={idx} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-slate-400 whitespace-nowrap">
                                                                {a.project?.name}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-xs text-slate-600 italic">Нет проектов</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-slate-400 text-sm">
                                                    <Calendar className="h-4 w-4" />
                                                    {format(new Date(member.created_at), "d MMM yyyy", { locale: ru })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <EditProfileDialog member={member} />
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                            Пользователи не найдены
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
