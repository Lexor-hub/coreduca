'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, Sparkles, ShoppingBag, Flame, RotateCcw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TopBar } from '@/components/layout/TopBar'
import { useAuth } from '@/lib/auth-context'
import { createBrowserClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { XPBar } from '@/components/gamificacao/XPBar'
import { StreakBadge } from '@/components/gamificacao/StreakBadge'
import { nivelXpThresholds, personaEmojiMap } from '@/lib/coreduca'
import type { AIPersona, Missao, PronunciationItem } from '@/types/database'

type Persona = Pick<AIPersona, 'id' | 'slug' | 'nome' | 'descricao' | 'cor_tema'>
type FeaturedMission = Pick<Missao, 'id' | 'titulo'> & { trilhas?: { titulo: string | null; icone: string | null } | null }
type FeaturedPhrase = Pick<PronunciationItem, 'id' | 'frase_coreano' | 'traducao'>

export default function HomePage() {
    const { user, profile, loading: authLoading } = useAuth()
    const supabase = useMemo(() => createBrowserClient(), [])
    const [personas, setPersonas] = useState<Persona[]>([])
    const [featuredMission, setFeaturedMission] = useState<FeaturedMission | null>(null)
    const [featuredPhrase, setFeaturedPhrase] = useState<FeaturedPhrase | null>(null)
    const [loadingData, setLoadingData] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [reloadKey, setReloadKey] = useState(0)

    useEffect(() => {
        let cancelled = false

        async function fetchData() {
            try {
                setLoadingData(true)
                setError(null)

                const [
                    { data: personasData, error: personasError },
                    { data: phraseData, error: phraseError },
                    { data: missionData, error: missionError },
                ] = await Promise.all([
                    supabase
                        .from('ai_personas')
                        .select('id, slug, nome, descricao, cor_tema')
                        .eq('ativo', true)
                        .order('ordem'),
                    supabase
                        .from('pronunciation_items')
                        .select('id, frase_coreano, traducao')
                        .eq('ativo', true)
                        .order('created_at')
                        .limit(1)
                        .maybeSingle(),
                    supabase
                        .from('missoes')
                        .select('id, titulo, ordem, trilha_id, trilhas(titulo, icone)')
                        .eq('ativo', true)
                        .order('ordem'),
                ])

                if (cancelled) return

                setPersonas(personasData ? (personasData as Persona[]) : [])
                setFeaturedPhrase(phraseData ? (phraseData as FeaturedPhrase) : null)

                let nextError: string | null = null

                if (personasError || phraseError || missionError) {
                    nextError = 'A home carregou parcialmente. Tente atualizar para buscar os dados mais recentes.'
                }

                if (missionData && missionData.length > 0) {
                    const missionRows = (missionData as unknown as FeaturedMission[]) || []

                    if (user) {
                        const { data: attempts, error: attemptsError } = await supabase
                            .from('missao_attempts')
                            .select('missao_id')
                            .eq('user_id', user.id)
                            .eq('status', 'concluida')

                        if (attemptsError && !nextError) {
                            nextError = 'Nao foi possivel carregar o progresso da missao do dia.'
                        }

                        const completedIds = new Set(((attempts || []) as Array<{ missao_id: string }>).map((attempt) => attempt.missao_id))
                        const nextMission = missionRows.find((mission) => !completedIds.has(mission.id)) || missionRows[0]
                        setFeaturedMission(nextMission)
                    } else {
                        setFeaturedMission(missionRows[0])
                    }
                } else {
                    setFeaturedMission(null)
                }

                setError(nextError)
            } catch (error) {
                console.error('fetchData error:', error)

                if (!cancelled) {
                    setPersonas([])
                    setFeaturedMission(null)
                    setFeaturedPhrase(null)
                    setError('Nao foi possivel carregar a home agora.')
                }
            } finally {
                if (!cancelled) {
                    setLoadingData(false)
                }
            }
        }
        void fetchData()

        return () => {
            cancelled = true
        }
    }, [supabase, user, reloadKey])

    const isLoading = authLoading || loadingData

    if (isLoading) {
        return (
            <>
                <TopBar title="Home" />
                <div className="px-4 py-5 space-y-4">
                    <Skeleton className="h-8 w-48" />
                    <div className="grid grid-cols-3 gap-3">
                        <Skeleton className="h-20 rounded-xl" />
                        <Skeleton className="h-20 rounded-xl" />
                        <Skeleton className="h-20 rounded-xl" />
                    </div>
                    <Skeleton className="h-32 rounded-2xl" />
                    <Skeleton className="h-32 rounded-2xl" />
                </div>
            </>
        )
    }

    const displayName = profile?.display_name || 'Estudante'
    const xpTotal = profile?.xp_total ?? 0
    const streak = profile?.streak_atual ?? 0
    const nivel = profile?.nivel_atual ?? 'exploradora'
    const xpMax = nivelXpThresholds[nivel] ?? 100
    const hasDynamicContent = personas.length > 0 || Boolean(featuredMission) || Boolean(featuredPhrase)

    return (
        <>
            <TopBar title="Home" />

            <motion.div
                className="px-4 py-5 space-y-5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Card className="border border-amber-200 bg-amber-50 shadow-sm">
                            <CardContent className="flex items-center justify-between gap-3 p-4">
                                <p className="text-sm text-amber-800">{error}</p>
                                <button
                                    onClick={() => setReloadKey((current) => current + 1)}
                                    className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-amber-800 shadow-sm"
                                >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                    Tentar novamente
                                </button>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Greeting & Streak */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-extrabold">
                            안녕! <span className="text-[var(--color-coreduca-blue)]">{displayName}</span> 👋
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1 font-medium">Pronta para aprender coreano hoje?</p>
                    </div>
                    <StreakBadge streak={streak} />
                </motion.div>

                {/* Level progress */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
                    <Card className="border-0 shadow-sm">
                        <CardContent className="p-4">
                            <XPBar xp={xpTotal} nivel={nivel} proximoNivelXp={xpMax} />
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Quick actions */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-2 gap-3"
                >
                    <Link href="/aprender">
                        <Card className="border-0 shadow-md bg-gradient-to-br from-[var(--color-coreduca-blue)] to-[var(--color-coreduca-blue)]/80 text-white cursor-pointer hover:shadow-lg transition-all">
                            <CardContent className="p-4">
                                <Sparkles className="h-6 w-6 mb-2" />
                                <p className="font-bold text-sm">Missão do Dia</p>
                                <p className="text-[10px] text-white/80 mt-0.5">Continue aprendendo</p>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/pronuncia">
                        <Card className="border-0 shadow-md bg-gradient-to-br from-[var(--color-coreduca-red)] to-[var(--color-coreduca-red)]/80 text-white cursor-pointer hover:shadow-lg transition-all">
                            <CardContent className="p-4">
                                <span className="text-2xl block mb-1">🎤</span>
                                <p className="font-bold text-sm">Pronúncia</p>
                                <p className="text-[10px] text-white/80 mt-0.5">Pratique sua fala</p>
                            </CardContent>
                        </Card>
                    </Link>
                </motion.div>

                {/* Desafio 10 Dias */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
                    <Link href="/desafio">
                        <Card className="border-0 shadow-md bg-gradient-to-r from-[#D9252A] to-[#A855F7] text-white cursor-pointer hover:shadow-lg transition-all">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                                    <Flame className="h-6 w-6" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-black text-sm">Desafio 10 Dias</p>
                                    <p className="text-[10px] text-white/80 mt-0.5">10 trilhas, 210 questoes, domine o basico!</p>
                                </div>
                                <ChevronRight className="h-5 w-5 text-white/70 flex-shrink-0" />
                            </CardContent>
                        </Card>
                    </Link>
                </motion.div>

                {/* AI Personas */}
                {personas.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Pratique com IA</h2>
                            <Link href="/ia" className="text-xs text-[var(--color-coreduca-blue)] font-semibold">
                                Ver todas <ChevronRight className="h-3 w-3 inline" />
                            </Link>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
                            {personas.map((persona) => (
                                <Link key={persona.id} href={`/ia/${persona.slug}`}>
                                    <Card className="border-0 shadow-sm min-w-[140px] hover:shadow-md transition-all cursor-pointer">
                                        <CardContent className="p-4 text-center">
                                            <div
                                                className="w-12 h-12 rounded-full mx-auto flex items-center justify-center shadow-sm"
                                                style={{ backgroundColor: `${persona.cor_tema}20` }}
                                            >
                                                <span className="text-2xl">{personaEmojiMap[persona.slug] || '🤖'}</span>
                                            </div>
                                            <p className="font-bold text-sm mt-2">{persona.nome}</p>
                                            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{persona.descricao?.slice(0, 50)}</p>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Store highlight */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
                    <Link href="/store">
                        <Card className="border-0 shadow-md bg-gradient-to-r from-[var(--color-coreduca-yellow)]/10 to-[var(--color-coreduca-red)]/10 hover:shadow-lg transition-all cursor-pointer">
                            <CardContent className="p-4 flex items-center gap-4">
                                <ShoppingBag className="h-8 w-8 text-[var(--color-coreduca-yellow)]" />
                                <div>
                                    <p className="font-bold text-sm">Store Coreduca</p>
                                    <p className="text-xs text-muted-foreground">Workshops, kits e experiências exclusivas</p>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto" />
                            </CardContent>
                        </Card>
                    </Link>
                </motion.div>

                {!hasDynamicContent && !error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Card className="border border-dashed shadow-sm">
                            <CardContent className="p-4 text-sm text-muted-foreground">
                                Ainda nao ha conteudo em destaque para a home. Verifique se o seed do Supabase foi aplicado em producao.
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {(featuredMission || featuredPhrase) && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.38 }} className="grid gap-3">
                        {featuredMission && (
                            <Link href={`/aprender/missao/${featuredMission.id}`}>
                                <Card className="border-0 shadow-sm hover:shadow-md transition-all">
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-coreduca-blue)]/10">
                                            <span className="text-2xl">{featuredMission.trilhas?.icone || '📚'}</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Missão do dia</p>
                                            <p className="mt-1 text-sm font-bold">{featuredMission.titulo}</p>
                                            <p className="text-xs text-muted-foreground">{featuredMission.trilhas?.titulo || 'Continue praticando'}</p>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    </CardContent>
                                </Card>
                            </Link>
                        )}

                        {featuredPhrase && (
                            <Link href={`/pronuncia/pratica/${featuredPhrase.id}`}>
                                <Card className="border-0 shadow-sm hover:shadow-md transition-all">
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-coreduca-red)]/10">
                                            <span className="text-2xl">🎧</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Frase do dia</p>
                                            <p className="mt-1 text-sm font-bold">{featuredPhrase.frase_coreano}</p>
                                            <p className="text-xs text-muted-foreground">{featuredPhrase.traducao}</p>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    </CardContent>
                                </Card>
                            </Link>
                        )}
                    </motion.div>
                )}
            </motion.div>
        </>
    )
}
