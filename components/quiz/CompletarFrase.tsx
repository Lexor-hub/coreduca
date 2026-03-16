'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { QuestionTypeIcon } from './QuestionTypeIcon'
import type { Questao } from '@/types/database'

interface CompletarFraseProps {
    questao: Questao
    onResponder: (resposta: string) => void
    disabled?: boolean
    selectedAnswer?: string | null
    correctAnswer?: string | null
}

export function CompletarFrase({ questao, onResponder, disabled, selectedAnswer, correctAnswer }: CompletarFraseProps) {
    const [input, setInput] = useState('')

    const hasAnswered = disabled && selectedAnswer !== null
    const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')
    const isCorrect = hasAnswered && correctAnswer ? normalize(selectedAnswer!) === normalize(correctAnswer) : null

    let inputBorder = 'border-border'
    if (hasAnswered) {
        inputBorder = isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
    }

    return (
        <motion.div
            key={questao.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full flex flex-col gap-6"
        >
            <div className="flex items-center justify-center gap-2">
                <QuestionTypeIcon tipo={questao.tipo} showLabel />
            </div>

            <div className="text-center space-y-3">
                <h2 className="text-2xl font-extrabold">{questao.enunciado}</h2>
                {questao.enunciado_coreano && (
                    <div className="space-y-1">
                        <p className="text-3xl text-[var(--color-coreduca-blue)] font-black tracking-wide">
                            {questao.enunciado_coreano.replace(/\s*\(.*?\)\s*$/, '')}
                        </p>
                        {/\(([^)]+)\)\s*$/.test(questao.enunciado_coreano) && (
                            <p className="text-sm text-muted-foreground">
                                ({questao.enunciado_coreano.match(/\(([^)]+)\)\s*$/)?.[1]})
                            </p>
                        )}
                    </div>
                )}
            </div>

            <div className="space-y-3 mt-4">
                <input
                    type="text"
                    value={disabled ? (selectedAnswer ?? '') : input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={disabled}
                    placeholder="Digite sua resposta..."
                    className={`w-full h-14 text-lg px-4 rounded-2xl border-2 transition-all outline-none focus:ring-2 focus:ring-[var(--color-coreduca-blue)]/30 ${inputBorder}`}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && input.trim() && !disabled) {
                            onResponder(input.trim())
                        }
                    }}
                />
                {!disabled && (
                    <Button
                        onClick={() => onResponder(input.trim())}
                        disabled={!input.trim()}
                        className="w-full rounded-full"
                    >
                        Confirmar
                    </Button>
                )}
                {hasAnswered && !isCorrect && correctAnswer && (
                    <p className="text-sm text-center text-red-600 font-medium">
                        Resposta correta: <span className="font-bold">{correctAnswer}</span>
                    </p>
                )}
            </div>
        </motion.div>
    )
}
