'use client'

import { useEffect, useMemo, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { createBrowserClient } from '@/lib/supabase/client'
import { nivelLabels, parseAvatar } from '@/lib/coreduca'
import { StreakBadge } from '@/components/gamificacao/StreakBadge'
import type { NivelCoreduca } from '@/types/database'

type MiniProfile = {
    display_name: string | null
    username: string
    bio: string | null
    avatar_url: string | null
    dorama_favorito: string | null
    nivel_atual: NivelCoreduca
    streak_atual: number
}

export function MiniProfileSheet({ userId, onClose }: { userId: string | null; onClose: () => void }) {
    const supabase = useMemo(() => createBrowserClient(), [])
    const [profileState, setProfileState] = useState<{ userId: string; data: MiniProfile | null } | null>(null)

    useEffect(() => {
        if (!userId) {
            return
        }

        const currentUserId = userId
        let active = true

        async function fetchProfile() {
            const { data } = await supabase
                .from('profiles')
                .select('display_name, username, bio, avatar_url, dorama_favorito, nivel_atual, streak_atual')
                .eq('id', currentUserId)
                .single()

            if (!active) return
            setProfileState({
                userId: currentUserId,
                data: data as MiniProfile | null,
            })
        }

        void fetchProfile()
        return () => { active = false }
    }, [userId, supabase])

    const loading = Boolean(userId) && profileState?.userId !== userId
    const profile = profileState?.userId === userId ? profileState.data : null

    const avatarParsed = parseAvatar(profile?.avatar_url)
    const displayName = profile?.display_name || profile?.username || 'Estudante'
    const initials = displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

    return (
        <Sheet open={!!userId} onOpenChange={(open) => { if (!open) onClose() }}>
            <SheetContent side="bottom" className="rounded-t-3xl pb-8">
                <SheetHeader>
                    <SheetTitle className="sr-only">Perfil</SheetTitle>
                </SheetHeader>
                {loading ? (
                    <div className="space-y-3 py-4">
                        <Skeleton className="h-16 w-16 rounded-full mx-auto" />
                        <Skeleton className="h-5 w-32 mx-auto" />
                        <Skeleton className="h-4 w-48 mx-auto" />
                    </div>
                ) : profile ? (
                    <div className="text-center py-4 space-y-3">
                        <Avatar className="h-16 w-16 mx-auto border-4 border-white shadow-md">
                            {avatarParsed ? (
                                <AvatarFallback className="text-3xl" style={{ backgroundColor: avatarParsed.color }}>
                                    {avatarParsed.emoji}
                                </AvatarFallback>
                            ) : (
                                <AvatarFallback className="bg-gradient-to-br from-[var(--color-coreduca-blue)] to-[var(--color-coreduca-purple)] text-white text-xl font-bold">
                                    {initials}
                                </AvatarFallback>
                            )}
                        </Avatar>
                        <div>
                            <p className="text-lg font-bold">{displayName}</p>
                            <p className="text-sm text-muted-foreground">@{profile.username}</p>
                        </div>
                        {profile.bio && <p className="text-sm text-muted-foreground">{profile.bio}</p>}
                        {profile.dorama_favorito && (
                            <p className="text-xs text-muted-foreground">🎬 {profile.dorama_favorito}</p>
                        )}
                        <div className="flex items-center justify-center gap-3 pt-2">
                            <span className="rounded-full bg-[var(--color-coreduca-blue)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--color-coreduca-blue)]">
                                {nivelLabels[profile.nivel_atual] || profile.nivel_atual}
                            </span>
                            {profile.streak_atual > 0 && (
                                <StreakBadge streak={profile.streak_atual} showLabel={false} />
                            )}
                        </div>
                    </div>
                ) : (
                    <p className="py-4 text-center text-sm text-muted-foreground">Perfil nao encontrado.</p>
                )}
            </SheetContent>
        </Sheet>
    )
}
