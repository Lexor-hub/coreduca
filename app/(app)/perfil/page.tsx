'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { LogOut, Crown, Trophy, ChevronRight, BookOpen, Mic, Zap, Loader2, Pencil } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { TopBar } from '@/components/layout/TopBar'
import { useAuth } from '@/lib/auth-context'
import { createBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { XPBar } from '@/components/gamificacao/XPBar'
import { StreakBadge } from '@/components/gamificacao/StreakBadge'
import { BadgeGrid, BadgeItem } from '@/components/gamificacao/BadgeGrid'
import { getCurrentStreakMilestone, getInterestMeta, getNextStreakMilestone, interestOptions, isPremium as checkPremium, planoLabel, nivelXpThresholds, parseAvatar, streakMilestones } from '@/lib/coreduca'

const AVATAR_EMOJIS = ['🐱', '🐶', '🦊', '🐰', '🐼', '🦋', '🌸', '🔥', '💜', '🎵']
const AVATAR_COLORS = ['#A855F7', '#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#EC4899', '#6366F1', '#14B8A6']

type UserBadge = {
    id: string
    earned_at: string
    badges: { slug: string; nome: string; icone: string | null; descricao: string | null }
}

export default function PerfilPage() {
    const { user, profile, loading: authLoading, refreshProfile, signOut } = useAuth()
    const supabase = useMemo(() => createBrowserClient(), [])
    const router = useRouter()
    const [userBadges, setUserBadges] = useState<UserBadge[]>([])
    const [allBadges, setAllBadges] = useState<BadgeItem[]>([])
    const [stats, setStats] = useState({ missoes: 0, pronuncia: 0, ia: 0 })
    const [dataError, setDataError] = useState<string | null>(null)
    const [signingOut, setSigningOut] = useState(false)
    const [loading, setLoading] = useState(true)

    // Edit profile state
    const [editOpen, setEditOpen] = useState(false)
    const [editName, setEditName] = useState('')
    const [editBio, setEditBio] = useState('')
    const [editDorama, setEditDorama] = useState('')
    const [editInterest, setEditInterest] = useState<string | null>(null)
    const [editEmoji, setEditEmoji] = useState('🐱')
    const [editColor, setEditColor] = useState('#A855F7')
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)

    // Sign out confirmation
    const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false)

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
        if (!authLoading && !loading && !user) {
            router.replace('/login')
            router.refresh()
        }
    }, [authLoading, loading, user, router])

    const openEditDialog = () => {
        if (!profile) return
        setEditName(profile.display_name || '')
        setEditBio(profile.bio || '')
        setEditDorama(profile.dorama_favorito || '')
        setEditInterest(profile.interesse_principal || null)
        const parsed = parseAvatar(profile.avatar_url)
        setEditEmoji(parsed?.emoji || '🐱')
        setEditColor(parsed?.color || '#A855F7')
        setSaveError(null)
        setEditOpen(true)
    }

    const handleSaveProfile = async () => {
        if (!profile) return
        setSaving(true)
        setSaveError(null)
        const { error } = await supabase
            .from('profiles')
            .update({
                display_name: editName.trim() || null,
                bio: editBio.trim() || null,
                dorama_favorito: editDorama.trim() || null,
                interesse_principal: editInterest,
                avatar_url: `emoji:${editEmoji}:${editColor}`,
            })
            .eq('id', profile.id)

        if (!error) {
            await refreshProfile()
            setEditOpen(false)
        } else {
            setSaveError('Nao foi possivel salvar seu perfil agora. Tente novamente.')
        }
        setSaving(false)
    }

    const handleSignOut = async () => {
        try {
            setSigningOut(true)
            await signOut()
        } catch (error) {
            console.error('local signOut error:', error)
        } finally {
            window.location.replace('/auth/signout')
        }
    }

    const handleProfileRetry = async () => {
        try {
            setLoading(true)
            await refreshProfile()
        } catch (error) {
            console.error('refreshProfile error:', error)
        } finally {
            setLoading(false)
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

    if (!user) {
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

    if (!profile) {
        return (
            <>
                <TopBar title="Perfil" />
                <div className="px-4 py-5 space-y-4">
                    <Card className="border-0 shadow-sm">
                        <CardContent className="space-y-4 p-6 text-center">
                            <div className="space-y-2">
                                <h2 className="text-lg font-bold">Seu perfil nao esta disponivel agora</h2>
                                <p className="text-sm text-muted-foreground">
                                    A sessao foi carregada, mas os dados do perfil nao vieram do banco. Tente recarregar ou sair da conta.
                                </p>
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                                <button
                                    onClick={handleProfileRetry}
                                    className="rounded-full bg-[var(--color-coreduca-blue)] px-4 py-2 text-sm font-semibold text-white"
                                >
                                    Tentar novamente
                                </button>
                                <button
                                    onClick={handleSignOut}
                                    disabled={signingOut}
                                    className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted-foreground"
                                >
                                    {signingOut ? 'Saindo...' : 'Sair da conta'}
                                </button>
                            </div>
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
    const isPremium = checkPremium(profile.plano)
    const avatarParsed = parseAvatar(profile.avatar_url)
    const initials = displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    const currentStreakMilestone = getCurrentStreakMilestone(streak)
    const nextStreakMilestone = getNextStreakMilestone(streak)
    const interestMeta = getInterestMeta(profile.interesse_principal)
    const previousStreakThreshold = currentStreakMilestone?.threshold ?? 0
    const streakRange = nextStreakMilestone ? Math.max(nextStreakMilestone.threshold - previousStreakThreshold, 1) : 1
    const streakProgress = nextStreakMilestone
        ? Math.min(100, Math.max(0, ((streak - previousStreakThreshold) / streakRange) * 100))
        : 100

    const statsList = [
        { label: 'Missoes feitas', valor: stats.missoes, icon: BookOpen, cor: 'text-[var(--color-coreduca-blue)]' },
        { label: 'Frases praticadas', valor: stats.pronuncia, icon: Mic, cor: 'text-[var(--color-coreduca-red)]' },
        { label: 'Energia usada na IA', valor: stats.ia, icon: Zap, cor: 'text-[var(--color-coreduca-purple)]' },
    ]

    return (
        <div className="min-h-screen bg-background pb-24">
            <TopBar title="Perfil" />

            {/* Edit Profile Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Editar perfil</DialogTitle>
                            <DialogDescription>Atualize sua apresentacao, interesse principal e avatar.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Nome</label>
                            <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Seu nome"
                                maxLength={50}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Bio</label>
                            <Textarea
                                value={editBio}
                                onChange={(e) => setEditBio(e.target.value)}
                                placeholder="Conte um pouco sobre voce..."
                                maxLength={200}
                                className="min-h-20"
                            />
                            <p className="text-xs text-muted-foreground text-right mt-1">{editBio.length}/200</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Dorama favorito</label>
                            <Input
                                value={editDorama}
                                onChange={(e) => setEditDorama(e.target.value)}
                                placeholder="Ex: Crash Landing on You"
                                maxLength={100}
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium">Interesse principal</label>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {interestOptions.map((option) => {
                                    const isSelected = editInterest === option.id
                                    return (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() => setEditInterest(option.id)}
                                            className={`rounded-2xl border px-3 py-3 text-left transition-all ${isSelected
                                                ? 'border-[var(--color-coreduca-blue)] bg-[var(--color-coreduca-blue)]/10 shadow-sm'
                                                : 'border-border/60 bg-muted/40 hover:bg-muted/70'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{option.emoji}</span>
                                                <span className="text-sm font-bold">{option.label}</span>
                                            </div>
                                            <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium block mb-2">Avatar</label>
                            <div className="flex items-center gap-4 mb-3">
                                <div
                                    className="h-16 w-16 rounded-full flex items-center justify-center text-3xl border-4 border-white shadow-md"
                                    style={{ backgroundColor: editColor }}
                                >
                                    {editEmoji}
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {AVATAR_EMOJIS.map((e) => (
                                    <button
                                        key={e}
                                        onClick={() => setEditEmoji(e)}
                                        className={`h-9 w-9 rounded-full flex items-center justify-center text-lg transition-all ${editEmoji === e ? 'ring-2 ring-[var(--color-coreduca-blue)] scale-110' : 'bg-secondary'}`}
                                    >
                                        {e}
                                    </button>
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {AVATAR_COLORS.map((c) => (
                                    <button
                                        key={c}
                                        onClick={() => setEditColor(c)}
                                        className={`h-7 w-7 rounded-full transition-all ${editColor === c ? 'ring-2 ring-offset-2 ring-[var(--color-coreduca-blue)] scale-110' : ''}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>
                        {saveError && (
                            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                                {saveError}
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSaveProfile} disabled={saving} className="bg-[var(--color-coreduca-blue)] text-white">
                            {saving ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Sign Out Confirmation */}
            <Dialog open={signOutConfirmOpen} onOpenChange={setSignOutConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Sair da conta?</DialogTitle>
                        <DialogDescription>Voce precisara fazer login novamente para acessar o app.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSignOutConfirmOpen(false)}>Cancelar</Button>
                        <Button
                            onClick={() => { setSignOutConfirmOpen(false); handleSignOut() }}
                            disabled={signingOut}
                            className="bg-[var(--color-coreduca-red)] text-white"
                        >
                            {signingOut ? 'Saindo...' : 'Sair'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="px-4 py-5 space-y-6">
                {dataError && (
                    <Card className="border border-amber-200 bg-amber-50 shadow-sm">
                        <CardContent className="p-4 text-sm text-amber-800">
                            {dataError}
                        </CardContent>
                    </Card>
                )}

                {/* Profile card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="border-0 shadow-md">
                        <CardContent className="p-5 text-center">
                            <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-white shadow-md">
                                {avatarParsed ? (
                                    <AvatarFallback
                                        className="text-4xl"
                                        style={{ backgroundColor: avatarParsed.color }}
                                    >
                                        {avatarParsed.emoji}
                                    </AvatarFallback>
                                ) : (
                                    <AvatarFallback className="bg-gradient-to-br from-[var(--color-coreduca-blue)] to-[var(--color-coreduca-purple)] text-white text-3xl font-bold">
                                        {initials}
                                    </AvatarFallback>
                                )}
                            </Avatar>
                            <h2 className="text-2xl font-extrabold">{displayName}</h2>
                            <p className="text-sm text-muted-foreground">@{profile.username}</p>
                            <div className="mt-3 flex justify-center">
                                <Badge className={`border-0 px-3 py-1.5 ${interestMeta.surfaceClass}`}>
                                    {interestMeta.emoji} {interestMeta.label}
                                </Badge>
                            </div>

                            {/* Bio & Dorama */}
                            {(profile.bio || profile.dorama_favorito) ? (
                                <div className="mt-3 space-y-1">
                                    {profile.bio && <p className="text-sm text-muted-foreground">{profile.bio}</p>}
                                    {profile.dorama_favorito && (
                                        <p className="text-xs text-muted-foreground">
                                            🎬 {profile.dorama_favorito}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <button
                                    onClick={openEditDialog}
                                    className="mt-2 text-xs text-[var(--color-coreduca-blue)] font-semibold"
                                >
                                    Adicione sua bio
                                </button>
                            )}

                            {/* Edit button */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={openEditDialog}
                                className="mt-4 rounded-full"
                            >
                                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                                Editar perfil
                            </Button>

                            <div className="flex items-center justify-center gap-2 mt-4 mb-6">
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

                {/* Streak journey */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
                    <Card className={`overflow-hidden border-0 shadow-md ${currentStreakMilestone ? `bg-gradient-to-br ${currentStreakMilestone.gradientClass} text-white` : 'bg-gradient-to-br from-slate-50 to-white'}`}>
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className={`text-xs font-bold uppercase tracking-[0.2em] ${currentStreakMilestone ? 'text-white/75' : 'text-muted-foreground'}`}>
                                        Jornada de streak
                                    </p>
                                    <h3 className="mt-2 text-2xl font-black">
                                        {currentStreakMilestone ? currentStreakMilestone.nome : 'Acenda sua rotina'}
                                    </h3>
                                    <p className={`mt-2 text-sm ${currentStreakMilestone ? 'text-white/85' : 'text-muted-foreground'}`}>
                                        {currentStreakMilestone
                                            ? currentStreakMilestone.descricao
                                            : 'A cada dia seguido voce sobe de tier e desbloqueia selos inspirados na cultura coreana.'}
                                    </p>
                                </div>
                                <div className={`rounded-3xl px-4 py-3 text-center shadow-sm ${currentStreakMilestone ? 'bg-white/15 backdrop-blur-sm' : 'bg-[var(--color-coreduca-blue)]/10'}`}>
                                    <p className="text-3xl">{currentStreakMilestone?.icone || '🔥'}</p>
                                    <p className={`mt-1 text-xl font-black ${currentStreakMilestone ? 'text-white' : 'text-[var(--color-coreduca-blue)]'}`}>{streak}</p>
                                    <p className={`text-xs font-semibold ${currentStreakMilestone ? 'text-white/80' : 'text-muted-foreground'}`}>dias</p>
                                </div>
                            </div>

                            <div className="mt-5 space-y-2">
                                <div className="flex items-center justify-between text-xs font-semibold">
                                    <span className={currentStreakMilestone ? 'text-white/80' : 'text-muted-foreground'}>
                                        {nextStreakMilestone
                                            ? `Faltam ${Math.max(nextStreakMilestone.threshold - streak, 0)} dias para ${nextStreakMilestone.nome}`
                                            : 'Voce ja desbloqueou o tier maximo de streak.'}
                                    </span>
                                    <span className={currentStreakMilestone ? 'text-white' : 'text-foreground'}>
                                        {nextStreakMilestone ? `${streak}/${nextStreakMilestone.threshold}` : '100/100'}
                                    </span>
                                </div>
                                <Progress value={streakProgress} className={`h-2 ${currentStreakMilestone ? 'bg-white/20' : ''}`} />
                            </div>

                            <div className="mt-5 flex flex-wrap gap-2">
                                {streakMilestones.map((milestone) => {
                                    const unlocked = streak >= milestone.threshold
                                    const isCurrent = currentStreakMilestone?.slug === milestone.slug

                                    return (
                                        <div
                                            key={milestone.slug}
                                            className={`rounded-full px-3 py-1.5 text-xs font-bold shadow-sm ${unlocked
                                                ? isCurrent
                                                    ? 'bg-white text-slate-900'
                                                    : currentStreakMilestone
                                                        ? 'bg-white/15 text-white'
                                                        : `${milestone.surfaceClass}`
                                                : currentStreakMilestone
                                                    ? 'border border-white/20 bg-white/10 text-white/75'
                                                    : 'border border-border/60 bg-muted/50 text-muted-foreground'
                                                }`}
                                        >
                                            {milestone.icone} {milestone.threshold}d
                                        </div>
                                    )
                                })}
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
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Estatisticas</h3>
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
                                onClick={() => setSignOutConfirmOpen(true)}
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
