'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, CheckCircle2, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { TopBar } from '@/components/layout/TopBar'
import { useAuth } from '@/lib/auth-context'
import { createBrowserClient } from '@/lib/supabase/client'
import Link from 'next/link'
import type { Trilha } from '@/types/database'

type UserProgress = {
    trilha_id: string
    missoes_concluidas: number
    total_missoes: number
    percentual_conclusao: number
}

export default function AprenderPage() {
    const { user, loading: authLoading } = useAuth()
    const supabase = createBrowserClient()
    const [trilhas, setTrilhas] = useState<Trilha[]>([])
    const [progressMap, setProgressMap] = useState<Record<string, UserProgress>>({})
    const [loadingData, setLoadingData] = useState(true)

    useEffect(() => {
        if (authLoading) return // Wait for auth to resolve

        async function fetchData() {
            try {
                // Fetch trilhas
                const { data: trilhasData, error: trilhasError } = await supabase
                    .from('trilhas')
                    .select('*')
                    .eq('ativo', true)
                    .order('ordem')

                if (trilhasError) {
                    console.error('Error fetching trilhas:', trilhasError)
                } else if (trilhasData) {
                    setTrilhas(trilhasData)
                }

                // Fetch user progress
                if (user) {
                    const { data: progressData, error: progressError } = await supabase
                        .from('user_progress')
                        .select('*')
                        .eq('user_id', user.id)

                    if (progressError) {
                        console.error('Error fetching user progress:', progressError)
                    } else if (progressData) {
                        const map: Record<string, UserProgress> = {}
                        progressData.forEach((progressItem) => { map[progressItem.trilha_id] = progressItem })
                        setProgressMap(map)
                    }
                }
            } catch (err) {
                console.error('Unexpected error in fetchData:', err)
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

    return (
        <>
            <TopBar title="Aprender" />

            <motion.div
                className="px-4 py-5 space-y-3"
                initial="hidden"
                animate="show"
                variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
            >
                {trilhas.map((trilha, index) => {
                    const progress = progressMap[trilha.id]
                    const isLocked = index > 0 && !progressMap[trilhas[index - 1]?.id]
                    const progresso = progress?.percentual_conclusao ?? 0
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
