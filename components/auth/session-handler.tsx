'use client';

import { useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export function SessionHandler() {
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        // Подписываемся на изменения состояния авторизации
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                router.refresh();
                router.push('/login');
            } else if (event === 'TOKEN_REFRESHED') {
                console.log('Session refreshed successfully');
            } else if (event === 'SIGNED_IN' && !session) {
                // Если событие входа есть, а сессии нет - что-то не так
                router.refresh();
            }
        });

        // Периодическая проверка сессии (раз в 10 минут) для стабильности в плохих сетях
        const interval = setInterval(async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                // Это заставит SDK проверить токен и обновить его, если нужно
                console.log('Heartbeat: Session active');
            }
        }, 1000 * 60 * 10);

        return () => {
            subscription.unsubscribe();
            clearInterval(interval);
        };
    }, [supabase, router]);

    return null; // Компонент ничего не рендерит
}
