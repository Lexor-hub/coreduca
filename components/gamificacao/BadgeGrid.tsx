'use client'

import { motion } from 'framer-motion'

export interface BadgeItem {
    slug: string
    nome: string
    icone: string
    descricao?: string
}

interface BadgeGridProps {
    badges: BadgeItem[]
    earnedSlugs: string[]
}

export function BadgeGrid({ badges, earnedSlugs }: BadgeGridProps) {
    const earnedSet = new Set(earnedSlugs)

    if (badges.length === 0) {
        return <p className="text-xs text-muted-foreground italic">Nenhuma conquista ainda. Continue praticando para ganhar badges!</p>
    }

    return (
        <div className="flex flex-wrap gap-3">
            {badges.map((badge, i) => {
                const isEarned = earnedSet.has(badge.slug)
                return (
                    <motion.div
                        key={badge.slug}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm border
              ${isEarned
                                ? 'bg-[var(--color-coreduca-purple)]/10 border-[var(--color-coreduca-purple)]/20 text-[var(--color-coreduca-purple)]'
                                : 'bg-muted border-border/50 text-muted-foreground grayscale opacity-50'}
            `}
                        title={badge.descricao}
                    >
                        <span className="text-sm">{badge.icone}</span>
                        <span>{badge.nome}</span>
                    </motion.div>
                )
            })}
        </div>
    )
}
