'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Play, ChevronRight, CheckCircle2, Lock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { TopBar } from '@/components/layout/TopBar'
import { useAuth } from '@/lib/auth-context'
import { createBrowserClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { use } from 'react'
import type { Missao, Trilha } from '@/types/database'

type AttemptRow = { missao_id: string }
type TrilhaResumo = Pick<Trilha, 'id' | 'titulo' | 'icone' | 'descricao'>
type MissaoResumo = Pick<Missao, 'id' | 'titulo' | 'descricao' | 'ordem' | 'xp_recompensa'>

export default function TrilhaDetailPage({ params }: { params: Promise<{ trilhaId: string }> }) {
    const { trilhaId } = use(params)
    const { user } = useAuth()
    const supabase = createBrowserClient()
    const [trilha, setTrilha] = useState<TrilhaResumo | null>(null)
    const [missoes, setMissoes] = useState<MissaoResumo[]>([])
    const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            // Fetch trilha
            const { data: trilhaData } = await supabase
                .from('trilhas')
                .select('id, titulo, icone, descricao')
                .eq('id', trilhaId)
                .single()

            if (trilhaData) setTrilha(trilhaData)

            // Fetch missoes
            const { data: missoesData } = await supabase
                .from('missoes')
                .select('id, titulo, descricao, ordem, xp_recompensa')
                .eq('trilha_id', trilhaId)
                .eq('ativo', true)
                .order('ordem')

            if (missoesData) setMissoes(missoesData)

            // Fetch completed attempts
            if (user) {
                const { data: attempts } = await supabase
                    .from('missao_attempts')
                    .select('missao_id')
                    .eq('user_id', user.id)
                    .eq('status', 'concluida')

                if (attempts) {
                    setCompletedIds(new Set((attempts as AttemptRow[]).map((attempt) => attempt.missao_id)))
                }
            }

            setLoading(false)
        }
        fetchData()
    }, [supabase, user, trilhaId])

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

    const completedCount = missoes.filter((m) => completedIds.has(m.id)).length

    return (
        <>
            <TopBar title={trilha?.titulo || 'Trilha'} showBack />

            <div className="px-4 py-5">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
                    <span className="text-5xl">{trilha?.icone}</span>
                    <h2 className="text-xl font-extrabold mt-3">{trilha?.titulo}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{trilha?.descricao}</p>
                    <Badge className="mt-2 bg-[var(--color-coreduca-blue)]/10 text-[var(--color-coreduca-blue)] border-0">
                        {completedCount}/{missoes.length} missões concluídas
                    </Badge>
                </motion.div>

                <div className="space-y-3">
                    {missoes.map((missao, i) => {
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
                                    <Card className={`border-0 shadow-sm transition-all ${status === 'bloqueada' ? 'opacity-50' : 'hover:shadow-md cursor-pointer'
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
