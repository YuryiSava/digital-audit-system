'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Search, User, Check, Loader2 } from 'lucide-react';
import { Button, Input } from '@/components/ui/simple-ui';
import { searchUsers, assignUserToProject, getAllUsers } from '@/app/actions/assignments';

interface AddMemberDialogProps {
    projectId: string;
    onMemberAdded: () => void;
}

export function AddMemberDialog({ projectId, onMemberAdded }: AddMemberDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [users, setUsers] = useState<any[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load all users when dialog opens
    useEffect(() => {
        if (isOpen) {
            fetchAllUsers();
        } else {
            // Reset state when closing
            setQuery('');
            setUsers([]);
            setSelectedUser(null);
            setError(null);
        }
    }, [isOpen]);

    const fetchAllUsers = async () => {
        setSearching(true);
        const res = await getAllUsers();
        setSearching(false);
        if (res.success) {
            setAllUsers(res.data || []);
            setUsers(res.data || []); // Show all by default
        } else {
            setError(res.error || "Ошибка загрузки списка пользователей");
        }
    };

    const handleSearch = async (val: string) => {
        setQuery(val);
        if (val.length < 2) {
            setUsers(allUsers); // Back to all users if query is short
            setError(null);
            return;
        }

        setSearching(true);
        setError(null);
        const res = await searchUsers(val);
        setSearching(false);
        if (res.success) {
            setUsers(res.data || []);
        } else {
            setError(res.error || "Ошибка поиска");
            setUsers([]);
        }
    };

    const handleSubmit = async () => {
        if (!selectedUser) return;

        setLoading(true);
        setError(null);

        const res = await assignUserToProject(projectId, selectedUser.id, 'contributor');

        if (res.success) {
            setIsOpen(false);
            setQuery('');
            setUsers([]);
            setSelectedUser(null);
            onMemberAdded();
        } else {
            //@ts-ignore
            setError(res.error || "Ошибка добавления");
        }
        setLoading(false);
    };

    if (!isOpen) {
        return (
            <Button size="sm" variant="secondary" onClick={() => setIsOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить участника
            </Button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#1e1e24] border border-white/10 rounded-xl w-full max-w-md shadow-2xl flex flex-col my-auto">
                <div className="flex items-center justify-between p-5 border-b border-white/10">
                    <h2 className="text-lg font-semibold text-white">Добавить участника</h2>
                    <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Поиск по имени или email..."
                            className="pl-9"
                            value={query}
                            onChange={(e) => handleSearch(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="min-h-[200px] max-h-[300px] overflow-y-auto custom-scrollbar bg-black/20 rounded-lg border border-white/5 p-2">
                        {searching && users.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-gray-500 text-sm py-10">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Загрузка...
                            </div>
                        ) : users.length > 0 ? (
                            <div className="space-y-1">
                                <div className="text-[10px] uppercase font-bold text-gray-500 px-2 pb-1">
                                    {query.length >= 2 ? 'Результаты поиска' : 'Все доступные участники'}
                                </div>
                                {users.map(user => (
                                    <div
                                        key={user.id}
                                        onClick={() => setSelectedUser(user)}
                                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${selectedUser?.id === user.id
                                            ? 'bg-blue-500/20 shadow-sm border border-blue-500/30'
                                            : 'hover:bg-white/5 border border-transparent'
                                            }`}
                                    >
                                        <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                                            {user.full_name?.charAt(0) || <User className="h-4 w-4" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className={`text-sm font-medium truncate ${selectedUser?.id === user.id ? 'text-blue-200' : 'text-slate-200'
                                                }`}>
                                                {user.full_name || 'Без имени'}
                                            </div>
                                            <div className="text-xs text-slate-500 truncate">
                                                {user.email}
                                            </div>
                                        </div>
                                        {selectedUser?.id === user.id && (
                                            <Check className="h-4 w-4 text-blue-400" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : query.length > 1 ? (
                            <div className="flex items-center justify-center h-full text-gray-500 text-sm py-10">
                                Пользователи не найдены
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500 text-sm py-10">
                                Список пользователей пуст
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded p-3 text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                            Отмена
                        </Button>
                        <Button onClick={handleSubmit} disabled={loading || !selectedUser}>
                            {loading ? 'Добавление...' : 'Добавить'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

