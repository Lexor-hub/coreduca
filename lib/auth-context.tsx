'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types/database'

type AuthContextType = {
    user: User | null
    profile: Profile | null
    loading: boolean
    refreshProfile: () => Promise<void>
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    refreshProfile: async () => { },
    signOut: async () => { },
})

export function AuthProvider({ children }: { children: ReactNode }) {
    const [supabase] = useState(() => createBrowserClient())
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)

    const registrarStreak = useCallback(async (userId: string) => {
        try {
            await supabase.rpc('registrar_streak_diario', { p_user_id: userId })
        } catch {
            // silently fail - streak is non-critical
        }
    }, [supabase])

    const fetchProfile = useCallback(async (userId: string) => {
        await registrarStreak(userId)
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()
        if (error) throw error
        return data as Profile
    }, [supabase, registrarStreak])

    const refreshProfile = useCallback(async () => {
        if (!user) {
            setProfile(null)
            return
        }

        const nextProfile = await fetchProfile(user.id)
        setProfile(nextProfile)
    }, [user, fetchProfile])

    const signOut = useCallback(async () => {
        setUser(null)
        setProfile(null)
        setLoading(false)

        const { error } = await supabase.auth.signOut({ scope: 'local' })
        if (error && error.message !== 'Auth session missing!') throw error
    }, [supabase])

    useEffect(() => {
        let cancelled = false

        const syncUser = async (currentUser: User | null) => {
            if (cancelled) return

            setUser(currentUser)

            if (!currentUser) {
                setProfile(null)
                return
            }

            try {
                const nextProfile = await fetchProfile(currentUser.id)
                if (!cancelled) {
                    setProfile(nextProfile)
                }
            } catch {
                if (!cancelled) {
                    setProfile(null)
                }
            }
        }

        async function bootstrapSession() {
            try {
                const { data, error } = await supabase.auth.getSession()
                if (error) throw error

                await syncUser(data.session?.user ?? null)
            } catch {
                if (!cancelled) {
                    setUser(null)
                    setProfile(null)
                }
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        void bootstrapSession()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                if (event === 'SIGNED_OUT') {
                    if (!cancelled) {
                        setUser(null)
                        setProfile(null)
                        setLoading(false)
                    }
                    return
                }

                if (
                    event !== 'INITIAL_SESSION' &&
                    event !== 'SIGNED_IN' &&
                    event !== 'TOKEN_REFRESHED' &&
                    event !== 'USER_UPDATED'
                ) {
                    return
                }

                void (async () => {
                    await syncUser(session?.user ?? null)

                    if (!cancelled) {
                        setLoading(false)
                    }
                })()
            }
        )

        return () => {
            cancelled = true
            subscription.unsubscribe()
        }
    }, [supabase, fetchProfile])

    return (
        <AuthContext.Provider value={{ user, profile, loading, refreshProfile, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth must be used within an AuthProvider')
    return context
}
