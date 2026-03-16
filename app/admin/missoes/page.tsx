'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, BookOpen, ChevronRight, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createBrowserClient } from '@/lib/supabase/client'
import { Logo } from '@/components/ui/Logo'
import { ContentManager } from '@/components/admin/ContentManager'

type Trilha = {
    id: string
    titulo: string
    descricao: string | null
    ordem: number
    icone: string | null
    cor: string | null
    ativo: boolean
    _count?: { missoes: number }
}

export default function AdminMissoesPage() {
    const supabase = useMemo(() => createBrowserClient(), [])
    const [trilhas, setTrilhas] = useState<Trilha[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [view, setView] = useState<'list' | 'manager'>('list')
    const [selectedTrilhaId, setSelectedTrilhaId] = useState<string | null>(null)

    const fetchTrilhas = useCallback(async () => {
        const { data: trilhasData, error: trilhasError } = await supabase
            .from('trilhas')
            .select('id, titulo, descricao, ordem, icone, cor, ativo')
            .order('ordem')

        if (trilhasError) {
            throw trilhasError
        }

        if (trilhasData) {
            const counts = await Promise.all(
                trilhasData.map(async (trilha) => {
                    const { count, error: countError } = await supabase
                        .from('missoes')
                        .select('id', { count: 'exact', head: true })
                        .eq('trilha_id', trilha.id)

                    if (countError) {
                        throw countError
                    }

                    return [trilha.id, count ?? 0] as const
                })
            )

            const countMap = Object.fromEntries(counts)

            const formatted = trilhasData.map((t) => ({
                ...t,
                _count: { missoes: countMap[t.id] ?? 0 }
            }))

            return formatted
        }

        return []
    }, [supabase])

    useEffect(() => {
        let active = true

        async function loadTrilhas() {
            setLoading(true)
            setError(null)

            try {
                const loadedTrilhas = await fetchTrilhas()
                if (!active) return
                setTrilhas(loadedTrilhas)
            } catch (loadError) {
                console.error('Erro ao carregar trilhas no admin', loadError)
                if (!active) return
                setTrilhas([])
                setError('Nao foi possivel carregar as trilhas agora.')
            } finally {
                if (active) {
                    setLoading(false)
                }
            }
        }

        void loadTrilhas()

        return () => {
            active = false
        }
    }, [fetchTrilhas, view])

    if (view === 'manager') {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <Button variant="ghost" onClick={() => setView('list')} className="gap-2 -ml-4">
                        <ArrowLeft className="h-4 w-4" /> Voltar para lista
                    </Button>
                </div>
                {/* Content Manager works either starting from a Trilha or blank */}
                <ContentManager
                    initialTrilhaId={selectedTrilhaId}
                    onSaved={() => {
                        void (async () => {
                            setLoading(true)
                            setError(null)

                            try {
                                const loadedTrilhas = await fetchTrilhas()
                                setTrilhas(loadedTrilhas)
                            } catch (loadError) {
                                console.error('Erro ao recarregar trilhas no admin', loadError)
                                setError('A trilha foi salva, mas a lista nao atualizou. Recarregue a pagina se necessario.')
                            } finally {
                                setLoading(false)
                            }
                        })()
                    }}
                />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <Logo className="h-6 hidden md:flex" />
                    <div>
                        <h1 className="text-2xl font-extrabold flex items-center gap-2">
                            <BookOpen className="h-6 w-6 text-[var(--color-coreduca-blue)]" />
                            Gestor de Trilhas & Quizzes
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">Gerencie o conteúdo interativo do app Coreduca.</p>
                    </div>
                </div>
                <Button
                    onClick={() => { setSelectedTrilhaId(null); setView('manager') }}
                    className="bg-[var(--color-coreduca-blue)] text-white hover:bg-[var(--color-coreduca-blue)]/90"
                >
                    <Plus className="h-4 w-4 mr-2" /> Nova Trilha
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {error && (
                    <div className="col-span-full rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        {error}
                    </div>
                )}
                {loading ? (
                    [1, 2, 3].map(i => (
                        <Card key={i} className="animate-pulse shadow-sm">
                            <CardContent className="h-32 bg-muted/50" />
                        </Card>
                    ))
                ) : trilhas.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground bg-white rounded-xl border border-dashed border-border/60">
                        Nenhuma trilha cadastrada ainda. Clique em &quot;Nova Trilha&quot; para começar.
                    </div>
                ) : (
                    trilhas.map((trilha, i) => (
                        <motion.div
                            key={trilha.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Card className={`border-l-4 shadow-sm hover:shadow-md transition-all cursor-pointer ${!trilha.ativo ? 'opacity-60 grayscale' : ''}`}
                                style={{ borderLeftColor: trilha.cor || 'var(--color-coreduca-blue)' }}
                                onClick={() => { setSelectedTrilhaId(trilha.id); setView('manager') }}
                            >
                                <CardHeader className="p-4 pb-2">
                                    <div className="flex justify-between items-start">
                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shadow-sm" style={{ backgroundColor: `${trilha.cor}20` }}>
                                            {trilha.icone}
                                        </div>
                                        <Badge variant={trilha.ativo ? "default" : "secondary"} className={trilha.ativo ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}>
                                            {trilha.ativo ? 'Ativo' : 'Inativo'}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-lg mt-3">{trilha.titulo}</CardTitle>
                                    <CardDescription className="line-clamp-2 text-xs">{trilha.descricao}</CardDescription>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-border/50">
                                        <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                            <Badge variant="outline" className="font-bold">{trilha._count?.missoes || 0}</Badge> Missões
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    )
}
