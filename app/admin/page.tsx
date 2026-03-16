'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, BookOpen, Mic, MessageCircle, TrendingUp, Zap } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Logo } from '@/components/ui/Logo'

export default function AdminDashboard() {
    const supabase = createBrowserClient()
    const [stats, setStats] = useState<Record<string, number>>({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchStats() {
            const [users, missoes, pronuncia, ia, xp, posts] = await Promise.all([
                supabase.from('profiles').select('id', { count: 'exact', head: true }),
                supabase.from('missao_attempts').select('id', { count: 'exact', head: true }).eq('status', 'concluida'),
                supabase.from('pronunciation_attempts').select('id', { count: 'exact', head: true }),
                supabase.from('ai_sessions').select('energia_usada'),
                supabase.from('profiles').select('xp_total'),
                supabase.from('community_posts').select('id', { count: 'exact', head: true }).eq('status', 'ativo'),
            ])

            const totalIa = (ia.data || []).reduce((s, r) => s + (r.energia_usada || 0), 0)
            const totalXp = (xp.data || []).reduce((s, r) => s + (r.xp_total || 0), 0)

            setStats({
                users: users.count ?? 0,
                missoes: missoes.count ?? 0,
                pronuncia: pronuncia.count ?? 0,
                ia: totalIa,
                xp: totalXp,
                posts: posts.count ?? 0,
            })
            setLoading(false)
        }
        fetchStats()
    }, [supabase])

    const statCards = [
        { label: 'Usuárias ativas', valor: stats.users, icon: Users, cor: 'bg-[var(--color-coreduca-blue)]/10 text-[var(--color-coreduca-blue)]' },
        { label: 'Missões concluídas', valor: stats.missoes, icon: BookOpen, cor: 'bg-[var(--color-coreduca-cyan)]/10 text-[var(--color-coreduca-cyan)]' },
        { label: 'Áudios analisados', valor: stats.pronuncia, icon: Mic, cor: 'bg-[var(--color-coreduca-red)]/10 text-[var(--color-coreduca-red)]' },
        { label: 'Conversas IA', valor: stats.ia, icon: MessageCircle, cor: 'bg-[var(--color-coreduca-purple)]/10 text-[var(--color-coreduca-purple)]' },
        { label: 'XP distribuído', valor: stats.xp, icon: Zap, cor: 'bg-[var(--color-coreduca-yellow)]/10 text-[var(--color-coreduca-yellow)]' },
        { label: 'Posts comunidade', valor: stats.posts, icon: TrendingUp, cor: 'bg-green-100 text-green-600' },
    ]

    if (loading) {
        return (
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <Logo className="h-6 hidden md:flex" />
                    <h1 className="text-2xl font-extrabold">Dashboard Admin</h1>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="h-24 rounded-xl" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <Logo className="h-6 hidden md:flex" />
                <h1 className="text-2xl font-extrabold">Dashboard Admin</h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {statCards.map((stat, i) => {
                    const Icon = stat.icon
                    return (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <Card className="border-0 shadow-sm border-l-4" style={{ borderLeftColor: stat.cor.split(' ')[1].replace('text-', '') }}>
                                <CardContent className="p-5 flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl ${stat.cor} flex items-center justify-center`}>
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-extrabold">{stat.valor ?? 0}</p>
                                        <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}
