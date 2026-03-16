'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, CheckCircle2, Play, ChevronRight, Flame, Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { TopBar } from '@/components/layout/TopBar'
import { HangulPreview } from '@/components/quiz/HangulPreview'
import { CulturalTip, getRandomTip } from '@/components/quiz/CulturalTip'
import { useAuth } from '@/lib/auth-context'
import { createBrowserClient } from '@/lib/supabase/client'
import Link from 'next/link'

type TrilhaWithMissoes = {
    id: string
    slug: string
    titulo: string
    descricao: string | null
    ordem: number
    icone: string | null
    cor: string | null
    missoes: {
        id: string
        titulo: string
        descricao: string | null
        ordem: number
        xp_recompensa: number
        _questaoCount?: number
    }[]
}

type TrilhaRow = Omit<TrilhaWithMissoes, 'missoes'>
type MissaoRow = TrilhaWithMissoes['missoes'][number] & { trilha_id: string }
type MissaoAttemptRow = { missao_id: string }

const hangulDodia: Record<number, { caractere: string; romanizacao: string; exemplo: string; exemploTraducao: string }> = {
    1: { caractere: 'ㅏ', romanizacao: 'a', exemplo: '아이 (ai)', exemploTraducao: 'criança' },
    2: { caractere: 'ㄱ', romanizacao: 'g/k', exemplo: '가다 (gada)', exemploTraducao: 'ir' },
    3: { caractere: '안', romanizacao: 'an', exemplo: '안녕 (annyeong)', exemploTraducao: 'olá' },
    4: { caractere: '저', romanizacao: 'jeo', exemplo: '저는 (jeoneun)', exemploTraducao: 'eu (formal)' },
    5: { caractere: '일', romanizacao: 'il', exemplo: '일이삼 (il-i-sam)', exemploTraducao: '1-2-3' },
    6: { caractere: '색', romanizacao: 'saek', exemplo: '빨간색 (ppalgansaek)', exemploTraducao: 'vermelho' },
    7: { caractere: '사', romanizacao: 'sa', exemplo: '사랑 (sarang)', exemploTraducao: 'amor' },
    8: { caractere: '밥', romanizacao: 'bap', exemplo: '비빔밥 (bibimbap)', exemploTraducao: 'bibimbap' },
    9: { caractere: '주', romanizacao: 'ju', exemplo: '주세요 (juseyo)', exemploTraducao: 'por favor (dê-me)' },
    10: { caractere: '행', romanizacao: 'haeng', exemplo: '행복 (haengbok)', exemploTraducao: 'felicidade' },
}

export default function DesafioPage() {
    const { user, profile, loading: authLoading } = useAuth()
    const supabase = createBrowserClient()
    const [trilhas, setTrilhas] = useState<TrilhaWithMissoes[]>([])
    const [completedMissoes, setCompletedMissoes] = useState<Set<string>>(new Set())
    const [loadingData, setLoadingData] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [reloadKey, setReloadKey] = useState(0)

    useEffect(() => {
        if (authLoading) return

        let cancelled = false

        async function fetchData() {
            try {
                setLoadingData(true)
                setError(null)

                const { data: trilhasData, error: trilhasError } = await supabase
                    .from('trilhas')
                    .select('id, slug, titulo, descricao, ordem, icone, cor')
                    .eq('ativo', true)
                    .order('ordem')

                if (trilhasError) {
                    throw new Error(`Nao foi possivel carregar as trilhas do desafio: ${trilhasError.message}`)
                }

                const { data: missoesData, error: missoesError } = await supabase
                    .from('missoes')
                    .select('id, trilha_id, titulo, descricao, ordem, xp_recompensa')
                    .eq('ativo', true)
                    .order('ordem')

                if (missoesError) {
                    throw new Error(`Nao foi possivel carregar as missoes do desafio: ${missoesError.message}`)
                }

                const missoesByTrilha: Record<string, TrilhaWithMissoes['missoes']> = {}
                ;(missoesData as MissaoRow[] | null)?.forEach((m) => {
                    if (!missoesByTrilha[m.trilha_id]) missoesByTrilha[m.trilha_id] = []
                    missoesByTrilha[m.trilha_id].push(m)
                })

                const result: TrilhaWithMissoes[] = ((trilhasData as TrilhaRow[] | null) ?? []).map((t) => ({
                    ...t,
                    missoes: missoesByTrilha[t.id] || [],
                }))

                if (!cancelled) {
                    setTrilhas(result)
                }

                if (user) {
                    const { data: attempts, error: attemptsError } = await supabase
                        .from('missao_attempts')
                        .select('missao_id')
                        .eq('user_id', user.id)
                        .eq('status', 'concluida')

                    if (cancelled) return

                    if (attemptsError) {
                        setCompletedMissoes(new Set())
                        setError('O desafio foi carregado, mas seu progresso ainda nao pode ser exibido.')
                    } else if (attempts) {
                        setCompletedMissoes(new Set((attempts as MissaoAttemptRow[]).map((attempt) => attempt.missao_id)))
                    } else {
                        setCompletedMissoes(new Set())
                    }
                } else if (!cancelled) {
                    setCompletedMissoes(new Set())
                }
            } catch (error) {
                console.error('fetchData error:', error)

                if (!cancelled) {
                    setTrilhas([])
                    setCompletedMissoes(new Set())
                    setError(error instanceof Error ? error.message : 'Nao foi possivel carregar o desafio agora.')
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
    }, [supabase, user, authLoading, reloadKey])

    const isLoading = authLoading || loadingData

    if (isLoading) {
        return (
            <>
                <TopBar title="Desafio 10 Dias" showBack />
                <div className="px-4 py-5 space-y-4">
                    <Skeleton className="h-48 rounded-3xl" />
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
                </div>
            </>
        )
    }

    if (trilhas.length === 0) {
        return (
            <>
                <TopBar title="Desafio 10 Dias" showBack />
                <div className="px-4 py-5">
                    <Card className="border-0 shadow-sm">
                        <CardContent className="space-y-4 p-6 text-center">
                            <p className="text-sm text-muted-foreground">
                                {error || 'Nenhuma trilha do desafio foi encontrada.'}
                            </p>
                            <button
                                onClick={() => setReloadKey((current) => current + 1)}
                                className="rounded-full bg-[var(--color-coreduca-blue)] px-4 py-2 text-sm font-semibold text-white"
                            >
                                Tentar novamente
                            </button>
                        </CardContent>
                    </Card>
                </div>
            </>
        )
    }

    // Calculate current day: first trilha with incomplete missoes
    const currentDayIndex = trilhas.findIndex(t =>
        t.missoes.some(m => !completedMissoes.has(m.id))
    )
    const activeDayIndex = currentDayIndex === -1 ? trilhas.length - 1 : currentDayIndex

    // Overall progress
    const totalMissoes = trilhas.reduce((acc, t) => acc + t.missoes.length, 0)
    const totalCompleted = trilhas.reduce((acc, t) =>
        acc + t.missoes.filter(m => completedMissoes.has(m.id)).length, 0)
    const overallProgress = totalMissoes > 0 ? Math.round((totalCompleted / totalMissoes) * 100) : 0

    // XP earned today (from completed missoes of active day)
    const activeTrilha = trilhas[activeDayIndex]
    const xpDia = activeTrilha?.missoes
        .filter(m => completedMissoes.has(m.id))
        .reduce((acc, m) => acc + m.xp_recompensa, 0) ?? 0

    const hangul = hangulDodia[activeDayIndex + 1]

    return (
        <>
            <TopBar title="Desafio 10 Dias" showBack />

            <div className="px-4 py-5 space-y-5">
                {error && (
                    <Card className="border border-amber-200 bg-amber-50 shadow-sm">
                        <CardContent className="p-4 text-sm text-amber-800">
                            {error}
                        </CardContent>
                    </Card>
                )}

                {/* Hero card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-3xl p-6 text-white relative overflow-hidden"
                    style={{
                        background: `linear-gradient(135deg, ${activeTrilha?.cor || '#132034'}, ${activeTrilha?.cor || '#132034'}dd)`,
                    }}
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10" />
                    <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full -ml-6 -mb-6" />

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <span className="text-3xl">{activeTrilha?.icone}</span>
                                <div>
                                    <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">
                                        Dia {activeDayIndex + 1} de {trilhas.length}
                                    </p>
                                    <h2 className="text-xl font-black">{activeTrilha?.titulo}</h2>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full">
                                <Flame className="h-4 w-4" />
                                <span className="text-sm font-bold">{profile?.streak_atual ?? 0}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-white/80">
                                <span>Progresso geral</span>
                                <span>{overallProgress}%</span>
                            </div>
                            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-white rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${overallProgress}%` }}
                                    transition={{ duration: 0.8, ease: 'easeOut' }}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/20">
                            <div className="flex items-center gap-1.5">
                                <Star className="h-4 w-4 text-yellow-300" />
                                <span className="text-sm font-bold">{xpDia} XP hoje</span>
                            </div>
                            <div className="text-sm text-white/70">
                                {totalCompleted}/{totalMissoes} missoes
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Hangul preview */}
                {hangul && (
                    <HangulPreview
                        caractere={hangul.caractere}
                        romanizacao={hangul.romanizacao}
                        exemplo={hangul.exemplo}
                        exemploTraducao={hangul.exemploTraducao}
                    />
                )}

                {/* Days list */}
                <div className="space-y-6">
                    {trilhas.map((trilha, dayIndex) => {
                        const isDayCompleted = trilha.missoes.every(m => completedMissoes.has(m.id))
                        const isDayAvailable = dayIndex === 0 || trilhas[dayIndex - 1].missoes.every(m => completedMissoes.has(m.id))
                        const isDayActive = dayIndex === activeDayIndex
                        const dayXp = trilha.missoes.reduce((acc, m) => acc + m.xp_recompensa, 0)
                        const dayCompleted = trilha.missoes.filter(m => completedMissoes.has(m.id)).length
                        const dayProgress = trilha.missoes.length > 0
                            ? Math.round((dayCompleted / trilha.missoes.length) * 100) : 0

                        return (
                            <motion.div
                                key={trilha.id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: dayIndex * 0.05 }}
                            >
                                {/* Day header */}
                                <div className={`flex items-center gap-3 mb-3 ${!isDayAvailable && !isDayCompleted ? 'opacity-40' : ''}`}>
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                                        style={{ backgroundColor: isDayAvailable || isDayCompleted ? `${trilha.cor}20` : undefined }}
                                    >
                                        {isDayCompleted ? (
                                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                                        ) : isDayAvailable ? (
                                            <span className="text-lg">{trilha.icone}</span>
                                        ) : (
                                            <Lock className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs font-bold text-muted-foreground uppercase">
                                                Dia {dayIndex + 1}
                                            </p>
                                            {isDayCompleted && (
                                                <Badge className="text-[10px] bg-green-100 text-green-700 border-0">
                                                    Completo
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="font-bold text-sm">{trilha.titulo}</p>
                                    </div>
                                    <Badge variant="secondary" className="text-[10px] font-bold flex-shrink-0">
                                        {dayXp} XP
                                    </Badge>
                                </div>

                                {/* Day progress */}
                                {(isDayAvailable || isDayCompleted) && (
                                    <div className="ml-[52px] mb-3">
                                        <Progress value={dayProgress} className="h-1.5" />
                                    </div>
                                )}

                                {/* Missoes cards — only show for active/completed days */}
                                {(isDayActive || isDayCompleted) && (
                                    <div className="ml-[52px] space-y-2">
                                        {trilha.missoes.map((missao, mIndex) => {
                                            const isCompleted = completedMissoes.has(missao.id)
                                            const prevCompleted = mIndex === 0
                                                ? isDayAvailable
                                                : completedMissoes.has(trilha.missoes[mIndex - 1]?.id)
                                            const isAvailable = !isCompleted && prevCompleted
                                            const isLocked = !isCompleted && !isAvailable

                                            return (
                                                <motion.div
                                                    key={missao.id}
                                                    initial={isDayActive ? { opacity: 0, x: -10 } : false}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: mIndex * 0.08 }}
                                                >
                                                    <Link href={isAvailable ? `/aprender/missao/${missao.id}` : '#'}>
                                                        <Card className={`border-0 shadow-sm transition-all ${
                                                            isLocked ? 'opacity-50' : 'hover:shadow-md cursor-pointer'
                                                        } ${isAvailable ? 'ring-2 ring-[var(--color-coreduca-blue)]/30' : ''}`}>
                                                            <CardContent className="p-3 flex items-center gap-3">
                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                                    isCompleted ? 'bg-green-100' :
                                                                    isAvailable ? 'bg-[var(--color-coreduca-blue)]/10' :
                                                                    'bg-secondary'
                                                                }`}>
                                                                    {isCompleted ? (
                                                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                                    ) : isAvailable ? (
                                                                        <Play className="h-4 w-4 text-[var(--color-coreduca-blue)] fill-[var(--color-coreduca-blue)]" />
                                                                    ) : (
                                                                        <Lock className="h-3 w-3 text-muted-foreground" />
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-semibold text-xs">{missao.titulo}</p>
                                                                    {missao.descricao && (
                                                                        <p className="text-[10px] text-muted-foreground truncate">{missao.descricao}</p>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="text-[10px] font-bold text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded-full">
                                                                        +{missao.xp_recompensa} XP
                                                                    </span>
                                                                    {isAvailable && (
                                                                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                                                                    )}
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    </Link>
                                                </motion.div>
                                            )
                                        })}

                                        {/* Cultural tip between missions */}
                                        {isDayActive && !isDayCompleted && (
                                            <div className="py-2">
                                                <CulturalTip texto={getRandomTip(dayIndex)} />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Celebration for completed day */}
                                {isDayCompleted && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="ml-[52px] mt-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3 border border-green-200"
                                    >
                                        <p className="text-xs font-bold text-green-700 flex items-center gap-1.5">
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            Dia {dayIndex + 1} completo! +{dayXp} XP
                                        </p>
                                    </motion.div>
                                )}
                            </motion.div>
                        )
                    })}
                </div>
            </div>
        </>
    )
}
