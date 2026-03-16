import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname
    const protectedPrefixes = ['/home', '/aprender', '/pronuncia', '/ia', '/comunidade', '/perfil', '/store', '/onboarding', '/admin']
    const authPrefixes = ['/login', '/register']
    const isProtectedRoute = protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
    const isAuthRoute = authPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
    const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/')
    const isOnboardingRoute = pathname === '/onboarding' || pathname.startsWith('/onboarding/')

    if (!user && isProtectedRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    if (user) {
        const { data: onboarding } = await supabase
            .from('onboarding_completions')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle()

        const hasCompletedOnboarding = Boolean(onboarding)

        if (isAuthRoute) {
            const url = request.nextUrl.clone()
            url.pathname = hasCompletedOnboarding ? '/home' : '/onboarding'
            return NextResponse.redirect(url)
        }

        if (!hasCompletedOnboarding && !isOnboardingRoute && isProtectedRoute) {
            const url = request.nextUrl.clone()
            url.pathname = '/onboarding'
            return NextResponse.redirect(url)
        }

        if (hasCompletedOnboarding && isOnboardingRoute) {
            const url = request.nextUrl.clone()
            url.pathname = '/home'
            return NextResponse.redirect(url)
        }
    }

    if (user && isAdminRoute) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single()

        if (!profile?.is_admin) {
            const url = request.nextUrl.clone()
            url.pathname = '/home'
            return NextResponse.redirect(url)
        }
    }

    return supabaseResponse
}
