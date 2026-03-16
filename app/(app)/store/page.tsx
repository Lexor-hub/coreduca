'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { TopBar } from '@/components/layout/TopBar'
import { createBrowserClient } from '@/lib/supabase/client'

type StoreItem = {
    id: string
    titulo: string
    descricao: string | null
    tipo: string | null
    preco: number | null
    link_externo: string | null
    destaque: boolean
}

const emojiMap: Record<string, string> = {
    workshop: '🎓',
    kit: '🃏',
    produto: '📦',
    evento: '🎪',
    experiencia: '✨',
}

export default function StorePage() {
    const supabase = createBrowserClient()
    const [items, setItems] = useState<StoreItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            const { data } = await supabase
                .from('store_items')
                .select('id, titulo, descricao, tipo, preco, link_externo, destaque')
                .eq('ativo', true)
                .order('ordem')

            if (data) setItems(data)
            setLoading(false)
        }
        fetchData()
    }, [supabase])

    if (loading) {
        return (
            <>
                <TopBar title="Store" />
                <div className="px-4 py-5 space-y-4">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
                </div>
            </>
        )
    }

    return (
        <>
            <TopBar title="Store" />

            <div className="px-4 py-5 space-y-4">
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-muted-foreground">
                    Materiais exclusivos para turbinar seu aprendizado ✨
                </motion.p>

                {items.length === 0 ? (
                    <Card className="border-0 shadow-sm">
                        <CardContent className="p-8 text-center text-muted-foreground">
                            <p className="text-lg">🏪</p>
                            <p className="text-sm mt-2">Novos produtos chegando em breve!</p>
                        </CardContent>
                    </Card>
                ) : (
                    items.map((item, i) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <Card className={`border-0 shadow-md overflow-hidden ${item.destaque ? 'ring-2 ring-[var(--color-coreduca-blue)]/20' : ''}`}>
                                <CardContent className="p-5">
                                    <div className="flex items-start gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-coreduca-blue)]/10 to-[var(--color-coreduca-purple)]/10 flex items-center justify-center flex-shrink-0">
                                            <span className="text-2xl">{emojiMap[item.tipo ?? ''] || '📦'}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-sm">{item.titulo}</h3>
                                                {item.destaque && (
                                                    <Badge className="bg-[var(--color-coreduca-yellow)]/10 text-[var(--color-coreduca-yellow)] border-0 text-[10px]">
                                                        ⭐ Destaque
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">{item.descricao}</p>
                                            <div className="flex items-center justify-between mt-3">
                                                <span className="font-extrabold text-[var(--color-coreduca-blue)]">
                                                    R$ {Number(item.preco ?? 0).toFixed(2).replace('.', ',')}
                                                </span>
                                                {item.link_externo && (
                                                    <a href={item.link_externo} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-coreduca-blue)] hover:underline">
                                                        Ver mais <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))
                )}
            </div>
        </>
    )
}
