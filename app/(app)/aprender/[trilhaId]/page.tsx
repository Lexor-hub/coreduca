'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Play, ChevronRight, CheckCircle2, Lock, Sparkles, RotateCcw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { TopBar } from '@/components/layout/TopBar'
import { useAuth } from '@/lib/auth-context'
import { createBrowserClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { use } from 'react'
import type { Missao, Trilha } from '@/types/database'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { getTrailLockState } from '@/lib/learning'

type AttemptRow = { missao_id: string }
type TrilhaResumo = Pick<Trilha, 'id' | 'titulo' | 'icone' | 'descricao'>
type MissaoResumo = Pick<Missao, 'id' | 'titulo' | 'descricao' | 'ordem' | 'xp_recompensa'>
type TrilhaOrdem = Pick<Trilha, 'id'>
type UserProgressRow = { trilha_id: string; percentual: number }

export default function TrilhaDetailPage({ params }: { params: Promise<{ trilhaId: string }> }) {
    const { trilhaId } = use(params)
    const { user } = useAuth()
    const supabase = createBrowserClient()
    const [trilha, setTrilha] = useState<TrilhaResumo | null>(null)
    const [missoes, setMissoes] = useState<MissaoResumo[]>([])
    const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [reloadKey, setReloadKey] = useState(0)
    const [isLocked, setIsLocked] = useState(false)

    useEffect(() => {
        let cancelled = false

        async function fetchData() {
            try {
                setLoading(true)
                setError(null)

                const { data: trilhaData, error: trilhaError } = await supabase
                    .from('trilhas')
                    .select('id, titulo, icone, descricao')
                    .eq('id', trilhaId)
                    .single()

                if (trilhaError) {
                    throw trilhaError
                }

                const [
                    { data: orderedTrailsData, error: orderedTrailsError },
                    { data: missoesData, error: missoesError },
                ] = await Promise.all([
                    supabase
                        .from('trilhas')
                        .select('id')
                        .eq('ativo', true)
                        .order('ordem'),
                    supabase
                        .from('missoes')
                        .select('id, titulo, descricao, ordem, xp_recompensa')
                        .eq('trilha_id', trilhaId)
                        .eq('ativo', true)
                        .order('ordem'),
                ])

                if (orderedTrailsError || missoesError) {
                    throw orderedTrailsError || missoesError
                }

                if (user) {
                    const [{ data: attempts }, { data: progressData }] = await Promise.all([
                        supabase
                            .from('missao_attempts')
                            .select('missao_id')
                            .eq('user_id', user.id)
                            .eq('status', 'concluida'),
                        supabase
                            .from('user_progress')
                            .select('trilha_id, percentual')
                            .eq('user_id', user.id),
                    ])

                    if (!cancelled) {
                        const progressMap = Object.fromEntries(
                            ((progressData as UserProgressRow[]) ?? []).map((progress) => [progress.trilha_id, progress])
                        )
                        const lockState = getTrailLockState((orderedTrailsData as TrilhaOrdem[]) ?? [], progressMap, trilhaId)

                        setTrilha(trilhaData)
                        setMissoes(missoesData ?? [])
                        setCompletedIds(new Set(((attempts as AttemptRow[]) ?? []).map((attempt) => attempt.missao_id)))
                        setIsLocked(lockState.isLocked)
                    }
                } else if (!cancelled) {
                    setTrilha(trilhaData)
                    setMissoes(missoesData ?? [])
                    setCompletedIds(new Set())
                    setIsLocked(false)
                }
            } catch (error) {
                console.error('Erro ao carregar trilha', error)
                if (!cancelled) {
                    setTrilha(null)
                    setMissoes([])
                    setCompletedIds(new Set())
                    setIsLocked(false)
                    setError('Nao foi possivel carregar esta trilha agora.')
                }
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }
        void fetchData()

        return () => {
            cancelled = true
        }
    }, [supabase, user, trilhaId, reloadKey])

    if (loading) {
        return (
            <>
                <TopBar title="Carregando..." showBack />
                <div className="px-4 py-5 space-y-3">
                    <Skeleton className="h-20 w-full rounded-xl mx-auto" />
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-16 rounded-xl" />
                    ))}
                </div>
            </>
        )
    }

    if (error) {
        return (
            <>
                <TopBar title="Trilha" showBack backHref="/aprender" />
                <div className="px-4 py-10">
                    <Card className="mx-auto max-w-lg border-0 shadow-md">
                        <CardContent className="space-y-4 p-6 text-center">
                            <p className="text-sm text-red-500">{error}</p>
                            <Button onClick={() => setReloadKey((current) => current + 1)} className="rounded-full">
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Tentar novamente
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </>
        )
    }

    const completedCount = missoes.filter((m) => completedIds.has(m.id)).length
    const progresso = missoes.length > 0 ? Math.round((completedCount / missoes.length) * 100) : 0
    const nextMission = missoes.find((missao, index) => {
        const isCompleted = completedIds.has(missao.id)
        const isAvailable = index === 0 || completedIds.has(missoes[index - 1]?.id)
        return !isCompleted && isAvailable
    })

    return (
        <>
            <TopBar title={trilha?.titulo || 'Trilha'} showBack backHref="/aprender" />

            <div className="px-4 py-5">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                    <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#132034_0%,rgba(25,92,255,0.95)_100%)] text-white shadow-[0_24px_60px_rgba(19,32,52,0.18)]">
                        <CardContent className="space-y-5 p-6">
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-2">
                                    <span className="text-5xl">{trilha?.icone}</span>
                                    <h2 className="text-2xl font-extrabold">{trilha?.titulo}</h2>
                                    <p className="max-w-md text-sm text-white/75">{trilha?.descricao}</p>
                                </div>
                                <div className="rounded-[1.75rem] bg-white/12 px-4 py-3 text-center backdrop-blur">
                                    <p className="text-3xl font-black">{progresso}%</p>
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-white/65">progresso</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-white/80">
                                    <span>Missoes concluidas</span>
                                    <span>{completedCount}/{missoes.length}</span>
                                </div>
                                <Progress value={progresso} className="h-2 bg-white/15 [&>div]:bg-white" />
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Badge className="border-0 bg-white/12 text-white">
                                    {completedCount === missoes.length && missoes.length > 0 ? 'Trilha concluida' : 'Continue no seu ritmo'}
                                </Badge>
                                {nextMission && (
                                    <Badge className="border-0 bg-white/12 text-white">
                                        <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                                        Proxima: {nextMission.titulo}
                                    </Badge>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {isLocked && (
                    <Card className="mb-6 border-0 bg-amber-50 shadow-sm">
                        <CardContent className="space-y-4 p-5">
                            <div>
                                <p className="text-sm font-bold text-amber-950">Trilha bloqueada por progresso</p>
                                <p className="mt-1 text-sm text-amber-900/80">
                                    Finalize 100% da trilha anterior para liberar esta etapa.
                                </p>
                            </div>
                            <Button onClick={() => window.location.assign('/aprender')} className="rounded-full bg-amber-900 text-white hover:bg-amber-950">
                                Voltar para Aprender
                            </Button>
                        </CardContent>
                    </Card>
                )}

                <div className="space-y-3">
                    {!isLocked && missoes.map((missao, i) => {
                        const isCompleted = completedIds.has(missao.id)
                        const isAvailable = i === 0 || completedIds.has(missoes[i - 1]?.id)
                        const status = isCompleted ? 'concluida' : isAvailable ? 'disponivel' : 'bloqueada'

                        return (
                            <motion.div
                                key={missao.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <Link href={status === 'disponivel' ? `/aprender/missao/${missao.id}` : '#'}>
                                    <Card className={`border-0 shadow-sm transition-all ${status === 'bloqueada' ? 'opacity-50' : 'hover:-translate-y-0.5 hover:shadow-lg cursor-pointer'
                                        }`}>
                                        <CardContent className="p-4 flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${status === 'concluida' ? 'bg-green-100'
                                                    : status === 'disponivel' ? 'bg-[var(--color-coreduca-blue)]/10'
                                                        : 'bg-secondary'
                                                }`}>
                                                {status === 'concluida' ? (
                                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                                ) : status === 'disponivel' ? (
                                                    <Play className="h-5 w-5 text-[var(--color-coreduca-blue)] fill-[var(--color-coreduca-blue)]" />
                                                ) : (
                                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm">{missao.titulo}</p>
                                                <p className="text-xs text-muted-foreground">{missao.descricao}</p>
                                                <div className="mt-2">
                                                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                                        {status === 'concluida' ? 'Concluida' : status === 'disponivel' ? 'Disponivel agora' : 'Bloqueada'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className="text-[10px] font-bold">
                                                    +{missao.xp_recompensa} XP
                                                </Badge>
                                                {status !== 'bloqueada' && (
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            </motion.div>
                        )
                    })}
                </div>
            </div>
        </>
    )
}
