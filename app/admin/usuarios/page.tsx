'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, SlidersHorizontal, UserCog } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { Profile } from '@/types/database'
import { User360Sheet } from '@/components/admin/User360Sheet'
import { formatLastSeen, getInterestMeta, isPremium, planoLabel } from '@/lib/coreduca'

export default function AdminUsuariosPage() {
    const supabase = useMemo(() => createBrowserClient(), [])
    const [profiles, setProfiles] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState<'all' | 'premium' | 'admins' | 'streak_30'>('all')
    const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
    const [savingKey, setSavingKey] = useState<string | null>(null)

    useEffect(() => {
        async function loadProfiles() {
            setLoading(true)
            setError(null)

            const { data, error: loadError } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false })

            if (loadError) {
                setError('Nao foi possivel carregar as usuarias agora.')
                setProfiles([])
            } else {
                setProfiles((data as Profile[]) || [])
            }

            setLoading(false)
        }

        void loadProfiles()
    }, [supabase])

    const updateProfile = async (profileId: string, payload: Partial<Profile>) => {
        const { error: updateError } = await supabase.from('profiles').update(payload).eq('id', profileId)
        if (updateError) {
            throw updateError
        }
        setProfiles((current) => current.map((profile) => profile.id === profileId ? { ...profile, ...payload } : profile))
    }

    async function handleQuickUpdate(actionKey: string, profileId: string, payload: Partial<Profile>) {
        try {
            setSavingKey(`${profileId}:${actionKey}`)
            setError(null)
            await updateProfile(profileId, payload)
        } catch {
            setError('Nao foi possivel atualizar essa usuaria. Verifique a policy admin de update em profiles.')
        } finally {
            setSavingKey(null)
        }
    }

    const filteredProfiles = profiles.filter((profile) => {
        const normalizedSearch = search.trim().toLowerCase()
        const matchesSearch = !normalizedSearch
            || profile.username.toLowerCase().includes(normalizedSearch)
            || (profile.display_name || '').toLowerCase().includes(normalizedSearch)

        const matchesFilter = filter === 'all'
            || (filter === 'premium' && isPremium(profile.plano))
            || (filter === 'admins' && profile.is_admin)
            || (filter === 'streak_30' && profile.streak_maximo >= 30)

        return matchesSearch && matchesFilter
    })

    const selectedProfile = profiles.find((profile) => profile.id === selectedProfileId) || null

    return (
        <>
            <Card className="border-0 shadow-sm">
                <CardHeader className="space-y-4">
                    <div className="flex items-center gap-2">
                        <UserCog className="h-5 w-5 text-[var(--color-coreduca-blue)]" />
                        <CardTitle>Usuárias</CardTitle>
                    </div>

                    <div className="flex flex-col gap-3 md:flex-row md:items-center">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Buscar por nome ou @username"
                                className="pl-9"
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { key: 'all', label: 'Todas' },
                                { key: 'premium', label: 'Premium' },
                                { key: 'admins', label: 'Admins' },
                                { key: 'streak_30', label: '30+ dias' },
                            ].map((item) => (
                                <Button
                                    key={item.key}
                                    size="sm"
                                    variant={filter === item.key ? 'default' : 'outline'}
                                    onClick={() => setFilter(item.key as typeof filter)}
                                >
                                    <SlidersHorizontal className="h-3.5 w-3.5" />
                                    {item.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {error && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((item) => (
                                <Skeleton key={item} className="h-28 rounded-3xl" />
                            ))}
                        </div>
                    ) : filteredProfiles.length > 0 ? (
                        filteredProfiles.map((profile) => {
                            const interestMeta = getInterestMeta(profile.interesse_principal)
                            return (
                                <div key={profile.id} className="flex flex-col gap-4 rounded-3xl border border-border/60 p-4">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                        <div className="space-y-2">
                                            <div>
                                                <p className="text-base font-bold">{profile.display_name || profile.username}</p>
                                                <p className="text-xs text-muted-foreground">@{profile.username}</p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <Badge variant="outline">XP {profile.xp_total}</Badge>
                                                <Badge variant="outline">Streak {profile.streak_atual}d</Badge>
                                                <Badge className={`border-0 ${interestMeta.surfaceClass}`}>
                                                    {interestMeta.emoji} {interestMeta.label}
                                                </Badge>
                                                <Badge className={isPremium(profile.plano) ? 'border-0 bg-[var(--color-coreduca-yellow)]/15 text-[var(--color-coreduca-yellow)]' : ''}>
                                                    {planoLabel(profile.plano)}
                                                </Badge>
                                                {profile.is_admin && <Badge>Admin</Badge>}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Ultimo acesso: {formatLastSeen(profile.ultimo_acesso)} · streak maxima {profile.streak_maximo} dias
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <Button size="sm" variant="outline" onClick={() => setSelectedProfileId(profile.id)}>
                                                Abrir perfil 360
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={profile.plano === 'free' ? 'default' : 'outline'}
                                                disabled={savingKey === `${profile.id}:free`}
                                                onClick={() => void handleQuickUpdate('free', profile.id, { plano: 'free' })}
                                            >
                                                Free
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={profile.plano === 'premium_mensal' ? 'default' : 'outline'}
                                                disabled={savingKey === `${profile.id}:mensal`}
                                                onClick={() => void handleQuickUpdate('mensal', profile.id, { plano: 'premium_mensal' })}
                                            >
                                                Mensal
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={profile.plano === 'premium_anual' ? 'default' : 'outline'}
                                                disabled={savingKey === `${profile.id}:anual`}
                                                onClick={() => void handleQuickUpdate('anual', profile.id, { plano: 'premium_anual' })}
                                            >
                                                Anual
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={profile.is_admin ? 'default' : 'outline'}
                                                disabled={savingKey === `${profile.id}:admin`}
                                                onClick={() => void handleQuickUpdate('admin', profile.id, { is_admin: !profile.is_admin })}
                                            >
                                                {profile.is_admin ? 'Remover admin' : 'Tornar admin'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <div className="rounded-3xl border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground">
                            Nenhuma usuaria encontrada para esse filtro.
                        </div>
                    )}
                </CardContent>
            </Card>

            <User360Sheet
                profile={selectedProfile}
                open={Boolean(selectedProfile)}
                onOpenChange={(open) => { if (!open) setSelectedProfileId(null) }}
                onProfileChange={updateProfile}
            />
        </>
    )
}
