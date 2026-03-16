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
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createBrowserClient()

    const registrarStreak = useCallback(async (userId: string) => {
        try {
            await supabase.rpc('registrar_streak_diario', { p_user_id: userId })
        } catch {
            // silently fail - streak is non-critical
        }
    }, [supabase])

    const fetchProfile = useCallback(async (userId: string) => {
        await registrarStreak(userId)
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()
        setProfile(data)
    }, [supabase, registrarStreak])

    const refreshProfile = useCallback(async () => {
        if (user) await fetchProfile(user.id)
    }, [user, fetchProfile])

    const signOut = useCallback(async () => {
        await supabase.auth.signOut()
        setUser(null)
        setProfile(null)
    }, [supabase])

    useEffect(() => {
        // onAuthStateChange fires INITIAL_SESSION synchronously from cache,
        // so there is no need for a separate getUser() call.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                const currentUser = session?.user ?? null
                setUser(currentUser)
                if (currentUser) {
                    await fetchProfile(currentUser.id)
                } else {
                    setProfile(null)
                }
                setLoading(false)
            }
        )

        return () => subscription.unsubscribe()
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
