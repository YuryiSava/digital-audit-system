'use client';

import { useState } from 'react';
import { Settings2, User, Loader2, X, Mail } from 'lucide-react';
import { Button, Input, Label } from '@/components/ui/simple-ui';
import { updateUserProfile } from '@/app/actions/team';

interface EditProfileDialogProps {
    member: {
        id: string;
        full_name: string | null;
        email: string;
    };
}

export function EditProfileDialog({ member }: EditProfileDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fullName, setFullName] = useState(member.full_name || '');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    async function handleSave() {
        if (!fullName.trim()) return;

        setLoading(true);
        setError(null);
        setSuccess(false);
        try {
            const res = await updateUserProfile(member.id, { full_name: fullName.trim() });
            if (res.success) {
                setSuccess(true);
                setTimeout(() => {
                    setIsOpen(false);
                    setSuccess(false);
                }, 1500);
            } else {
                setError(res.error || 'Ошибка обновления');
            }
        } catch (err: any) {
            setError(err.message || 'Произошла ошибка при сохранении');
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                title="Настройки участника"
            >
                <Settings2 className="h-5 w-5" />
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 text-left">
                    <div className="bg-[#1e1e24] border border-white/10 rounded-xl w-full max-w-md shadow-2xl flex flex-col my-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/10 flex-none bg-[#1e1e24] rounded-t-xl">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Settings2 className="w-5 h-5 text-blue-400" />
                                Редактировать участника
                            </h2>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors p-1">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            <div className="space-y-2">
                                <Label>ФИО / Имя</Label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-4 w-4 text-slate-500" />
                                    </div>
                                    <Input
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Введите имя участника"
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Email (только чтение)</p>
                                <div className="flex items-center gap-2 text-sm text-slate-300 bg-slate-900/50 p-2.5 rounded-lg border border-white/5">
                                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                                    {member.email}
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Профиль успешно обновлен
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-[#1e1e24] rounded-b-xl">
                            <Button variant="ghost" onClick={() => setIsOpen(false)}>
                                Отмена
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={loading || !fullName.trim() || success}
                                className="bg-blue-600 hover:bg-blue-500 min-w-[120px]"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Сохранение...
                                    </>
                                ) : 'Сохранить'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

function CheckCircle2(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    )
}
