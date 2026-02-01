import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Оптимизированный механизм сессий для DAS (v0.5.1)
 * Обеспечивает стабильность в локальных сетях (HTTP) и плавный рефреш токенов.
 */
export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    // Определяем протокол для правильной настройки Secure флага
    // В локальных сетях (HTTP) secure должен быть false, в интернете (HTTPS) - true.
    const isHttps = request.nextUrl.protocol === 'https:' || request.headers.get('x-forwarded-proto') === 'https';

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, {
                            ...options,
                            secure: isHttps, // Динамическая установка
                            sameSite: 'lax',
                            path: '/',
                            maxAge: 60 * 60 * 24 * 7, // Продлеваем жизнь сессии до 7 дней
                        })
                    )
                },
            },
            cookieOptions: {
                secure: isHttps,
                sameSite: 'lax',
                path: '/',
            }
        }
    )

    // Инициализация пользователя и автоматическое обновление токена (refresh token)
    const {
        data: { user },
        error
    } = await supabase.auth.getUser()

    const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
        request.nextUrl.pathname.startsWith('/auth');

    // Field App is public (for engineers in the field without accounts)
    const isPublicPage = isAuthPage || request.nextUrl.pathname.startsWith('/field');

    // Редирект неавторизованных пользователей
    if (!user && !isPublicPage) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        // Сохраняем путь для возврата после логина
        if (request.nextUrl.pathname !== '/') {
            url.searchParams.set('returnTo', request.nextUrl.pathname);
        }
        return NextResponse.redirect(url)
    }

    // Если авторизован и на странице логина - на главную
    if (user && isAuthPage) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    return supabaseResponse
}

