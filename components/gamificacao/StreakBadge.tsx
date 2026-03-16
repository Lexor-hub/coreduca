'use client'

import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'

interface StreakBadgeProps {
    streak: number
    showLabel?: boolean
}

export function StreakBadge({ streak, showLabel = true }: StreakBadgeProps) {
    const isHot = streak > 0

    return (
        <motion.div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-bold shadow-sm border ${isHot
                    ? 'bg-[var(--color-coreduca-red)]/10 text-[var(--color-coreduca-red)] border-[var(--color-coreduca-red)]/20'
                    : 'bg-muted text-muted-foreground border-border/50'
                }`}
            animate={isHot ? {
                scale: [1, 1.05, 1],
            } : {}}
            transition={{
                repeat: Infinity,
                duration: 2,
                ease: 'easeInOut'
            }}
        >
            <Flame className={`h-4 w-4 ${isHot ? 'fill-current' : ''}`} />
            <span>{streak}</span>
            {showLabel && <span className="text-xs ml-0.5 font-semibold">dias</span>}
        </motion.div>
    )
}
