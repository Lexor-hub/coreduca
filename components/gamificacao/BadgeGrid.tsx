'use client'

import { motion } from 'framer-motion'
import { streakMilestones } from '@/lib/coreduca'

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
    const streakMetaBySlug = new Map<string, (typeof streakMilestones)[number]>(
        streakMilestones.map((item) => [item.slug, item])
    )

    if (badges.length === 0) {
        return <p className="text-xs text-muted-foreground italic">Nenhuma conquista ainda. Continue praticando para ganhar badges!</p>
    }

    return (
        <div className="flex flex-wrap gap-3">
            {badges.map((badge, i) => {
                const isEarned = earnedSet.has(badge.slug)
                const streakMeta = streakMetaBySlug.get(badge.slug)
                return (
                    <motion.div
                        key={badge.slug}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className={[
                            'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold shadow-sm',
                            isEarned
                                ? streakMeta
                                    ? `bg-gradient-to-r ${streakMeta.gradientClass} border-white/20 text-white shadow-md`
                                    : 'bg-[var(--color-coreduca-purple)]/10 border-[var(--color-coreduca-purple)]/20 text-[var(--color-coreduca-purple)]'
                                : streakMeta
                                    ? 'border-dashed border-amber-200 bg-amber-50 text-amber-700 opacity-60'
                                    : 'bg-muted border-border/50 text-muted-foreground grayscale opacity-50',
                        ].join(' ')}
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
