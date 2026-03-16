import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

function getBestDisplayName(user: {
    email?: string | null
    user_metadata?: Record<string, unknown> | null
}) {
    const metadata = user.user_metadata || {}
    const directNameKeys = ['display_name', 'full_name', 'name', 'user_name', 'preferred_username'] as const

    for (const key of directNameKeys) {
        const value = metadata[key]
        if (typeof value === 'string' && value.trim()) {
            return value.trim()
        }
    }

    const firstName = typeof metadata.given_name === 'string' && metadata.given_name.trim()
        ? metadata.given_name.trim()
        : typeof metadata.first_name === 'string' && metadata.first_name.trim()
            ? metadata.first_name.trim()
            : null
    const lastName = typeof metadata.family_name === 'string' && metadata.family_name.trim()
        ? metadata.family_name.trim()
        : typeof metadata.last_name === 'string' && metadata.last_name.trim()
            ? metadata.last_name.trim()
            : null
    const combinedName = [firstName, lastName].filter(Boolean).join(' ').trim()

    if (combinedName) {
        return combinedName
    }

    return user.email?.split('@')[0]?.trim() || null
}

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const requestedNext = searchParams.get('next') ?? '/home'

    if (code) {
        const supabase = await createServerClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                try {
                    const bestDisplayName = getBestDisplayName({
                        email: user.email,
                        user_metadata: user.user_metadata,
                    })
                    const emailPrefix = user.email?.split('@')[0]?.trim().toLowerCase() || null

                    if (bestDisplayName) {
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('display_name')
                            .eq('id', user.id)
                            .maybeSingle()

                        const currentDisplayName = profile?.display_name?.trim() || null
                        const shouldSyncDisplayName = !currentDisplayName
                            || (emailPrefix !== null && currentDisplayName.toLowerCase() === emailPrefix)

                        if (shouldSyncDisplayName && currentDisplayName !== bestDisplayName) {
                            await supabase
                                .from('profiles')
                                .update({ display_name: bestDisplayName })
                                .eq('id', user.id)
                        }
                    }
                } catch (syncError) {
                    console.error('auth callback display_name sync failed', syncError)
                }

                const { data: onboarding } = await supabase
                    .from('onboarding_completions')
                    .select('id')
                    .eq('user_id', user.id)
                    .maybeSingle()

                const hasCompletedOnboarding = Boolean(onboarding)
                const next = hasCompletedOnboarding
                    ? (requestedNext === '/onboarding' ? '/home' : requestedNext)
                    : '/onboarding'

                return NextResponse.redirect(`${origin}${next}`)
            }
        }
    }

    return NextResponse.redirect(`${origin}/login?error=auth`)
}
