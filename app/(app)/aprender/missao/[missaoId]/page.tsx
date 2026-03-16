'use client'

import { useEffect, use } from 'react'
import { AnimatePresence } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { useRouter } from 'next/navigation'
import { useQuiz } from '@/hooks/useQuiz'
import { QuizCard } from '@/components/quiz/QuizCard'
import { QuizFeedback } from '@/components/quiz/QuizFeedback'
import { QuizResultado } from '@/components/quiz/QuizResultado'
import { useAuth } from '@/lib/auth-context'

export default function MissaoQuizPage({ params }: { params: Promise<{ missaoId: string }> }) {
    const resolvedParams = use(params)
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()
    const userId = user?.id ?? null

    const {
        estado,
        questoes,
        indiceAtual,
        ultimaRespostaCorreta,
        selectedAnswer,
        resultado,
        iniciar,
        responder,
    } = useQuiz(resolvedParams.missaoId, userId || '')

    useEffect(() => {
        if (userId) {
            iniciar()
        }
    }, [userId, iniciar])

    // Se estiver carregando ainda
    if (authLoading || estado === 'carregando' || !userId) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <Loader2 className="w-12 h-12 text-[var(--color-coreduca-blue)] animate-spin" />
            </div>
        )
    }

    // Se concluiu
    if (estado === 'concluido' && resultado) {
        const progressoResumo =
            resultado.total_missoes > 0
                ? `${resultado.missoes_concluidas}/${resultado.total_missoes} missoes concluidas nesta trilha`
                : null

        return (
            <QuizResultado
                score={resultado.score}
                xpGanho={resultado.xp_ganho}
                badgeNome={resultado.badge_nome}
                progressoResumo={progressoResumo}
                onContinuar={() => router.push('/aprender')}
            />
        )
    }

    const questao = questoes[indiceAtual]

    // Safety check just in case there's no question array
    if (!questao) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <p className="text-muted-foreground">Nenhuma questão encontrada nesta missão.</p>
                <button onClick={() => router.push('/aprender')} className="mt-4 text-blue-500 font-bold">Voltar</button>
            </div>
        )
    }

    const progress = ((indiceAtual) / (questoes.length || 1)) * 100
    const isActiveRound = estado === 'respondendo' || estado === 'reforco'

    return (
        <div className="min-h-screen bg-background flex flex-col pt-[max(env(safe-area-inset-top),16px)]">
            {/* Header com Progresso */}
            <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-border/50 px-4 py-3">
                <div className="max-w-lg mx-auto flex items-center gap-4">
                    <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">
                        <X className="h-6 w-6" />
                    </button>
                    <Progress value={progress} className="h-3 flex-1 [&>div]:bg-[var(--color-coreduca-blue)]" />
                    <span className="text-sm font-bold text-muted-foreground min-w-[3rem] text-right">
                        {indiceAtual + 1}/{questoes.length}
                    </span>
                </div>
            </div>

            {/* Viewport da Questão */}
            <div className="flex-1 flex flex-col max-w-lg mx-auto w-full p-4 overflow-y-auto pb-40">
                <AnimatePresence mode="wait">
                    {isActiveRound && (
                        <QuizCard
                            key={questao.id}
                            questao={questao}
                            selectedAnswer={selectedAnswer}
                            correctAnswer={questao.resposta_correta}
                            onResponder={(resposta) => responder(questao.id, resposta)}
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Sheet Feedback */}
            <QuizFeedback
                show={estado === 'feedback'}
                isCorrect={ultimaRespostaCorreta}
                correctAnswer={questao.resposta_correta}
            />
        </div>
    )
}
