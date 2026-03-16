'use client'

import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Crown, Flame, LayoutDashboard, MessageCircle, MessageSquare, Mic, ShieldCheck, Sparkles, Star, Zap } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { Json, NivelCoreduca, Profile } from '@/types/database'
import { calculateProfileCompletion, formatLastSeen, getInterestMeta, isPremium, nivelLabels, parseAvatar, planoLabel } from '@/lib/coreduca'
import { timeAgo } from '@/lib/coreduca'

type AdminBadge = {
    id: string
    earned_at: string
    badges: {
        slug: string
        nome: string
        icone: string | null
    }
}

type RecentPost = {
    id: string
    conteudo: string
    total_comentarios: number
    status: 'ativo' | 'moderado' | 'removido'
    created_at: string
}

type JourneyProgress = {
    trilha_id: string
    total_missoes: number
    missoes_concluidas: number
    percentual: number
}

type DetailStats = {
    missoes: number
    pronuncia: number
    iaEnergia: number
    iaSessoes: number
    posts: number
    comentarios: number
}

type OnboardingSummary = {
    interesse: string | null
    dorama: string | null
    nivel: NivelCoreduca | null
    completedAt: string | null
}

function parseOnboarding(respostas: Json | null, profile: Profile): OnboardingSummary {
    if (!respostas || typeof respostas !== 'object' || Array.isArray(respostas)) {
        return {
            interesse: profile.interesse_principal,
            dorama: profile.dorama_favorito,
            nivel: profile.nivel_atual,
            completedAt: null,
        }
    }

    const payload = respostas as Record<string, Json | undefined>
    return {
        interesse: typeof payload.interesse === 'string' ? payload.interesse : profile.interesse_principal,
        dorama: typeof payload.dorama === 'string' ? payload.dorama : profile.dorama_favorito,
        nivel: typeof payload.nivel === 'string' ? payload.nivel as NivelCoreduca : profile.nivel_atual,
        completedAt: null,
    }
}

export function User360Sheet({
    profile,
    open,
    onOpenChange,
    onProfileChange,
}: {
    profile: Profile | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onProfileChange: (profileId: string, payload: Partial<Profile>) => Promise<void>
}) {
    const supabase = useMemo(() => createBrowserClient(), [])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [updating, setUpdating] = useState<string | null>(null)
    const [stats, setStats] = useState<DetailStats>({
        missoes: 0,
        pronuncia: 0,
        iaEnergia: 0,
        iaSessoes: 0,
        posts: 0,
        comentarios: 0,
    })
    const [recentPosts, setRecentPosts] = useState<RecentPost[]>([])
    const [recentBadges, setRecentBadges] = useState<AdminBadge[]>([])
    const [journeyProgress, setJourneyProgress] = useState<JourneyProgress[]>([])
    const [onboarding, setOnboarding] = useState<OnboardingSummary | null>(null)

    useEffect(() => {
        if (!open || !profile) {
            return
        }

        const selectedProfile = profile
        let active = true

        async function loadDetails() {
            setLoading(true)
            setError(null)

            const [
                userBadgesRes,
                missoesRes,
                pronunciaRes,
                iaRes,
                postsCountRes,
                commentsCountRes,
                recentPostsRes,
                onboardingRes,
                journeyRes,
            ] = await Promise.all([
                supabase
                    .from('user_badges')
                    .select('id, earned_at, badges(slug, nome, icone)')
                    .eq('user_id', selectedProfile.id)
                    .order('earned_at', { ascending: false })
                    .limit(6),
                supabase
                    .from('missao_attempts')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', selectedProfile.id)
                    .eq('status', 'concluida'),
                supabase
                    .from('pronunciation_attempts')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', selectedProfile.id),
                supabase
                    .from('ai_sessions')
                    .select('id, energia_usada')
                    .eq('user_id', selectedProfile.id),
                supabase
                    .from('community_posts')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', selectedProfile.id),
                supabase
                    .from('community_comments')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', selectedProfile.id),
                supabase
                    .from('community_posts')
                    .select('id, conteudo, total_comentarios, status, created_at')
                    .eq('user_id', selectedProfile.id)
                    .order('created_at', { ascending: false })
                    .limit(3),
                supabase
                    .from('onboarding_completions')
                    .select('respostas, completed_at')
                    .eq('user_id', selectedProfile.id)
                    .maybeSingle(),
                supabase
                    .from('user_progress')
                    .select('trilha_id, total_missoes, missoes_concluidas, percentual')
                    .eq('user_id', selectedProfile.id)
                    .order('percentual', { ascending: false })
                    .limit(3),
            ])

            if (!active) return

            const hasError = [
                userBadgesRes.error,
                missoesRes.error,
                pronunciaRes.error,
                iaRes.error,
                postsCountRes.error,
                commentsCountRes.error,
                recentPostsRes.error,
                onboardingRes.error,
                journeyRes.error,
            ].some(Boolean)

            if (hasError) {
                setError('Parte da visao 360 nao carregou. Verifique as politicas admin e tente novamente.')
            }

            const totalIa = (iaRes.data || []).reduce((sum, session) => sum + (session.energia_usada || 0), 0)
            setStats({
                missoes: missoesRes.count ?? 0,
                pronuncia: pronunciaRes.count ?? 0,
                iaEnergia: totalIa,
                iaSessoes: iaRes.data?.length ?? 0,
                posts: postsCountRes.count ?? 0,
                comentarios: commentsCountRes.count ?? 0,
            })
            setRecentPosts((recentPostsRes.data as RecentPost[]) || [])
            setRecentBadges((userBadgesRes.data as unknown as AdminBadge[]) || [])
            setJourneyProgress((journeyRes.data as JourneyProgress[]) || [])

            const parsedOnboarding = parseOnboarding(onboardingRes.data?.respostas ?? null, selectedProfile)
            setOnboarding({
                ...parsedOnboarding,
                completedAt: onboardingRes.data?.completed_at ?? null,
            })
            setLoading(false)
        }

        void loadDetails()

        return () => {
            active = false
        }
    }, [open, profile, supabase])

    if (!profile) {
        return null
    }

    const activeProfile = profile
    const avatarParsed = parseAvatar(activeProfile.avatar_url)
    const displayName = activeProfile.display_name || activeProfile.username
    const initials = displayName.split(' ').map((token) => token[0]).join('').slice(0, 2).toUpperCase()
    const completion = calculateProfileCompletion(activeProfile)
    const interestMeta = getInterestMeta(activeProfile.interesse_principal)
    const profileLevel = nivelLabels[activeProfile.nivel_atual] || activeProfile.nivel_atual

    const statCards = [
        { label: 'Missoes', value: stats.missoes, icon: BookOpen },
        { label: 'Pronuncia', value: stats.pronuncia, icon: Mic },
        { label: 'Sessoes IA', value: stats.iaSessoes, icon: MessageCircle },
        { label: 'Posts', value: stats.posts, icon: MessageSquare },
    ]

    async function handleProfileAction(actionKey: string, payload: Partial<Profile>) {
        try {
            setUpdating(actionKey)
            setError(null)
            await onProfileChange(activeProfile.id, payload)
        } catch {
            setError('Nao foi possivel salvar a alteracao administrativa desse perfil.')
        } finally {
            setUpdating(null)
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full overflow-y-auto border-l-0 p-0 sm:max-w-2xl">
                <div className={`bg-gradient-to-br ${interestMeta.gradientClass} px-6 pb-6 pt-10 text-white`}>
                    <SheetHeader className="px-0 pb-0">
                        <SheetTitle className="text-white">Perfil 360</SheetTitle>
                        <SheetDescription className="text-white/80">
                            Resumo administrativo da experiencia, progresso e presenca dessa usuaria.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-20 w-20 border-4 border-white/30">
                                {avatarParsed ? (
                                    <AvatarFallback className="text-4xl" style={{ backgroundColor: avatarParsed.color }}>
                                        {avatarParsed.emoji}
                                    </AvatarFallback>
                                ) : (
                                    <AvatarFallback className="bg-white/15 text-2xl font-bold text-white">
                                        {initials}
                                    </AvatarFallback>
                                )}
                            </Avatar>
                            <div className="space-y-2">
                                <div>
                                    <p className="text-2xl font-black">{displayName}</p>
                                    <p className="text-sm text-white/80">@{profile.username}</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Badge className="border-0 bg-white/15 text-white">{interestMeta.emoji} {interestMeta.label}</Badge>
                                    <Badge className="border-0 bg-white/15 text-white">Nivel {profileLevel}</Badge>
                                    <Badge className="border-0 bg-white/15 text-white">{planoLabel(profile.plano)}</Badge>
                                    {profile.is_admin && <Badge className="border-0 bg-white text-slate-900"><ShieldCheck className="h-3 w-3" /> Admin</Badge>}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 md:w-[280px]">
                            {statCards.map((stat) => {
                                const Icon = stat.icon
                                return (
                                    <div key={stat.label} className="rounded-2xl bg-white/15 p-3 backdrop-blur-sm">
                                        <div className="flex items-center gap-2 text-white/80">
                                            <Icon className="h-4 w-4" />
                                            <span className="text-xs font-medium uppercase tracking-wide">{stat.label}</span>
                                        </div>
                                        <p className="mt-2 text-2xl font-black">{stat.value}</p>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                <div className="space-y-6 px-6 py-6">
                    {error && (
                        <Card className="border border-amber-200 bg-amber-50 shadow-none">
                            <CardContent className="py-4 text-sm text-amber-800">{error}</CardContent>
                        </Card>
                    )}

                    <Tabs defaultValue="resumo" className="gap-4">
                        <TabsList className="grid w-full grid-cols-4 rounded-full bg-muted/70 p-1">
                            <TabsTrigger value="resumo" className="rounded-full">Resumo</TabsTrigger>
                            <TabsTrigger value="aprendizado" className="rounded-full">Aprendizado</TabsTrigger>
                            <TabsTrigger value="comunidade" className="rounded-full">Comunidade</TabsTrigger>
                            <TabsTrigger value="conta" className="rounded-full">Conta</TabsTrigger>
                        </TabsList>

                        <TabsContent value="resumo" className="space-y-4">
                            {loading ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-40 rounded-3xl" />
                                    <Skeleton className="h-28 rounded-3xl" />
                                </div>
                            ) : (
                                <>
                                    <Card className="border-0 shadow-sm">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <LayoutDashboard className="h-4 w-4 text-[var(--color-coreduca-blue)]" />
                                                Saude do perfil
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-3xl font-black">{completion.percentage}%</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {completion.completed} de {completion.total} itens preenchidos
                                                    </p>
                                                </div>
                                                <div className="text-right text-sm text-muted-foreground">
                                                    <p>Ultimo acesso</p>
                                                    <p className="font-semibold text-foreground">{formatLastSeen(profile.ultimo_acesso)}</p>
                                                </div>
                                            </div>
                                            <Progress value={completion.percentage} className="h-2" />
                                            <div className="grid gap-2 sm:grid-cols-2">
                                                {completion.checklist.map((item) => (
                                                    <div key={item.id} className="flex items-center justify-between rounded-2xl bg-muted/50 px-3 py-2">
                                                        <span className="text-sm">{item.label}</span>
                                                        <Badge variant={item.complete ? 'secondary' : 'outline'}>
                                                            {item.complete ? 'OK' : 'Pendente'}
                                                        </Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <Card className="border-0 shadow-sm">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <Sparkles className="h-4 w-4 text-[var(--color-coreduca-blue)]" />
                                                    Onboarding
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-3 text-sm">
                                                <div className="flex items-center justify-between rounded-2xl bg-muted/50 px-3 py-2">
                                                    <span>Interesse</span>
                                                    <span className="font-semibold">{getInterestMeta(onboarding?.interesse).label}</span>
                                                </div>
                                                <div className="flex items-center justify-between rounded-2xl bg-muted/50 px-3 py-2">
                                                    <span>Nivel inicial</span>
                                                    <span className="font-semibold">{onboarding?.nivel ? nivelLabels[onboarding.nivel] || onboarding.nivel : 'Nao informado'}</span>
                                                </div>
                                                <div className="flex items-center justify-between rounded-2xl bg-muted/50 px-3 py-2">
                                                    <span>Dorama favorito</span>
                                                    <span className="max-w-[180px] truncate font-semibold">{onboarding?.dorama || 'Nao informado'}</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {onboarding?.completedAt ? `Concluido em ${new Date(onboarding.completedAt).toLocaleDateString('pt-BR')}` : 'Sem registro salvo no onboarding.'}
                                                </p>
                                            </CardContent>
                                        </Card>

                                        <Card className="border-0 shadow-sm">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <Star className="h-4 w-4 text-[var(--color-coreduca-yellow)]" />
                                                    Conquistas recentes
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-2">
                                                {recentBadges.length > 0 ? (
                                                    recentBadges.map((item) => (
                                                        <div key={item.id} className="flex items-center justify-between rounded-2xl bg-muted/50 px-3 py-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-lg">{item.badges?.icone || '🏅'}</span>
                                                                <div>
                                                                    <p className="text-sm font-semibold">{item.badges?.nome || 'Badge'}</p>
                                                                    <p className="text-xs text-muted-foreground">{timeAgo(item.earned_at)}</p>
                                                                </div>
                                                            </div>
                                                            <Badge variant="secondary">Conquistado</Badge>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-sm text-muted-foreground">Ainda sem badges atribuidos.</p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                </>
                            )}
                        </TabsContent>

                        <TabsContent value="aprendizado" className="space-y-4">
                            {loading ? (
                                <Skeleton className="h-40 rounded-3xl" />
                            ) : (
                                <>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <Card className="border-0 shadow-sm">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <Flame className="h-4 w-4 text-orange-500" />
                                                    Ritmo atual
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="grid grid-cols-2 gap-3">
                                                <div className="rounded-2xl bg-muted/50 p-3">
                                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Streak atual</p>
                                                    <p className="mt-1 text-2xl font-black">{profile.streak_atual}</p>
                                                </div>
                                                <div className="rounded-2xl bg-muted/50 p-3">
                                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">XP total</p>
                                                    <p className="mt-1 text-2xl font-black">{profile.xp_total}</p>
                                                </div>
                                                <div className="rounded-2xl bg-muted/50 p-3">
                                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Energia IA</p>
                                                    <p className="mt-1 text-2xl font-black">{stats.iaEnergia}</p>
                                                </div>
                                                <div className="rounded-2xl bg-muted/50 p-3">
                                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Plano</p>
                                                    <p className="mt-1 text-lg font-black">{isPremium(profile.plano) ? 'Premium' : 'Free'}</p>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="border-0 shadow-sm">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <Zap className="h-4 w-4 text-[var(--color-coreduca-purple)]" />
                                                    Progresso nas trilhas
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                {journeyProgress.length > 0 ? (
                                                    journeyProgress.map((item) => (
                                                        <div key={item.trilha_id} className="space-y-1.5 rounded-2xl bg-muted/50 p-3">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-sm font-semibold">Trilha {item.trilha_id.slice(0, 8)}</span>
                                                                <span className="text-xs text-muted-foreground">{item.missoes_concluidas}/{item.total_missoes}</span>
                                                            </div>
                                                            <Progress value={item.percentual} className="h-2" />
                                                            <p className="text-xs text-muted-foreground">{Math.round(item.percentual)}% concluido</p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-sm text-muted-foreground">Ainda sem progresso consolidado nas trilhas.</p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                </>
                            )}
                        </TabsContent>

                        <TabsContent value="comunidade" className="space-y-4">
                            {loading ? (
                                <Skeleton className="h-32 rounded-3xl" />
                            ) : (
                                <>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <Card className="border-0 shadow-sm">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <MessageSquare className="h-4 w-4 text-[var(--color-coreduca-blue)]" />
                                                    Presenca social
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="grid grid-cols-2 gap-3">
                                                <div className="rounded-2xl bg-muted/50 p-3">
                                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Posts</p>
                                                    <p className="mt-1 text-2xl font-black">{stats.posts}</p>
                                                </div>
                                                <div className="rounded-2xl bg-muted/50 p-3">
                                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Comentarios</p>
                                                    <p className="mt-1 text-2xl font-black">{stats.comentarios}</p>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="border-0 shadow-sm">
                                            <CardHeader>
                                                <CardTitle>Leitura administrativa</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-2 text-sm text-muted-foreground">
                                                <p>
                                                    {stats.posts > 0
                                                        ? 'A usuaria ja participa da comunidade e tem historico para moderacao e relacionamento.'
                                                        : 'A usuaria ainda nao publicou. Vale considerar CTAs de comunidade e onboarding social.'}
                                                </p>
                                                <p>
                                                    {stats.comentarios > 2
                                                        ? 'Existe sinal de interacao recorrente por comentarios.'
                                                        : 'O nivel de conversa ainda parece baixo.'}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <Card className="border-0 shadow-sm">
                                        <CardHeader>
                                            <CardTitle>Posts recentes</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            {recentPosts.length > 0 ? (
                                                recentPosts.map((post) => (
                                                    <div key={post.id} className="rounded-2xl bg-muted/50 p-3">
                                                        <div className="flex items-center justify-between gap-3">
                                                            <Badge variant={post.status === 'ativo' ? 'secondary' : post.status === 'moderado' ? 'outline' : 'destructive'}>
                                                                {post.status}
                                                            </Badge>
                                                            <span className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</span>
                                                        </div>
                                                        <p className="mt-2 text-sm leading-relaxed">{post.conteudo}</p>
                                                        <p className="mt-2 text-xs text-muted-foreground">{post.total_comentarios} comentarios</p>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-sm text-muted-foreground">Nenhum post encontrado para essa usuaria.</p>
                                            )}
                                        </CardContent>
                                    </Card>
                                </>
                            )}
                        </TabsContent>

                        <TabsContent value="conta" className="space-y-4">
                            <Card className="border-0 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Crown className="h-4 w-4 text-[var(--color-coreduca-yellow)]" />
                                        Acoes administrativas
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            size="sm"
                                            variant={profile.plano === 'free' ? 'default' : 'outline'}
                                            disabled={updating === 'free'}
                                            onClick={() => void handleProfileAction('free', { plano: 'free' })}
                                        >
                                            Free
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={profile.plano === 'premium_mensal' ? 'default' : 'outline'}
                                            disabled={updating === 'mensal'}
                                            onClick={() => void handleProfileAction('mensal', { plano: 'premium_mensal' })}
                                        >
                                            Premium Mensal
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={profile.plano === 'premium_anual' ? 'default' : 'outline'}
                                            disabled={updating === 'anual'}
                                            onClick={() => void handleProfileAction('anual', { plano: 'premium_anual' })}
                                        >
                                            Premium Anual
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={profile.is_admin ? 'default' : 'outline'}
                                            disabled={updating === 'admin'}
                                            onClick={() => void handleProfileAction('admin', { is_admin: !profile.is_admin })}
                                        >
                                            {profile.is_admin ? 'Remover admin' : 'Tornar admin'}
                                        </Button>
                                    </div>

                                    <div className="grid gap-2 text-sm">
                                        <div className="flex items-center justify-between rounded-2xl bg-muted/50 px-3 py-2">
                                            <span>Criado em</span>
                                            <span className="font-semibold">{new Date(profile.created_at).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                        <div className="flex items-center justify-between rounded-2xl bg-muted/50 px-3 py-2">
                                            <span>Ultima atualizacao</span>
                                            <span className="font-semibold">{new Date(profile.updated_at).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                        <div className="flex items-center justify-between rounded-2xl bg-muted/50 px-3 py-2">
                                            <span>Bio</span>
                                            <span className="font-semibold">{profile.bio ? 'Preenchida' : 'Vazia'}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </SheetContent>
        </Sheet>
    )
}
