'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Mic, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { TopBar } from '@/components/layout/TopBar'
import { useAuth } from '@/lib/auth-context'
import { createBrowserClient } from '@/lib/supabase/client'
import Link from 'next/link'
import type { PronunciationBestScore, PronunciationItem } from '@/types/database'

type BestScore = {
    item_id: string
    melhor_score: number
    total_tentativas: number
}

type PronunciationListItem = Pick<
    PronunciationItem,
    'id' | 'frase_coreano' | 'transliteracao' | 'traducao' | 'dificuldade'
>

function getScoreColor(score: number) {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
}

export default function PronunciaPage() {
    const { user } = useAuth()
    const supabase = useMemo(() => createBrowserClient(), [])
    const [items, setItems] = useState<PronunciationListItem[]>([])
    const [scores, setScores] = useState<Record<string, BestScore>>({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchData() {
            try {
                setError(null)

                const { data: itemsData, error: itemsError } = await supabase
                    .from('pronunciation_items')
                    .select('id, frase_coreano, transliteracao, traducao, dificuldade')
                    .eq('ativo', true)
                    .order('created_at')

                if (itemsError) {
                    throw itemsError
                }

                setItems(itemsData ?? [])

                if (user) {
                    const { data: scoresData, error: scoresError } = await supabase
                        .from('pronunciation_best_scores')
                        .select('item_id, melhor_score, total_tentativas')
                        .eq('user_id', user.id)

                    if (scoresError) {
                        throw scoresError
                    }

                    if (scoresData) {
                        const map: Record<string, BestScore> = {}
                        ;(scoresData as PronunciationBestScore[]).forEach((score) => {
                            map[score.item_id] = {
                                item_id: score.item_id,
                                melhor_score: score.melhor_score,
                                total_tentativas: score.total_tentativas,
                            }
                        })
                        setScores(map)
                    }
                }
            } catch (loadError) {
                console.error('pronuncia list load error', loadError)
                setItems([])
                setScores({})
                setError('Nao foi possivel carregar os exercicios de pronuncia agora.')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [supabase, user])

    if (loading) {
        return (
            <>
                <TopBar title="Pronúncia" />
                <div className="px-4 py-5 space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-20 rounded-xl" />
                    ))}
                </div>
            </>
        )
    }

    return (
        <>
            <TopBar title="Pronúncia" />

            <motion.div
                className="px-4 py-5 space-y-3"
                initial="hidden"
                animate="show"
                variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }}
            >
                <motion.p
                    variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                    className="text-sm text-muted-foreground mb-2"
                >
                    Ouça, repita e melhore sua pronúncia 🎤
                </motion.p>

                {error && (
                    <Card className="border border-amber-200 bg-amber-50 shadow-sm">
                        <CardContent className="p-4 text-sm text-amber-800">{error}</CardContent>
                    </Card>
                )}

                {items.length === 0 && (
                    <Card className="border-0 shadow-sm">
                        <CardContent className="p-6 text-center text-sm text-muted-foreground">
                            Nenhuma frase de pronuncia disponivel agora.
                        </CardContent>
                    </Card>
                )}

                {items.map((item) => {
                    const best = scores[item.id]

                    return (
                        <motion.div
                            key={item.id}
                            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                        >
                            <Link href={`/pronuncia/pratica/${item.id}`}>
                                <motion.div
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                    className="rounded-xl overflow-hidden shadow-sm border border-slate-200/60 bg-white hover:shadow-md hover:border-slate-300 transition-all"
                                >
                                    <Card className="border-0 shadow-none bg-transparent">
                                        <CardContent className="p-4 flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-[var(--color-coreduca-red)]/10 flex items-center justify-center flex-shrink-0">
                                                <Mic className="h-6 w-6 text-[var(--color-coreduca-red)]" />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-base text-slate-900">{item.traducao}</p>
                                                <p className="text-sm font-bold text-indigo-600 mt-0.5">{item.frase_coreano}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">{item.transliteracao}</p>
                                            </div>

                                            <div className="flex flex-col items-end gap-2">
                                                <div className="flex items-center gap-2">
                                                    {best ? (
                                                        <Badge className={`${getScoreColor(best.melhor_score)} border-0 text-[11px] font-bold px-2 py-0.5`}>
                                                            {best.melhor_score}%
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">Novo</Badge>
                                                    )}
                                                </div>
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                                                    <ChevronRight className="h-5 w-5 ml-0.5" />
                                                </div>
                                            </div>
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
