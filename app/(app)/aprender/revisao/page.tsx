'use client'

import { useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { ArrowLeft, Loader2, BookOpen, CheckCircle2, RotateCcw, Sparkles } from 'lucide-react'
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
        erro,
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

    if (estado === 'erro') {
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
                <div className="flex-1 flex items-center justify-center p-6">
                    <Card className="w-full max-w-lg border-0 shadow-md">
                        <CardContent className="space-y-4 p-6 text-center">
                            <RotateCcw className="mx-auto h-10 w-10 text-[var(--color-coreduca-blue)]" />
                            <div className="space-y-2">
                                <h2 className="text-xl font-black">Nao foi possivel abrir sua revisao</h2>
                                <p className="text-sm text-muted-foreground">{erro}</p>
                            </div>
                            <Button onClick={() => carregar()} className="w-full rounded-full">
                                Tentar novamente
                            </Button>
                        </CardContent>
                    </Card>
                </div>
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
                    <Card className="w-full max-w-lg border-0 bg-[linear-gradient(180deg,#ffffff,rgba(235,243,255,0.7))] shadow-xl">
                        <CardContent className="space-y-4 p-8">
                            <BookOpen className="mx-auto h-12 w-12 text-[var(--color-coreduca-blue)]" />
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black">Nada pendente hoje</h2>
                                <p className="text-sm text-muted-foreground">Nenhuma questao para revisar agora.</p>
                                <p className="text-xs text-muted-foreground">Complete missoes para alimentar sua revisao diaria automaticamente.</p>
                            </div>
                            <Button onClick={() => router.push('/aprender')} variant="outline" className="rounded-full mt-2">
                                Voltar para Aprender
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    if (estado === 'concluido' && resultado) {
        const percentual = resultado.total > 0 ? Math.round((resultado.acertos / resultado.total) * 100) : 0
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center gap-6">
                <Card className="w-full max-w-lg overflow-hidden border-0 bg-[linear-gradient(135deg,#132034_0%,rgba(25,92,255,0.96)_100%)] text-white shadow-[0_28px_80px_rgba(19,32,52,0.22)]">
                    <CardContent className="space-y-6 p-8">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white/12">
                            <CheckCircle2 className="h-10 w-10 text-white" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/70">Revisao finalizada</p>
                            <h1 className="text-3xl font-black">Seu reforco do dia esta pronto</h1>
                            <p className="text-sm text-white/75">Revise de novo quando quiser para consolidar o que ainda estiver fraco.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-2xl bg-white/10 p-4">
                                <p className="text-xs uppercase tracking-[0.18em] text-white/65">Acertos</p>
                                <p className="mt-1 text-2xl font-black">{resultado.acertos}/{resultado.total}</p>
                            </div>
                            <div className="rounded-2xl bg-white/10 p-4">
                                <p className="text-xs uppercase tracking-[0.18em] text-white/65">Performance</p>
                                <p className="mt-1 text-2xl font-black">{percentual}%</p>
                            </div>
                        </div>
                        <Button onClick={() => router.push('/aprender')} className="w-full rounded-full bg-white text-[var(--color-coreduca-blue)] hover:bg-white/90">
                            Continuar aprendendo
                        </Button>
                    </CardContent>
                </Card>
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
                <Card className="mb-4 border-0 bg-[linear-gradient(180deg,#ffffff,rgba(235,243,255,0.72))] shadow-sm">
                    <CardContent className="flex items-start gap-3 p-4">
                        <div className="rounded-2xl bg-[var(--color-coreduca-blue)]/10 p-2 text-[var(--color-coreduca-blue)]">
                            <Sparkles className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-coreduca-blue)]">Modo revisao</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Aqui entram as questoes que voce ja errou. Foque em entender a explicacao antes de seguir.
                            </p>
                        </div>
                    </CardContent>
                </Card>

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
