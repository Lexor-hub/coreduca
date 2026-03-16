'use client'

import { motion } from 'framer-motion'
import { Flame, Sparkles } from 'lucide-react'
import { getCurrentStreakMilestone, getNextStreakMilestone } from '@/lib/coreduca'

interface StreakBadgeProps {
    streak: number
    showLabel?: boolean
}

export function StreakBadge({ streak, showLabel = true }: StreakBadgeProps) {
    const isHot = streak > 0
    const currentMilestone = getCurrentStreakMilestone(streak)
    const nextMilestone = getNextStreakMilestone(streak)
    const remainingDays = nextMilestone ? Math.max(nextMilestone.threshold - streak, 0) : 0

    const accentClass = currentMilestone?.surfaceClass
        || (isHot
            ? 'bg-[var(--color-coreduca-red)]/10 text-[var(--color-coreduca-red)] border-[var(--color-coreduca-red)]/20'
            : 'bg-muted text-muted-foreground border-border/50')
    const milestoneCopy = currentMilestone
        ? currentMilestone.nome
        : nextMilestone
            ? `${remainingDays} para ${nextMilestone.nome}`
            : 'Comece sua sequencia'

    return (
        <motion.div
            className={`flex items-center gap-2 rounded-2xl border px-2.5 py-1.5 shadow-sm ${accentClass}`}
            animate={isHot ? {
                scale: [1, 1.05, 1],
            } : {}}
            transition={{
                repeat: Infinity,
                duration: 2,
                ease: 'easeInOut'
            }}
            title={currentMilestone?.descricao || milestoneCopy}
        >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/70 text-base shadow-inner">
                <span aria-hidden>{currentMilestone?.icone || (isHot ? '🔥' : '🌱')}</span>
            </div>
            <div className="flex min-w-0 flex-col leading-none">
                <div className="flex items-center gap-1">
                    <Flame className={`h-3.5 w-3.5 ${isHot ? 'fill-current' : ''}`} />
                    <span className="text-sm font-extrabold">{streak}</span>
                    {showLabel && <span className="text-[11px] font-semibold opacity-80">dias</span>}
                </div>
                {showLabel && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold opacity-90">
                        <Sparkles className="h-3 w-3" />
                        <span className="truncate">{milestoneCopy}</span>
                    </div>
                )}
            </div>
        </motion.div>
    )
}
