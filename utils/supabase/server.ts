import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'

export function createClient() {
    const cookieStore = cookies()
    const headerList = headers()

    // Определяем, работаем ли мы через HTTPS
    const isHttps = headerList.get('x-forwarded-proto') === 'https' ||
        headerList.get('referer')?.startsWith('https');

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, {
                                ...options,
                                secure: isHttps,
                                sameSite: 'lax',
                                path: '/',
                            })
                        )
                    } catch {
                        // Silent fail for Server Components
                    }
                },
            },
            cookieOptions: {
                secure: isHttps,
                sameSite: 'lax',
                path: '/',
            }
        }
    )
}

