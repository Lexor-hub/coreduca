'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { LogOut, Crown, Trophy, ChevronRight, BookOpen, Mic, Zap, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { TopBar } from '@/components/layout/TopBar'
import { useAuth } from '@/lib/auth-context'
import { createBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { XPBar } from '@/components/gamificacao/XPBar'
import { StreakBadge } from '@/components/gamificacao/StreakBadge'
import { BadgeGrid, BadgeItem } from '@/components/gamificacao/BadgeGrid'
import { isPremium as checkPremium, planoLabel } from '@/lib/coreduca'

type UserBadge = {
    id: string
    earned_at: string
    badges: { slug: string; nome: string; icone: string | null; descricao: string | null }
}

const nivelXpThresholds: Record<string, number> = {
    exploradora: 100,
    primeiros_passos: 300,
    sobrevivencia: 700,
    conversas_basicas: 1500,
    vida_real: 3000,
    base_dominada: 5000,
}

export default function PerfilPage() {
    const { user, profile, loading: authLoading, signOut } = useAuth()
    const supabase = createBrowserClient()
    const router = useRouter()
    const [userBadges, setUserBadges] = useState<UserBadge[]>([])
    const [allBadges, setAllBadges] = useState<BadgeItem[]>([])
    const [stats, setStats] = useState({ missoes: 0, pronuncia: 0, ia: 0 })
    const [dataError, setDataError] = useState<string | null>(null)
    const [signOutError, setSignOutError] = useState<string | null>(null)
    const [signingOut, setSigningOut] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            if (!profile) {
                setUserBadges([])
                setAllBadges([])
                setStats({ missoes: 0, pronuncia: 0, ia: 0 })
                setDataError(null)
                setLoading(false)
                return
            }

            let nextError: string | null = null

            try {
                setLoading(true)
                setDataError(null)

                const { data: badgesData, error: badgesError } = await supabase
                    .from('badges')
                    .select('slug, nome, icone, descricao')
                    .eq('ativo', true)

                if (badgesError) {
                    nextError = 'Alguns dados do perfil nao puderam ser carregados agora.'
                    setAllBadges([])
                }

                if (badgesData) {
                    setAllBadges(
                        badgesData.map((badge) => ({
                            slug: badge.slug,
                            nome: badge.nome,
                            icone: badge.icone || '🏅',
                            descricao: badge.descricao || undefined,
                        }))
                    )
                }

                const [userBadgesRes, missoesRes, pronunciaRes, iaRes] = await Promise.all([
                    supabase
                        .from('user_badges')
                        .select('id, earned_at, badges(slug, nome, icone, descricao)')
                        .eq('user_id', profile.id),
                    supabase
                        .from('missao_attempts')
                        .select('id', { count: 'exact', head: true })
                        .eq('user_id', profile.id)
                        .eq('status', 'concluida'),
                    supabase
                        .from('pronunciation_attempts')
                        .select('id', { count: 'exact', head: true })
                        .eq('user_id', profile.id),
                    supabase
                        .from('ai_sessions')
                        .select('energia_usada')
                        .eq('user_id', profile.id),
                ])

                if (userBadgesRes.error || missoesRes.error || pronunciaRes.error || iaRes.error) {
                    nextError = 'Alguns dados do perfil nao puderam ser carregados agora.'
                }

                if (userBadgesRes.data) {
                    setUserBadges(userBadgesRes.data as unknown as UserBadge[])
                } else {
                    setUserBadges([])
                }

                const iaTotal = (iaRes.data || []).reduce((sum, session) => sum + (session.energia_usada || 0), 0)
                setStats({
                    missoes: missoesRes.count ?? 0,
                    pronuncia: pronunciaRes.count ?? 0,
                    ia: iaTotal,
                })
            } catch (error) {
                console.error('fetchData error:', error)
                setUserBadges([])
                setAllBadges([])
                setStats({ missoes: 0, pronuncia: 0, ia: 0 })
                nextError = 'Nao foi possivel carregar o perfil agora.'
            } finally {
                setDataError(nextError)
                setLoading(false)
            }
        }

        void fetchData()
    }, [supabase, profile])

    useEffect(() => {
        if (!authLoading && !loading && (!user || !profile)) {
            router.replace('/login')
            router.refresh()
        }
    }, [authLoading, loading, user, profile, router])

    const handleSignOut = async () => {
        try {
            setSigningOut(true)
            setSignOutError(null)
            await signOut()
            router.replace('/login')
            router.refresh()
        } catch (error) {
            console.error('signOut error:', error)
            setSignOutError('Nao foi possivel sair da conta agora. Tente novamente.')
        } finally {
            setSigningOut(false)
        }
    }

    if (authLoading || loading) {
        return (
            <>
                <TopBar title="Perfil" />
                <div className="px-4 py-5 space-y-4">
                    <Skeleton className="h-60 rounded-xl" />
                    <Skeleton className="h-40 rounded-xl" />
                    <Skeleton className="h-40 rounded-xl" />
                </div>
            </>
        )
    }

    if (!user || !profile) {
        return (
            <>
                <TopBar title="Perfil" />
                <div className="px-4 py-5 space-y-4">
                    <Card className="border-0 shadow-sm">
                        <CardContent className="p-6 text-center text-sm text-muted-foreground">
                            Redirecionando para o login...
                        </CardContent>
                    </Card>
                </div>
            </>
        )
    }

    const displayName = profile.display_name || 'Estudante'
    const xpTotal = profile.xp_total ?? 0
    const streak = profile.streak_atual ?? 0
    const nivel = profile.nivel_atual ?? 'exploradora'
    const xpMax = nivelXpThresholds[nivel] ?? 100
    const earnedSlugs = new Set(userBadges.map((b) => b.badges?.slug))
    const initials = displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    const isPremium = checkPremium(profile.plano)

    const statsList = [
        { label: 'Missões feitas', valor: stats.missoes, icon: BookOpen, cor: 'text-[var(--color-coreduca-blue)]' },
        { label: 'Frases praticadas', valor: stats.pronuncia, icon: Mic, cor: 'text-[var(--color-coreduca-red)]' },
        { label: 'Energia usada na IA', valor: stats.ia, icon: Zap, cor: 'text-[var(--color-coreduca-purple)]' },
    ]

    return (
        <div className="min-h-screen bg-background pb-24">
            <TopBar title="Perfil" />

            <div className="px-4 py-5 space-y-6">
                {dataError && (
                    <Card className="border border-amber-200 bg-amber-50 shadow-sm">
                        <CardContent className="p-4 text-sm text-amber-800">
                            {dataError}
                        </CardContent>
                    </Card>
                )}

                {signOutError && (
                    <Card className="border border-red-200 bg-red-50 shadow-sm">
                        <CardContent className="p-4 text-sm text-red-700">
                            {signOutError}
                        </CardContent>
                    </Card>
                )}

                {/* Profile card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="border-0 shadow-md">
                        <CardContent className="p-5 text-center">
                            <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-[var(--color-coreduca-blue)]/20">
                                <AvatarFallback className="bg-gradient-to-br from-[var(--color-coreduca-blue)] to-[var(--color-coreduca-purple)] text-white text-3xl font-bold">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <h2 className="text-2xl font-extrabold">{displayName}</h2>
                            <p className="text-sm text-muted-foreground mb-4">@{profile.username}</p>

                            <div className="flex items-center justify-center gap-2 mb-6">
                                <StreakBadge streak={streak} />
                                <Badge className="bg-[var(--color-coreduca-yellow)]/10 text-[var(--color-coreduca-yellow)] border-0 py-1.5 px-3">
                                    {isPremium ? `👑 ${planoLabel(profile.plano)}` : 'Free'}
                                </Badge>
                            </div>

                            <div className="text-left mt-2">
                                <XPBar xp={xpTotal} nivel={nivel} proximoNivelXp={xpMax} />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Badges */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Trophy className="h-4 w-4" />
                        Conquistas ({earnedSlugs.size}/{allBadges.length})
                    </h3>
                    <BadgeGrid badges={allBadges} earnedSlugs={Array.from(earnedSlugs)} />
                </motion.div>

                {/* Activity stats */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Estatísticas</h3>
                    <Card className="border-0 shadow-sm overflow-hidden">
                        <CardContent className="p-0">
                            {statsList.map((stat, i) => {
                                const Icon = stat.icon
                                return (
                                    <div key={stat.label}>
                                        <div className="flex items-center gap-4 px-5 py-4 hover:bg-muted/50 transition-colors">
                                            <div className={`p-2 rounded-xl bg-opacity-10 ${stat.cor.replace('text-', 'bg-')}`}>
                                                <Icon className={`h-5 w-5 ${stat.cor}`} />
                                            </div>
                                            <span className="text-base font-medium flex-1">{stat.label}</span>
                                            <span className="font-extrabold text-lg">{stat.valor}</span>
                                        </div>
                                        {i < statsList.length - 1 && <Separator />}
                                    </div>
                                )
                            })}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Actions */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                    <Card className="border-0 shadow-sm overflow-hidden">
                        <CardContent className="p-0">
                            {!isPremium && (
                                <>
                                    <Link href="/store" className="w-full flex items-center gap-4 px-5 py-4 hover:bg-secondary/50 transition-colors">
                                        <Crown className="h-6 w-6 text-[var(--color-coreduca-yellow)]" />
                                        <span className="text-base font-semibold flex-1 text-left">Upgrade para Premium</span>
                                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                    </Link>
                                    <Separator />
                                </>
                            )}
                            <button
                                onClick={handleSignOut}
                                disabled={signingOut}
                                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-secondary/50 transition-colors text-[var(--color-coreduca-red)]"
                            >
                                {signingOut ? <Loader2 className="h-6 w-6 animate-spin" /> : <LogOut className="h-6 w-6" />}
                                <span className="text-base font-semibold flex-1 text-left">Sair da conta</span>
                            </button>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}
