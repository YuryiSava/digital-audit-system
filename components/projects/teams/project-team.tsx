'use client';

import { useState, useEffect } from 'react';
import { User, Shield, Trash2, MoreHorizontal } from 'lucide-react';
import { getProjectMembers, removeUserFromProject } from '@/app/actions/assignments';
import { AddMemberDialog } from './add-member-dialog';

interface ProjectTeamProps {
    projectId: string;
}

export function ProjectTeam({ projectId }: ProjectTeamProps) {
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchMembers = async () => {
        const res = await getProjectMembers(projectId);
        if (res.success) {
            setMembers(res.data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchMembers();
    }, [projectId]);

    const handleRemove = async (userId: string) => {
        if (!confirm('Удалить участника из проекта?')) return;

        const res = await removeUserFromProject(projectId, userId);
        if (res.success) {
            fetchMembers();
        }
    };

    return (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-white">Команда проекта</h2>
                    <p className="text-sm text-gray-400">Назначенные инженеры и менеджеры</p>
                </div>
                <AddMemberDialog projectId={projectId} onMemberAdded={fetchMembers} />
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[1, 2].map(i => (
                        <div key={i} className="h-14 bg-white/5 rounded-lg animate-pulse" />
                    ))}
                </div>
            ) : members.length === 0 ? (
                <div className="text-center py-8 text-gray-500 border border-dashed border-white/10 rounded-lg">
                    В команде пока никого нет
                </div>
            ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {members.map((assignment) => {
                        const user = assignment.user;
                        return (
                            <div key={assignment.id} className="bg-white/5 border border-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors group relative">
                                <div className="flex items-start gap-3">
                                    <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold border border-white/10">
                                        {user?.full_name?.charAt(0) || <User className="h-5 w-5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-white truncate">
                                            {user?.full_name || 'Неизвестный'}
                                        </div>
                                        <div className="text-xs text-gray-500 truncate mb-1">
                                            {user?.email}
                                        </div>
                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${assignment.role === 'manager'
                                                ? 'bg-blue-500/20 text-blue-300'
                                                : 'bg-slate-700 text-slate-300'
                                            }`}>
                                            {assignment.role === 'manager' && <Shield className="h-3 w-3 mr-1" />}
                                            {assignment.role === 'manager' ? 'Менеджер' : 'Инженер'}
                                        </span>
                                    </div>

                                    <button
                                        onClick={() => handleRemove(user.id)}
                                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all absolute top-2 right-2"
                                        title="Удалить из проекта"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
