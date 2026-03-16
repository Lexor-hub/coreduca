'use client'

import { motion } from 'framer-motion'

interface ScorePronunciaProps {
    score: number
    feedback: string
    transcricao: string
}

export function ScorePronuncia({ score, feedback, transcricao }: ScorePronunciaProps) {
    // Determine color based on score
    let colorClass = 'text-[var(--color-coreduca-blue)]'
    let ringColor = 'stroke-[var(--color-coreduca-blue)]'
    let bgColor = 'bg-[var(--color-coreduca-blue)]/10'

    if (score >= 80) {
        colorClass = 'text-green-600'
        ringColor = 'stroke-green-500'
        bgColor = 'bg-green-100'
    } else if (score < 50) {
        colorClass = 'text-[var(--color-coreduca-red)]'
        ringColor = 'stroke-[var(--color-coreduca-red)]'
        bgColor = 'bg-red-100'
    }

    const circleRadius = 60
    const circumference = 2 * Math.PI * circleRadius
    const dashoffset = circumference - (score / 100) * circumference

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center p-6 bg-white border rounded-3xl w-full max-w-sm mx-auto shadow-sm"
        >
            <div className="relative w-40 h-40 flex items-center justify-center mb-6">
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="80"
                        cy="80"
                        r={circleRadius}
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="transparent"
                        className="text-muted/30"
                    />
                    <motion.circle
                        cx="80"
                        cy="80"
                        r={circleRadius}
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="transparent"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: dashoffset }}
                        transition={{ duration: 1.5, ease: 'easeOut' }}
                        className={`transition-colors ${ringColor}`}
                    />
                </svg>
                <div className="absolute flex flex-col items-center">
                    <span className={`text-4xl font-black ${colorClass}`}>{score}%</span>
                    <span className="text-xs uppercase font-bold text-muted-foreground tracking-widest">Score</span>
                </div>
            </div>

            <div className={`w-full p-4 rounded-2xl mb-4 ${bgColor} text-center`}>
                <p className={`font-bold ${colorClass}`}>{feedback}</p>
            </div>

            <div className="w-full mt-2">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">O que ouvimos:</p>
                <p className="text-sm font-medium p-3 bg-muted rounded-xl">{transcricao || 'Não foi possível ouvir claramente.'}</p>
            </div>
        </motion.div>
    )
}
