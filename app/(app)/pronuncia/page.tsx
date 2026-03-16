'use client'

import { useEffect, useState } from 'react'
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
    const supabase = createBrowserClient()
    const [items, setItems] = useState<PronunciationListItem[]>([])
    const [scores, setScores] = useState<Record<string, BestScore>>({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            const { data: itemsData } = await supabase
                .from('pronunciation_items')
                .select('id, frase_coreano, transliteracao, traducao, dificuldade')
                .eq('ativo', true)
                .order('created_at')

            if (itemsData) setItems(itemsData)

            if (user) {
                const { data: scoresData } = await supabase
                    .from('pronunciation_best_scores')
                    .select('item_id, melhor_score, total_tentativas')
                    .eq('user_id', user.id)

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

            setLoading(false)
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

                {items.map((item) => {
                    const best = scores[item.id]

                    return (
                        <motion.div
                            key={item.id}
                            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                        >
                            <Link href={`/pronuncia/pratica/${item.id}`}>
                                <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer">
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-[var(--color-coreduca-red)]/10 flex items-center justify-center flex-shrink-0">
                                            <Mic className="h-5 w-5 text-[var(--color-coreduca-red)]" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-base">{item.frase_coreano}</p>
                                            <p className="text-xs text-muted-foreground">{item.transliteracao} — {item.traducao}</p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {best ? (
                                                <Badge className={`${getScoreColor(best.melhor_score)} border-0 text-xs font-bold`}>
                                                    {best.melhor_score}%
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="text-xs">Novo</Badge>
                                            )}
                                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                        </div>
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
