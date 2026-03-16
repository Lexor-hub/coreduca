'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Lock, CheckCircle2, ChevronRight, BookOpen, RotateCcw, Sparkles, Target, Flame } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { TopBar } from '@/components/layout/TopBar'
import { useAuth } from '@/lib/auth-context'
import { createBrowserClient } from '@/lib/supabase/client'
import { contarRevisaoPendente } from '@/hooks/useRevisao'
import Link from 'next/link'
import type { Trilha } from '@/types/database'
import { Button } from '@/components/ui/button'

type UserProgress = {
    trilha_id: string
    missoes_concluidas: number
    total_missoes: number
    percentual: number
}

export default function AprenderPage() {
    const { user, loading: authLoading } = useAuth()
    const supabase = useMemo(() => createBrowserClient(), [])
    const [trilhas, setTrilhas] = useState<Trilha[]>([])
    const [progressMap, setProgressMap] = useState<Record<string, UserProgress>>({})
    const [loadingData, setLoadingData] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [warning, setWarning] = useState<string | null>(null)
    const [revisaoCount, setRevisaoCount] = useState(0)
    const [reloadKey, setReloadKey] = useState(0)

    useEffect(() => {
        if (authLoading) return // Wait for auth to resolve
        if (!user) {
            setLoadingData(false)
            return
        }

        const currentUserId = user.id

        async function fetchData() {
            try {
                setLoadingData(true)
                setError(null)
                setWarning(null)

                // Fetch trilhas
                const { data: trilhasData, error: trilhasError } = await supabase
                    .from('trilhas')
                    .select('*')
                    .eq('ativo', true)
                    .order('ordem')

                if (trilhasError) {
                    setError(`Erro ao carregar trilhas: ${trilhasError.message}`)
                    setTrilhas([])
                    setProgressMap({})
                    return
                }

                if (trilhasData) {
                    setTrilhas(trilhasData)
                }

                // Fetch user progress
                const { data: progressData, error: progressError } = await supabase
                    .from('user_progress')
                    .select('*')
                    .eq('user_id', currentUserId)

                if (progressError) {
                    setProgressMap({})
                    setWarning('As trilhas foram carregadas, mas seu progresso ainda nao pode ser exibido.')
                } else if (progressData) {
                    const map: Record<string, UserProgress> = {}
                    progressData.forEach((progressItem) => { map[progressItem.trilha_id] = progressItem })
                    setProgressMap(map)
                } else {
                    setProgressMap({})
                }

                // Count pending review questions
                const count = await contarRevisaoPendente(currentUserId, supabase)
                setRevisaoCount(count)
            } catch (err) {
                console.error('Unexpected error in fetchData:', err)
                setError('Erro inesperado ao carregar dados')
            } finally {
                setLoadingData(false)
            }
        }
        fetchData()
    }, [supabase, user, authLoading, reloadKey])

    const isLoading = authLoading || loadingData

    if (isLoading) {
        return (
            <>
                <TopBar title="Aprender" />
                <div className="px-4 py-5 space-y-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="h-20 rounded-xl" />
                    ))}
                </div>
            </>
        )
    }

    if (!user && !authLoading) {
        return (
            <>
                <TopBar title="Aprender" />
                <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Faca login para acessar as trilhas de aprendizado.</p>
                </div>
            </>
        )
    }

    if (error) {
        return (
            <>
                <TopBar title="Aprender" />
                <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
                    <Card className="max-w-md border-0 shadow-md">
                        <CardContent className="space-y-4 p-6">
                            <p className="text-sm text-red-500">{error}</p>
                            <Button onClick={() => setReloadKey((current) => current + 1)} className="rounded-full">
                                Tentar novamente
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </>
        )
    }

    const totalMissoes = Object.values(progressMap).reduce((sum, current) => sum + current.total_missoes, 0)
    const totalConcluidas = Object.values(progressMap).reduce((sum, current) => sum + current.missoes_concluidas, 0)
    const overallProgress = totalMissoes > 0 ? Math.round((totalConcluidas / totalMissoes) * 100) : 0
    const unlockedCount = trilhas.reduce((sum, trilha, index) => {
        if (index === 0 || progressMap[trilhas[index - 1]?.id]) {
            return sum + 1
        }

        return sum
    }, 0)

    return (
        <>
            <TopBar title="Aprender" />

            {warning && (
                <div className="px-4 pt-5">
                    <Card className="border border-amber-200 bg-amber-50 shadow-sm">
                        <CardContent className="p-4 text-sm text-amber-800">
                            {warning}
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="px-4 pt-5">
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#132034_0%,#195cff_100%)] text-white shadow-[0_24px_60px_rgba(19,32,52,0.18)]">
                        <CardContent className="space-y-5 p-6">
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-2">
                                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/70">Jornada de hoje</p>
                                    <h2 className="max-w-xs text-2xl font-black leading-tight">
                                        Continue sua trilha e mantenha o ritmo do coreano.
                                    </h2>
                                    <p className="max-w-sm text-sm leading-relaxed text-white/75">
                                        Missoes curtas, revisao dos erros e progresso visivel em cada etapa da area Aprender.
                                    </p>
                                </div>
                                <div className="rounded-[1.75rem] bg-white/12 px-4 py-3 text-center backdrop-blur">
                                    <p className="text-3xl font-black">{overallProgress}%</p>
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-white/65">progresso</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
                                    <Target className="mb-2 h-4 w-4 text-white/80" />
                                    <p className="text-lg font-black">{totalConcluidas}</p>
                                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/65">missoes</p>
                                </div>
                                <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
                                    <Sparkles className="mb-2 h-4 w-4 text-white/80" />
                                    <p className="text-lg font-black">{unlockedCount}</p>
                                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/65">trilhas livres</p>
                                </div>
                                <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
                                    <Flame className="mb-2 h-4 w-4 text-white/80" />
                                    <p className="text-lg font-black">{revisaoCount}</p>
                                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/65">para revisar</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {trilhas.length === 0 && !loadingData && (
                <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhuma trilha disponivel no momento.</p>
                    <p className="text-xs text-muted-foreground mt-2">Verifique se o seed foi executado no Supabase.</p>
                </div>
            )}

            {revisaoCount > 0 && (
                <div className="px-4 pt-5">
                    <Link href="/aprender/revisao">
                        <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,rgba(255,245,214,1),rgba(255,230,166,0.82))] shadow-md transition-all hover:-translate-y-0.5 hover:shadow-xl cursor-pointer">
                            <CardContent className="p-5 flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-white/70 shadow-sm">
                                    <RotateCcw className="h-6 w-6 text-amber-700" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-sm text-amber-950">Revisao Diaria</p>
                                    <p className="text-xs text-amber-950/75 mt-0.5">
                                        {revisaoCount} {revisaoCount === 1 ? 'questao' : 'questoes'} para revisar
                                    </p>
                                </div>
                                <ChevronRight className="h-5 w-5 text-amber-900/60 flex-shrink-0" />
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            )}

            <motion.div
                className="px-4 py-5 space-y-3"
                initial="hidden"
                animate="show"
                variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
            >
                {trilhas.map((trilha, index) => {
                    const progress = progressMap[trilha.id]
                    const isLocked = index > 0 && !progressMap[trilhas[index - 1]?.id]
                    const progresso = progress?.percentual ?? 0
                    const concluidas = progress?.missoes_concluidas ?? 0
                    const total = progress?.total_missoes ?? 5

                    return (
                        <motion.div
                            key={trilha.id}
                            variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }}
                        >
                            <Link href={isLocked ? '#' : `/aprender/${trilha.id}`}>
                                <Card className={`overflow-hidden border-0 shadow-md transition-all ${isLocked ? 'opacity-50' : 'cursor-pointer hover:-translate-y-0.5 hover:shadow-xl'}`}>
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div
                                            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
                                            style={{ backgroundColor: `${trilha.cor}15` }}
                                        >
                                            {isLocked ? (
                                                <Lock className="h-6 w-6 text-muted-foreground" />
                                            ) : (
                                                <span className="text-2xl">{trilha.icone}</span>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-sm">{trilha.titulo}</p>
                                                {progresso === 100 && (
                                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                )}
                                            </div>
                                            <div className="mt-1 flex items-center gap-2">
                                                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                                    {progresso === 100 ? 'Concluida' : isLocked ? 'Bloqueada' : concluidas > 0 ? 'Em andamento' : 'Pronta para iniciar'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Progress value={progresso} className="h-1.5 flex-1" />
                                                <span className="text-[10px] text-muted-foreground font-semibold whitespace-nowrap">
                                                    {concluidas}/{total}
                                                </span>
                                            </div>
                                        </div>

                                        {!isLocked && (
                                            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                        )}
                                    </CardContent>
                                </Card>
                            </Link>
                        </motion.div>
                    )
                })}
            </motion.div>
        </>
    )
}
