'use client'

import { useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { ArrowLeft, Loader2, BookOpen, CheckCircle2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { useRouter } from 'next/navigation'
import { useRevisao } from '@/hooks/useRevisao'
import { QuizCard } from '@/components/quiz/QuizCard'
import { QuizFeedback } from '@/components/quiz/QuizFeedback'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function RevisaoPage() {
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()
    const userId = user?.id ?? null

    const {
        estado,
        questaoAtual,
        indiceAtual,
        totalQuestoes,
        ultimaRespostaCorreta,
        selectedAnswer,
        resultado,
        carregar,
        responder,
        avancar,
    } = useRevisao(userId || '')

    useEffect(() => {
        if (userId) {
            void carregar()
        }
    }, [userId, carregar])

    useEffect(() => {
        if (!authLoading && !userId) {
            router.replace('/login')
        }
    }, [authLoading, userId, router])

    if (authLoading || estado === 'carregando') {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <Loader2 className="w-12 h-12 text-[var(--color-coreduca-blue)] animate-spin" />
            </div>
        )
    }

    if (estado === 'vazio') {
        return (
            <div className="min-h-screen bg-background flex flex-col pt-[max(env(safe-area-inset-top),16px)]">
                <div className="px-4 py-3">
                    <div className="max-w-lg mx-auto flex items-center gap-4">
                        <button onClick={() => router.push('/aprender')} className="text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-6 w-6" />
                        </button>
                        <p className="text-sm font-bold">Revisao Diaria</p>
                    </div>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
                    <BookOpen className="h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">Nenhuma questao para revisar.</p>
                    <p className="text-xs text-muted-foreground">Complete missoes para gerar questoes de revisao.</p>
                    <Button onClick={() => router.push('/aprender')} variant="outline" className="rounded-full mt-2">
                        Voltar para Aprender
                    </Button>
                </div>
            </div>
        )
    }

    if (estado === 'concluido' && resultado) {
        const percentual = resultado.total > 0 ? Math.round((resultado.acertos / resultado.total) * 100) : 0
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center gap-6">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
                <h1 className="text-2xl font-black">Revisao Concluida!</h1>
                <div className="space-y-1">
                    <p className="text-lg font-bold">{resultado.acertos}/{resultado.total} questoes</p>
                    <p className="text-3xl font-black text-[var(--color-coreduca-blue)]">{percentual}% acerto</p>
                </div>
                <Button onClick={() => router.push('/aprender')} className="rounded-full px-8">
                    Continuar
                </Button>
            </div>
        )
    }

    if (!questaoAtual) return null

    const progress = ((indiceAtual + 1) / (totalQuestoes || 1)) * 100

    return (
        <div className="min-h-screen bg-background flex flex-col pt-[max(env(safe-area-inset-top),16px)]">
            <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-border/50 px-4 py-3">
                <div className="max-w-lg mx-auto space-y-3">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/aprender')} className="text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-6 w-6" />
                        </button>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold">Revisao Diaria</p>
                            <p className="truncate text-xs text-muted-foreground">Reforce o que voce errou</p>
                        </div>
                        <span className="text-sm font-bold text-muted-foreground">
                            {indiceAtual + 1}/{totalQuestoes}
                        </span>
                    </div>
                    <Progress value={progress} className="h-3 [&>div]:bg-[var(--color-coreduca-blue)]" />
                </div>
            </div>

            <div className="flex-1 flex flex-col max-w-lg mx-auto w-full p-4 overflow-y-auto pb-40">
                <div className="mb-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Pergunta {indiceAtual + 1}
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    <QuizCard
                        key={questaoAtual.id + '-' + indiceAtual}
                        questao={questaoAtual}
                        disabled={estado === 'feedback'}
                        selectedAnswer={selectedAnswer}
                        correctAnswer={questaoAtual.resposta_correta}
                        onResponder={(resposta) => responder(questaoAtual.id, resposta)}
                    />
                </AnimatePresence>
            </div>

            <QuizFeedback
                show={estado === 'feedback'}
                isCorrect={ultimaRespostaCorreta}
                correctAnswer={questaoAtual.resposta_correta}
                explanation={questaoAtual.explicacao}
                onAvancar={avancar}
            />
        </div>
    )
}
