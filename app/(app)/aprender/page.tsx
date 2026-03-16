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
import { useUISound } from '@/hooks/useUISound'
import Link from 'next/link'
import type { Trilha } from '@/types/database'
import { Button } from '@/components/ui/button'
import { countUnlockedTrails, isTrailUnlocked } from '@/lib/learning'

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
    const { play } = useUISound()

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
    const unlockedCount = countUnlockedTrails(trilhas, progressMap)

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
                <motion.div initial={{ opacity: 0, y: 14, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', bounce: 0.4, duration: 0.8 }}>
                    <Card className="relative overflow-hidden border border-white/10 bg-[linear-gradient(135deg,#132034_0%,#195cff_100%)] text-white shadow-[0_24px_60px_rgba(19,32,52,0.25)]">
                        {/* Subtle Floating Hangul Background */}
                        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none select-none overflow-hidden">
                            <motion.span animate={{ y: [0, -10, 0], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }} className="absolute -top-4 -left-4 text-8xl font-black">한</motion.span>
                            <motion.span animate={{ y: [0, 15, 0], opacity: [0.3, 0.8, 0.3] }} transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut', delay: 2 }} className="absolute top-12 right-12 text-6xl font-black">국</motion.span>
                            <motion.span animate={{ y: [0, -5, 0], opacity: [0.4, 0.9, 0.4] }} transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut', delay: 1 }} className="absolute bottom-4 left-1/3 text-7xl font-black">어</motion.span>
                        </div>
                        
                        <CardContent className="relative z-10 space-y-5 p-6">
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-2">
                                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/70">Jornada de hoje</p>
                                    <h2 className="max-w-xs text-2xl font-black leading-tight drop-shadow-sm">
                                        Continue sua trilha e mantenha o ritmo do coreano.
                                    </h2>
                                    <p className="max-w-sm text-sm leading-relaxed text-white/80">
                                        Missoes curtas, revisao dos erros e progresso visivel em cada etapa da area Aprender.
                                    </p>
                                </div>
                                <div className="rounded-[1.75rem] border border-white/20 bg-white/10 px-4 py-3 text-center backdrop-blur-md shadow-inner">
                                    <p className="text-3xl font-black drop-shadow-md">{overallProgress}%</p>
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-white/75 font-semibold">progresso</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <motion.div whileHover={{ scale: 1.05 }} className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm transition-colors hover:bg-white/10">
                                    <motion.div animate={{ y: [-1.5, 1.5, -1.5] }} transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}>
                                        <Target className="mb-2 h-4 w-4 text-white/90 drop-shadow-sm" />
                                    </motion.div>
                                    <p className="text-lg font-black">{totalConcluidas}</p>
                                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/70 font-medium">missoes</p>
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.05 }} className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm transition-colors hover:bg-white/10">
                                    <motion.div animate={{ y: [-1.5, 1.5, -1.5] }} transition={{ repeat: Infinity, duration: 2.2, delay: 0.3, ease: 'easeInOut' }}>
                                        <Sparkles className="mb-2 h-4 w-4 text-white/90 drop-shadow-sm" />
                                    </motion.div>
                                    <p className="text-lg font-black">{unlockedCount}</p>
                                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/70 font-medium">trilhas livres</p>
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.05 }} className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm transition-colors hover:bg-white/10">
                                    <motion.div animate={{ y: [-1.5, 1.5, -1.5] }} transition={{ repeat: Infinity, duration: 2.8, delay: 0.6, ease: 'easeInOut' }}>
                                        <Flame className="mb-2 h-4 w-4 text-white/90 drop-shadow-sm" />
                                    </motion.div>
                                    <p className="text-lg font-black">{revisaoCount}</p>
                                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/70 font-medium">para revisar</p>
                                </motion.div>
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
                    <Link href="/aprender/revisao" className="block outline-none" onClick={() => play('click')} onMouseEnter={() => play('hover')}>
                        <motion.div
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                            animate={{ boxShadow: ['0px 0px 0px rgba(0,0,0,0)', '0px 0px 20px rgba(251,191,36,0.3)', '0px 0px 0px rgba(0,0,0,0)'] }}
                            className="rounded-xl overflow-hidden shadow-md"
                        >
                            <Card className="border border-amber-200/50 bg-[linear-gradient(135deg,rgba(255,245,214,1),rgba(255,230,166,0.85))] transition-colors">
                                <CardContent className="p-5 flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-white/80 shadow-sm border border-white/50">
                                        <RotateCcw className="h-6 w-6 text-amber-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-extrabold text-sm text-amber-900">Revisao Diaria</p>
                                        <p className="text-xs text-amber-900/80 font-medium mt-0.5">
                                            {revisaoCount} {revisaoCount === 1 ? 'questao' : 'questoes'} te esperando
                                        </p>
                                    </div>
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/50 text-amber-700 backdrop-blur-sm">
                                        <ChevronRight className="h-5 w-5 ml-0.5" />
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
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
                    const isLocked = !isTrailUnlocked(trilhas, progressMap, index)
                    const progresso = progress?.percentual ?? 0
                    const concluidas = progress?.missoes_concluidas ?? 0
                    const total = progress?.total_missoes ?? 5

                    return (
                        <motion.div
                            key={trilha.id}
                            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } }}
                        >
                            <Link 
                                href={isLocked ? '/aprender' : `/aprender/${trilha.id}`} 
                                className={`block outline-none ${isLocked ? 'cursor-default' : ''}`}
                                onClick={() => !isLocked && play('pop')}
                                onMouseEnter={() => !isLocked && play('hover')}
                            >
                                <motion.div
                                    whileHover={!isLocked ? { scale: 1.02, y: -2 } : {}}
                                    whileTap={!isLocked ? { scale: 0.98 } : {}}
                                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                    className={`rounded-xl overflow-hidden shadow-sm border border-slate-200/60 bg-white transition-all ${isLocked ? 'opacity-50 saturate-50' : 'hover:shadow-md hover:border-slate-300'}`}
                                >
                                    <Card className="border-0 shadow-none bg-transparent">
                                        <CardContent className="p-4 flex items-center gap-4">
                                            <div
                                                className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                                                style={{ backgroundColor: `${trilha.cor}${isLocked ? '10' : '15'}` }}
                                            >
                                                {isLocked ? (
                                                    <Lock className="h-5 w-5 text-slate-400" />
                                                ) : (
                                                    <span className="text-2xl drop-shadow-sm">{trilha.icone}</span>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className={`font-bold text-sm ${isLocked ? 'text-slate-500' : 'text-slate-900'}`}>{trilha.titulo}</p>
                                                    {progresso === 100 && (
                                                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                                    )}
                                                </div>
                                                <div className="mt-1 flex items-center gap-2">
                                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${isLocked ? 'bg-slate-100 text-slate-400' : progresso === 100 ? 'bg-green-100 text-green-700' : concluidas > 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>
                                                        {progresso === 100 ? 'Concluida' : isLocked ? 'Bloqueada' : concluidas > 0 ? 'Em andamento' : 'Pronta para iniciar'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 mt-1.5 opacity-90">
                                                    <Progress value={progresso} className="h-1.5 flex-1" />
                                                    <span className="text-[10px] text-slate-500 font-bold whitespace-nowrap">
                                                        {concluidas}/{total}
                                                    </span>
                                                </div>
                                            </div>

                                            {!isLocked && (
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                                                    <ChevronRight className="h-5 w-5 ml-0.5" />
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            </Link>
                        </motion.div>
                    )
                })}
            </motion.div>
        </>
    )
}
