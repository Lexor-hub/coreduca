'use client'

import { motion } from 'framer-motion'
import { Trophy, Star, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface QuizResultadoProps {
    score: number
    xpGanho: number
    badgeNome?: string | null
    progressoResumo?: string | null
    onCompartilhar?: (() => void) | null
    onContinuar: () => void
}

export function QuizResultado({
    score,
    xpGanho,
    badgeNome,
    progressoResumo,
    onCompartilhar,
    onContinuar,
}: QuizResultadoProps) {
    const isPerfect = score === 100
    const headline = isPerfect ? 'Perfeito!' : score >= 70 ? 'Missao concluida' : 'Boa evolucao'
    const subheadline = isPerfect
        ? 'Voce acertou tudo e fechou a missao com dominio total.'
        : score >= 70
            ? 'Voce concluiu a missao e ja tem base para seguir para a proxima etapa.'
            : 'A missao foi concluida. Revise os pontos-chave e mantenha o ritmo.'

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex min-h-[70vh] items-center justify-center px-4 py-8"
        >
            <Card className="w-full max-w-lg overflow-hidden border-0 bg-[linear-gradient(135deg,#132034_0%,rgba(25,92,255,0.96)_100%)] text-white shadow-[0_28px_90px_rgba(19,32,52,0.24)]">
                <CardContent className="space-y-6 p-8 text-center">
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-white/12"
                    >
                        <Trophy className="h-12 w-12 text-[var(--color-coreduca-yellow)]" />
                    </motion.div>

                    <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/70">Missao finalizada</p>
                        <h2 className="text-3xl font-black">{headline}</h2>
                        <p className="mx-auto max-w-md text-sm leading-relaxed text-white/75">
                            {subheadline}
                        </p>
                    </div>

                    {badgeNome && (
                        <div className="rounded-full bg-white/12 px-4 py-2 text-sm font-bold text-white">
                            Badge desbloqueada: {badgeNome}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-3xl bg-white/10 p-4">
                            <span className="mb-1 block text-xs font-bold uppercase tracking-[0.18em] text-white/65">Score</span>
                            <span className="text-3xl font-black">{score}%</span>
                        </div>
                        <div className="rounded-3xl bg-white/10 p-4">
                            <span className="mb-1 block text-xs font-bold uppercase tracking-[0.18em] text-white/65">XP ganho</span>
                            <div className="flex items-center justify-center gap-1">
                                <Star className="h-5 w-5 fill-current text-[var(--color-coreduca-yellow)]" />
                                <span className="text-3xl font-black">+{xpGanho}</span>
                            </div>
                        </div>
                    </div>

                    {progressoResumo && (
                        <p className="text-sm font-medium text-white/75">
                            {progressoResumo}
                        </p>
                    )}

                    <div className="space-y-3">
                        {onCompartilhar && (
                            <Button
                                onClick={onCompartilhar}
                                size="lg"
                                variant="outline"
                                className="h-14 w-full rounded-full border-white/30 bg-white/10 text-lg font-bold text-white hover:bg-white/15"
                            >
                                Compartilhar vitoria
                            </Button>
                        )}

                        <Button
                            onClick={onContinuar}
                            size="lg"
                            className="h-14 w-full rounded-full bg-white text-[var(--color-coreduca-blue)] hover:bg-white/90 text-lg shadow-lg font-bold"
                        >
                            Continuar
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}
