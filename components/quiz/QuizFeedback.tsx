'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { QuizNextStep } from '@/hooks/useQuiz'

interface QuizFeedbackProps {
    show: boolean
    isCorrect: boolean | null
    correctAnswer?: string
    explanation?: string | null
    isRetryRound?: boolean
    nextStep?: QuizNextStep | null
    onAvancar: () => void
}

export function QuizFeedback({ show, isCorrect, correctAnswer, explanation, isRetryRound = false, nextStep, onAvancar }: QuizFeedbackProps) {
    let buttonLabel = isRetryRound
        ? isCorrect
            ? 'Seguir no reforco'
            : 'Tentar de novo'
        : isCorrect
            ? 'Continuar'
            : 'Entendi, proxima'

    if (nextStep === 'reforco') {
        buttonLabel = 'Ir para o reforco'
    } else if (nextStep === 'conclusao') {
        buttonLabel = 'Ver resultado'
    } else if (nextStep === 'seguir_reforco') {
        buttonLabel = 'Seguir no reforco'
    } else if (nextStep === 'repetir_reforco') {
        buttonLabel = 'Tentar de novo'
    }

    return (
        <AnimatePresence>
            {show && isCorrect !== null && (
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                    className={`fixed bottom-0 left-0 right-0 p-6 safe-area-bottom rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-[70] ${isCorrect ? 'bg-green-100' : 'bg-red-100'
                        }`}
                >
                    <div className="max-w-lg mx-auto flex flex-col gap-4">
                        <div className="flex items-start gap-4">
                            <div className={`mt-1 rounded-full bg-white p-1 shadow-sm ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                {isCorrect ? <CheckCircle className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                            </div>
                            <div className="flex-1">
                                <h3 className={`text-xl font-black mb-1 ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                                    {isCorrect ? 'Incrivel!' : 'Quase la!'}
                                </h3>
                                {isRetryRound && (
                                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-700">
                                        Rodada de reforco
                                    </p>
                                )}
                                {!isCorrect && correctAnswer && (
                                    <p className="text-red-900 font-medium">
                                        A resposta correta e: <span className="font-extrabold">{correctAnswer}</span>
                                    </p>
                                )}
                                {explanation && (
                                    <p className={`mt-2 text-sm leading-relaxed ${isCorrect ? 'text-green-900' : 'text-red-900'}`}>
                                        {explanation}
                                    </p>
                                )}
                            </div>
                        </div>
                        <Button
                            onClick={onAvancar}
                            className={`w-full rounded-full text-white font-bold ${
                                isCorrect
                                    ? 'bg-green-600 hover:bg-green-700'
                                    : 'bg-red-600 hover:bg-red-700'
                            }`}
                        >
                            {buttonLabel}
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
