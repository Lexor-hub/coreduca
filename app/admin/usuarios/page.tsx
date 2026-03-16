'use client'

import { useEffect, useState } from 'react'
import { UserCog } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Profile } from '@/types/database'

export default function AdminUsuariosPage() {
    const supabase = createBrowserClient()
    const [profiles, setProfiles] = useState<Profile[]>([])

    useEffect(() => {
        async function loadProfiles() {
            const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
            setProfiles((data as Profile[]) || [])
        }

        void loadProfiles()
    }, [supabase])

    const updateProfile = async (profileId: string, payload: Partial<Profile>) => {
        await supabase.from('profiles').update(payload).eq('id', profileId)
        setProfiles((current) => current.map((profile) => profile.id === profileId ? { ...profile, ...payload } : profile))
    }

    return (
        <Card className="border-0 shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UserCog className="h-5 w-5 text-[var(--color-coreduca-blue)]" />
                    Usuárias
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {profiles.map((profile) => (
                    <div key={profile.id} className="flex flex-col gap-3 rounded-3xl border border-border/60 p-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-sm font-bold">{profile.display_name || profile.username}</p>
                            <p className="text-xs text-muted-foreground">@{profile.username}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                XP {profile.xp_total} · streak {profile.streak_atual}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant={profile.plano === 'free' ? 'default' : 'outline'} onClick={() => updateProfile(profile.id, { plano: 'free' })}>
                                Free
                            </Button>
                            <Button size="sm" variant={profile.plano === 'premium_mensal' ? 'default' : 'outline'} onClick={() => updateProfile(profile.id, { plano: 'premium_mensal' })}>
                                Mensal
                            </Button>
                            <Button size="sm" variant={profile.plano === 'premium_anual' ? 'default' : 'outline'} onClick={() => updateProfile(profile.id, { plano: 'premium_anual' })}>
                                Anual
                            </Button>
                            <Button size="sm" variant={profile.is_admin ? 'default' : 'outline'} onClick={() => updateProfile(profile.id, { is_admin: !profile.is_admin })}>
                                {profile.is_admin ? 'Remover admin' : 'Tornar admin'}
                            </Button>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
