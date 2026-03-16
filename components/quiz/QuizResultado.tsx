'use client'

import { motion } from 'framer-motion'
import { Trophy, Star, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface QuizResultadoProps {
    score: number
    xpGanho: number
    badgeNome?: string | null
    progressoResumo?: string | null
    onContinuar: () => void
}

export function QuizResultado({ score, xpGanho, badgeNome, progressoResumo, onContinuar }: QuizResultadoProps) {
    const isPerfect = score === 100

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
        >
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="w-24 h-24 bg-[var(--color-coreduca-yellow)]/20 rounded-full flex items-center justify-center mb-6"
            >
                <Trophy className="w-12 h-12 text-[var(--color-coreduca-yellow)]" />
            </motion.div>

            <h2 className="text-3xl font-black text-foreground mb-2">
                {isPerfect ? 'Perfeito!' : 'Missão Concluída!'}
            </h2>
            <p className="text-muted-foreground mb-8">
                Você mandou super bem e completou o desafio.
            </p>

            {badgeNome && (
                <div className="mb-4 rounded-full bg-[var(--color-coreduca-red)]/10 px-4 py-2 text-sm font-bold text-[var(--color-coreduca-red)]">
                    Badge desbloqueada: {badgeNome}
                </div>
            )}

            <div className="grid grid-cols-2 gap-4 w-full max-w-xs mb-8">
                <div className="bg-[var(--color-coreduca-blue)]/10 rounded-2xl p-4 flex flex-col items-center border border-[var(--color-coreduca-blue)]/20">
                    <span className="text-xs font-bold text-[var(--color-coreduca-blue)] uppercase tracking-wider mb-1">Score</span>
                    <span className="text-2xl font-black text-[var(--color-coreduca-blue)]">{score}%</span>
                </div>
                <div className="bg-[var(--color-coreduca-yellow)]/10 rounded-2xl p-4 flex flex-col items-center border border-[var(--color-coreduca-yellow)]/20">
                    <span className="text-xs font-bold text-[var(--color-coreduca-yellow)] uppercase tracking-wider mb-1">XP Ganho</span>
                    <div className="flex items-center gap-1">
                        <Star className="w-5 h-5 text-[var(--color-coreduca-yellow)] fill-current" />
                        <span className="text-2xl font-black text-[var(--color-coreduca-yellow)]">+{xpGanho}</span>
                    </div>
                </div>
            </div>

            {progressoResumo && (
                <p className="mb-6 text-sm font-medium text-muted-foreground">
                    {progressoResumo}
                </p>
            )}

            <Button
                onClick={onContinuar}
                size="lg"
                className="w-full max-w-xs rounded-full h-14 bg-[var(--color-coreduca-blue)] hover:bg-[var(--color-coreduca-blue)]/90 text-lg shadow-lg font-bold"
            >
                Continuar
                <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
        </motion.div>
    )
}
