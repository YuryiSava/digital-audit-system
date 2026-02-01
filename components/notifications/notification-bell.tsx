'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, ExternalLink, UserPlus, CircleAlert, X } from 'lucide-react';
import { getNotifications, markAsRead, markAllAsRead } from '@/app/actions/notifications';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import Link from 'next/link';
import { Button } from '@/components/ui/simple-ui';

export function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        const res = await getNotifications();
        if (res.success) {
            setNotifications(res.data || []);
            setUnreadCount(res.data?.filter((n: any) => !n.isRead).length || 0);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Here we could add Supabase Realtime subscription in the future
    }, []);

    const handleMarkAsRead = async (id: string) => {
        const res = await markAsRead(id);
        if (res.success) {
            setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
    };

    const handleMarkAllRead = async () => {
        const res = await markAllAsRead();
        if (res.success) {
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-[#0f172a] animate-pulse" />
                )}
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 md:w-96 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                Уведомления
                                {unreadCount > 0 && (
                                    <span className="bg-red-500/10 text-red-500 text-[10px] px-1.5 py-0.5 rounded-full border border-red-500/20">
                                        {unreadCount}
                                    </span>
                                )}
                            </h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    Прочитать все
                                </button>
                            )}
                        </div>

                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                            {notifications.length > 0 ? (
                                <div className="divide-y divide-white/5">
                                    {notifications.map((n) => (
                                        <div
                                            key={n.id}
                                            className={`p-4 hover:bg-white/[0.02] transition-colors relative group ${!n.isRead ? 'bg-blue-500/[0.02]' : ''}`}
                                        >
                                            <div className="flex gap-3">
                                                <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${n.type === 'USER_REGISTERED' ? 'bg-blue-500/10 text-blue-400' :
                                                    n.type === 'SYSTEM_ALERT' ? 'bg-red-500/10 text-red-400' : 'bg-slate-700 text-slate-300'
                                                    }`}>
                                                    {n.type === 'USER_REGISTERED' ? <UserPlus className="w-4 h-4" /> : <CircleAlert className="w-4 h-4" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-0.5">
                                                        <h4 className={`text-sm font-semibold truncate ${!n.isRead ? 'text-white' : 'text-slate-300'}`}>
                                                            {n.title}
                                                        </h4>
                                                        {!n.isRead && (
                                                            <button
                                                                onClick={() => handleMarkAsRead(n.id)}
                                                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-green-400 transition-all"
                                                                title="Отметить как прочитано"
                                                            >
                                                                <Check className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-400 leading-relaxed mb-2">
                                                        {n.message}
                                                    </p>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] text-slate-500">
                                                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ru })}
                                                        </span>
                                                        {n.link && (
                                                            <Link
                                                                href={n.link}
                                                                onClick={() => {
                                                                    setIsOpen(false);
                                                                    handleMarkAsRead(n.id);
                                                                }}
                                                                className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
                                                            >
                                                                Перейти <ExternalLink className="w-2.5 h-2.5" />
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center">
                                    <Bell className="w-8 h-8 text-slate-700 mx-auto mb-3 opacity-20" />
                                    <p className="text-sm text-slate-500 italic">Нет новых уведомлений</p>
                                </div>
                            )}
                        </div>

                        {notifications.length > 0 && (
                            <div className="p-3 bg-white/[0.02] border-t border-white/5 text-center">
                                <Link
                                    href="/settings/notifications"
                                    className="text-[10px] text-slate-500 hover:text-white transition-colors uppercase tracking-wider font-bold"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Все уведомления
                                </Link>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
