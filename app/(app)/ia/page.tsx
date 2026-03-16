'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Zap, Lock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { TopBar } from '@/components/layout/TopBar'
import { useAuth } from '@/lib/auth-context'
import { createBrowserClient } from '@/lib/supabase/client'
import Link from 'next/link'
import type { AIPersona } from '@/types/database'
import { isPremium as checkPremium, planoLabel } from '@/lib/coreduca'

type Persona = Pick<AIPersona, 'id' | 'slug' | 'nome' | 'descricao' | 'foco' | 'cor_tema' | 'energia_maxima_free' | 'energia_maxima_premium'>

const emojiMap: Record<string, string> = {
    soo: '👩‍🏫',
    jiwoo: '👩‍🦰',
    hana: '💃',
}

const gradientMap: Record<string, string> = {
    soo: 'from-blue-400 to-blue-600',
    jiwoo: 'from-pink-400 to-rose-600',
    hana: 'from-purple-400 to-purple-600',
}

export default function IAPage() {
    const { user, profile } = useAuth()
    const supabase = createBrowserClient()
    const [personas, setPersonas] = useState<Persona[]>([])
    const [energyMap, setEnergyMap] = useState<Record<string, number>>({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            const { data: personasData } = await supabase
                .from('ai_personas')
                .select('id, slug, nome, descricao, foco, cor_tema, energia_maxima_free, energia_maxima_premium')
                .eq('ativo', true)
                .order('ordem')

            if (personasData) setPersonas(personasData)

            if (user) {
                const today = new Date().toISOString().split('T')[0]
                const { data: sessions } = await supabase
                    .from('ai_sessions')
                    .select('persona_id, energia_usada')
                    .eq('user_id', user.id)
                    .eq('data', today)

                if (sessions) {
                    const map: Record<string, number> = {}
                    ;(sessions as Array<{ persona_id: string; energia_usada: number }>).forEach((session) => {
                        map[session.persona_id] = session.energia_usada
                    })
                    setEnergyMap(map)
                }
            }

            setLoading(false)
        }
        fetchData()
    }, [supabase, user])

    if (loading) {
        return (
            <>
                <TopBar title="Praticar com IA" />
                <div className="px-4 py-5 space-y-4">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
                </div>
            </>
        )
    }

    const isPremium = checkPremium(profile?.plano)

    return (
        <>
            <TopBar title="Praticar com IA" />

            <div className="px-4 py-5">
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-muted-foreground mb-5">
                    Escolha uma persona e pratique coreano em uma conversa natural 💬
                </motion.p>

                <div className="space-y-4">
                    {personas.map((persona, i) => {
                        const maxEnergy = isPremium ? persona.energia_maxima_premium : persona.energia_maxima_free
                        const usedEnergy = energyMap[persona.id] ?? 0
                        const depleted = usedEnergy >= maxEnergy
                        const gradient = gradientMap[persona.slug] || 'from-blue-400 to-blue-600'
                        const emoji = emojiMap[persona.slug] || '🤖'

                        return (
                            <motion.div
                                key={persona.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.15 }}
                            >
                                <Link href={depleted ? '#' : `/ia/${persona.slug}`}>
                                    <Card className={`border-0 shadow-md overflow-hidden transition-all ${depleted ? 'opacity-60' : 'hover:shadow-lg cursor-pointer'}`}>
                                        <CardContent className="p-5">
                                            <div className="flex items-start gap-4">
                                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md flex-shrink-0`}>
                                                    <span className="text-3xl">{emoji}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-extrabold text-lg">{persona.nome}</h3>
                                                        {depleted && (
                                                            <Badge variant="secondary" className="text-[10px]">
                                                                <Lock className="h-3 w-3 mr-0.5" /> Esgotada
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{persona.descricao}</p>
                                                    <Badge variant="secondary" className="mt-2 text-[10px] font-semibold">
                                                        {persona.foco}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="mt-4 flex items-center gap-2">
                                                <Zap className="h-4 w-4 text-[var(--color-coreduca-yellow)]" />
                                                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-[var(--color-coreduca-yellow)] to-[var(--color-coreduca-red)] rounded-full transition-all"
                                                        style={{ width: `${(usedEnergy / maxEnergy) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-semibold text-muted-foreground">
                                                    {usedEnergy}/{maxEnergy}
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            </motion.div>
                        )
                    })}
                </div>

                {!isPremium && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                        <Card className="border-0 shadow-lg mt-6 bg-gradient-to-r from-[var(--color-coreduca-blue)] to-[var(--color-coreduca-purple)] text-white">
                            <CardContent className="p-5 text-center">
                                <p className="text-2xl mb-2">⚡</p>
                                <h3 className="font-extrabold text-lg">Quer mais conversas?</h3>
                                <p className="text-sm text-white/80 mt-1">Premium: 30 mensagens/dia por persona</p>
                                <button className="mt-3 bg-white text-[var(--color-coreduca-blue)] font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-white/90 transition-colors">
                                    Conhecer Premium
                                </button>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </div>
        </>
    )
}
