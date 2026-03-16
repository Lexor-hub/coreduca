'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Lock, CheckCircle2, ChevronRight, BookOpen, RotateCcw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { TopBar } from '@/components/layout/TopBar'
import { useAuth } from '@/lib/auth-context'
import { createBrowserClient } from '@/lib/supabase/client'
import { contarRevisaoPendente } from '@/hooks/useRevisao'
import Link from 'next/link'
import type { Trilha } from '@/types/database'

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
    }, [supabase, user, authLoading])

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
                    <p className="text-red-500 text-sm">{error}</p>
                </div>
            </>
        )
    }

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
                        <Card className="border-0 shadow-md bg-amber-50 hover:shadow-lg cursor-pointer transition-all">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-amber-100 shadow-sm">
                                    <RotateCcw className="h-6 w-6 text-amber-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm">Revisao Diaria</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {revisaoCount} {revisaoCount === 1 ? 'questao' : 'questoes'} para revisar
                                    </p>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
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
                                <Card className={`border-0 shadow-md transition-all ${isLocked ? 'opacity-50' : 'hover:shadow-lg cursor-pointer'}`}>
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
