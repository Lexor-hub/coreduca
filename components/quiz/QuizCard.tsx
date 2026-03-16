'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { QuestionTypeIcon } from './QuestionTypeIcon'
import type { Questao } from '@/types/database'

interface QuizCardProps {
    questao: Questao
    onResponder: (resposta: string) => void
    disabled?: boolean
    selectedAnswer?: string | null
    correctAnswer?: string | null
}

const culturalTypes = ['coreano_para_portugues', 'portugues_para_coreano']

export function QuizCard({ questao, onResponder, disabled, selectedAnswer, correctAnswer }: QuizCardProps) {
    let opcoes: string[] = []

    if (Array.isArray(questao.opcoes)) {
        opcoes = questao.opcoes
    }

    if (questao.tipo === 'verdadeiro_falso' && opcoes.length === 0) {
        opcoes = ['Verdadeiro', 'Falso']
    }

    const isCultural = culturalTypes.includes(questao.tipo)

    return (
        <motion.div
            key={questao.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full flex flex-col gap-6"
        >
            {/* Type indicator + cultural badge */}
            <div className="flex items-center justify-center gap-2">
                <QuestionTypeIcon tipo={questao.tipo} showLabel />
                {isCultural && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
                        🇰🇷 Tradução
                    </span>
                )}
            </div>

            {/* Enunciado */}
            <div className="text-center space-y-3">
                <h2 className="text-2xl font-extrabold">{questao.enunciado}</h2>
                {questao.enunciado_coreano && (
                    <div className="space-y-1">
                        <p className="text-3xl text-[var(--color-coreduca-blue)] font-black tracking-wide">
                            {questao.enunciado_coreano.replace(/\s*\(.*?\)\s*$/, '')}
                        </p>
                        {/* Show romanization if present in parentheses */}
                        {/\(([^)]+)\)\s*$/.test(questao.enunciado_coreano) && (
                            <p className="text-sm text-muted-foreground">
                                ({questao.enunciado_coreano.match(/\(([^)]+)\)\s*$/)?.[1]})
                            </p>
                        )}
                    </div>
                )}
                {questao.imagem_url && (
                    <div className="w-full h-40 bg-muted rounded-2xl flex items-center justify-center text-muted-foreground text-sm">
                        <img
                            src={questao.imagem_url}
                            alt=""
                            className="w-full h-full object-cover rounded-2xl"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none'
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 gap-3 mt-4">
                {opcoes.map((opcao, index) => {
                    let bgColor = 'bg-white hover:bg-secondary'
                    let textColor = 'text-foreground'
                    let borderColor = 'border-border'

                    if (disabled && selectedAnswer) {
                        if (opcao === correctAnswer) {
                            bgColor = 'bg-green-100'
                            borderColor = 'border-green-500'
                            textColor = 'text-green-700'
                        } else if (opcao === selectedAnswer && opcao !== correctAnswer) {
                            bgColor = 'bg-red-100'
                            borderColor = 'border-red-500'
                            textColor = 'text-red-700'
                        } else {
                            bgColor = 'bg-muted opacity-50'
                        }
                    }

                    return (
                        <Button
                            key={index}
                            variant="outline"
                            disabled={disabled}
                            onClick={() => onResponder(opcao)}
                            className={`h-16 text-lg justify-start px-6 rounded-2xl border-2 transition-all ${bgColor} ${borderColor} ${textColor}`}
                        >
                            <span className="mr-3 font-semibold text-muted-foreground">{index + 1}.</span>
                            {opcao}
                        </Button>
                    )
                })}
            </div>
        </motion.div>
    )
}
