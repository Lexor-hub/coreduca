'use client'

import { motion } from 'framer-motion'
import { Progress } from '@/components/ui/progress'

interface XPBarProps {
    xp: number
    nivel: string
    proximoNivelXp: number
}

export function XPBar({ xp, nivel, proximoNivelXp }: XPBarProps) {
    const progresso = Math.min((xp / proximoNivelXp) * 100, 100)

    // Map levels to readable text
    const levelLabels: Record<string, string> = {
        exploradora: 'Nível: Exploradora',
        primeiros_passos: 'Nível: Primeiros Passos',
        sobrevivencia: 'Nível: Sobrevivência',
        conversas_basicas: 'Nível: Conversas Básicas',
        vida_real: 'Nível: Vida Real',
        base_dominada: 'Nível: Base Dominada',
    }

    return (
        <div className="w-full space-y-2">
            <div className="flex justify-between items-end">
                <div className="font-bold text-sm text-[var(--color-coreduca-blue)]">
                    {levelLabels[nivel] || levelLabels.exploradora}
                </div>
                <div className="text-xs font-medium text-muted-foreground">
                    {xp} / {proximoNivelXp} XP
                </div>
            </div>
            <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '100%', opacity: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
            >
                <Progress value={progresso} className="h-3 [&>div]:bg-[var(--color-coreduca-blue)]" />
            </motion.div>
        </div>
    )
}
