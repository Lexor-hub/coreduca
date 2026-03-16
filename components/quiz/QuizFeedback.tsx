'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle } from 'lucide-react'

interface QuizFeedbackProps {
    show: boolean
    isCorrect: boolean | null
    correctAnswer?: string
}

export function QuizFeedback({ show, isCorrect, correctAnswer }: QuizFeedbackProps) {
    return (
        <AnimatePresence>
            {show && isCorrect !== null && (
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                    className={`fixed bottom-0 left-0 right-0 p-6 safe-area-bottom rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50 ${isCorrect ? 'bg-green-100' : 'bg-red-100'
                        }`}
                >
                    <div className="max-w-lg mx-auto flex items-start gap-4">
                        <div className={`mt-1 rounded-full bg-white p-1 shadow-sm ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                            {isCorrect ? <CheckCircle className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                        </div>
                        <div className="flex-1">
                            <h3 className={`text-xl font-black mb-1 ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                                {isCorrect ? 'Incrível!' : 'Quase lá!'}
                            </h3>
                            {!isCorrect && correctAnswer && (
                                <p className="text-red-900 font-medium">
                                    A resposta correta é: <span className="font-extrabold">{correctAnswer}</span>
                                </p>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
